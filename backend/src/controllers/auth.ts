import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { signToken } from '../utils/jwt';
import { createError } from '../middleware/errorHandler';

export const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().isLength({ min: 2 }),
  body('tenantName').trim().isLength({ min: 2 }).withMessage('Organization name required'),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

export async function register(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, name, tenantName } = req.body;

  try {
    const slug = tenantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      return res.status(409).json({ error: 'Organization name already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { user, tenant } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: tenantName, slug },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: 'OWNER',
          tenantId: tenant.id,
        },
      });

      await tx.label.createMany({
        data: [
          { name: 'bug', color: '#ef4444', tenantId: tenant.id },
          { name: 'feature', color: '#22c55e', tenantId: tenant.id },
          { name: 'improvement', color: '#3b82f6', tenantId: tenant.id },
          { name: 'docs', color: '#f59e0b', tenantId: tenant.id },
        ],
      });

      return { user, tenant };
    });

    const token = signToken({
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      role: user.role,
    });

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: { email },
      include: { tenant: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    });

    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        plan: user.tenant.plan,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      include: { tenant: true },
      omit: { passwordHash: true },
    } as Parameters<typeof prisma.user.findUnique>[0]);

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    next(err);
  }
}
