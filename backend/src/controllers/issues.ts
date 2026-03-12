import { Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../utils/prisma';

export const createIssueValidation = [
  body('title').trim().isLength({ min: 3, max: 255 }),
  body('description').optional().trim(),
  body('status').optional().isIn(['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']),
  body('priority').optional().isIn(['URGENT', 'HIGH', 'MEDIUM', 'LOW']),
  body('projectId').optional().isUUID(),
  body('assignedToId').optional().isUUID(),
  body('labelIds').optional().isArray(),
  body('dueDate').optional().isISO8601(),
];


// GET /api/issues
export async function listIssues(req: Request, res: Response, next: NextFunction) {
  const { status, priority, projectId, assignedToId, page = '1', limit = '20' } = req.query as Record<string, string>;
  const tenantId = req.auth!.tenantId;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      tenantId, 
      ...(status && { status: status as any }),
      ...(priority && { priority: priority as any }),
      ...(projectId && { projectId }),
      ...(assignedToId && { assignedToId }),
    };

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true, color: true } },
          labels: { include: { label: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.issue.count({ where }),
    ]);

    return res.json({
      data: issues,
      meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/issues/:id
export async function getIssue(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const tenantId = req.auth!.tenantId;

  try {
    const issue = await prisma.issue.findFirst({
      where: { id, tenantId }, // ← Both id AND tenantId required
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, color: true } },
        labels: { include: { label: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    return res.json(issue);
  } catch (err) {
    next(err);
  }
}

// POST /api/issues
export async function createIssue(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const tenantId = req.auth!.tenantId;
  const { title, description, status, priority, projectId, assignedToId, labelIds, dueDate } = req.body;

  try {
 
    if (assignedToId) {
      const assignee = await prisma.user.findFirst({ where: { id: assignedToId, tenantId } });
      if (!assignee) return res.status(400).json({ error: 'Assignee not found in your organization' });
    }

  
    if (projectId) {
      const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
      if (!project) return res.status(400).json({ error: 'Project not found in your organization' });
    }

    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        status: status || 'OPEN',
        priority: priority || 'MEDIUM',
        tenantId,
        createdById: req.auth!.userId,
        assignedToId,
        projectId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        labels: labelIds?.length ? {
          create: labelIds.map((labelId: string) => ({ labelId })),
        } : undefined,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, color: true } },
        labels: { include: { label: true } },
      },
    });

    return res.status(201).json(issue);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/issues/:id
export async function updateIssue(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const tenantId = req.auth!.tenantId;

  try {

    const existing = await prisma.issue.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'Issue not found' });

    const { title, description, status, priority, assignedToId, projectId, labelIds, dueDate } = req.body;

    const issue = await prisma.issue.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedToId !== undefined && { assignedToId }),
        ...(projectId !== undefined && { projectId }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(labelIds && {
          labels: {
            deleteMany: {},
            create: labelIds.map((labelId: string) => ({ labelId })),
          },
        }),
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, color: true } },
        labels: { include: { label: true } },
      },
    });

    return res.json(issue);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/issues/:id
export async function deleteIssue(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const tenantId = req.auth!.tenantId;

  try {
    const existing = await prisma.issue.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'Issue not found' });

    await prisma.issue.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// GET /api/issues/stats
export async function getStats(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.auth!.tenantId;

  try {
    const [byStatus, byPriority, recentActivity] = await Promise.all([
      prisma.issue.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
      prisma.issue.groupBy({
        by: ['priority'],
        where: { tenantId },
        _count: true,
      }),
      prisma.issue.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, status: true, priority: true, updatedAt: true },
      }),
    ]);

    return res.json({ byStatus, byPriority, recentActivity });
  } catch (err) {
    next(err);
  }
}

// POST /api/issues/:id/comments
export async function addComment(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const tenantId = req.auth!.tenantId;
  const { body: commentBody } = req.body;

  if (!commentBody?.trim()) return res.status(400).json({ error: 'Comment body required' });

  try {
    const issue = await prisma.issue.findFirst({ where: { id, tenantId } });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    const comment = await prisma.comment.create({
      data: { body: commentBody, issueId: id, authorId: req.auth!.userId },
      include: { author: { select: { id: true, name: true, email: true } } },
    });

    return res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}
