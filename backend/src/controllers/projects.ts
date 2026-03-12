import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

export async function listProjects(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.auth!.tenantId;
  try {
    const projects = await prisma.project.findMany({
      where: { tenantId },
      include: { _count: { select: { issues: true } } },
      orderBy: { name: 'asc' },
    });
    return res.json(projects);
  } catch (err) { next(err); }
}

export async function createProject(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.auth!.tenantId;
  const { name, description, color } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Project name required' });
  try {
    const project = await prisma.project.create({
      data: { name, description, color: color || '#6366f1', tenantId },
    });
    return res.status(201).json(project);
  } catch (err) { next(err); }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const tenantId = req.auth!.tenantId;
  try {
    const existing = await prisma.project.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'Project not found' });
    await prisma.project.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) { next(err); }
}
