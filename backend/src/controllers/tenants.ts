import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

// GET /api/tenants/me — current tenant info + members
export async function getTenant(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.auth!.tenantId;
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true, createdAt: true },
          orderBy: { name: 'asc' },
        },
        labels: true,
        _count: { select: { issues: true, projects: true, users: true } },
      },
    });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    return res.json(tenant);
  } catch (err) { next(err); }
}

// POST /api/tenants/invite — invite member (simplified, no email)
export async function inviteMember(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.auth!.tenantId;
  const { email, name, role = 'MEMBER' } = req.body;
  const bcrypt = await import('bcryptjs');

  if (!email || !name) return res.status(400).json({ error: 'Email and name required' });

  try {
    const existing = await prisma.user.findFirst({ where: { email, tenantId } });
    if (existing) return res.status(409).json({ error: 'User already in organization' });

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: await bcrypt.hash('changeme123', 12),
        role,
        tenantId,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return res.status(201).json({ ...user, tempPassword: 'changeme123' });
  } catch (err) { next(err); }
}
