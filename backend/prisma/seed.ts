import { PrismaClient, Role, Priority, Status } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const acme = await prisma.tenant.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      plan: 'PRO',
    },
  });

  const acmeOwner = await prisma.user.upsert({
    where: { email_tenantId: { email: 'alice@acme.com', tenantId: acme.id } },
    update: {},
    create: {
      email: 'alice@acme.com',
      name: 'Alice Chen',
      passwordHash: await bcrypt.hash('password123', 12),
      role: Role.OWNER,
      tenantId: acme.id,
    },
  });

  const acmeDev = await prisma.user.upsert({
    where: { email_tenantId: { email: 'bob@acme.com', tenantId: acme.id } },
    update: {},
    create: {
      email: 'bob@acme.com',
      name: 'Bob Martinez',
      passwordHash: await bcrypt.hash('password123', 12),
      role: Role.MEMBER,
      tenantId: acme.id,
    },
  });

  const acmeProject = await prisma.project.upsert({
    where: { name_tenantId: { name: 'Platform v2', tenantId: acme.id } },
    update: {},
    create: {
      name: 'Platform v2',
      description: 'Next generation platform rebuild',
      color: '#6366f1',
      tenantId: acme.id,
    },
  });

  const acmeLabel1 = await prisma.label.upsert({
    where: { name_tenantId: { name: 'bug', tenantId: acme.id } },
    update: {},
    create: { name: 'bug', color: '#ef4444', tenantId: acme.id },
  });

  const acmeLabel2 = await prisma.label.upsert({
    where: { name_tenantId: { name: 'feature', tenantId: acme.id } },
    update: {},
    create: { name: 'feature', color: '#22c55e', tenantId: acme.id },
  });

  // Create issues for Acme
  const acmeIssues = [
    { title: 'Login page throws 500 on empty password', status: Status.OPEN, priority: Priority.URGENT, description: 'When user submits login form with empty password field, server returns 500 instead of 400 validation error.' },
    { title: 'Implement OAuth2 social login', status: Status.IN_PROGRESS, priority: Priority.HIGH, description: 'Add Google and GitHub OAuth2 providers.' },
    { title: 'Dashboard charts not rendering on Safari', status: Status.OPEN, priority: Priority.HIGH, description: 'The recharts library has a known Safari 16 compatibility issue.' },
    { title: 'Add CSV export for reports', status: Status.IN_REVIEW, priority: Priority.MEDIUM, description: 'Users need to export their data to CSV format.' },
    { title: 'Optimize database queries for large datasets', status: Status.DONE, priority: Priority.HIGH, description: 'N+1 queries detected in the issues list endpoint.' },
    { title: 'User profile page missing avatar upload', status: Status.OPEN, priority: Priority.LOW, description: 'The avatar upload component was removed in last refactor.' },
  ];

  for (const issue of acmeIssues) {
    await prisma.issue.create({
      data: {
        ...issue,
        tenantId: acme.id,
        projectId: acmeProject.id,
        createdById: acmeOwner.id,
        assignedToId: acmeDev.id,
        labels: {
          create: [{ labelId: issue.priority === Priority.URGENT ? acmeLabel1.id : acmeLabel2.id }],
        },
      },
    });
  }

  const globex = await prisma.tenant.upsert({
    where: { slug: 'globex-industries' },
    update: {},
    create: {
      name: 'Globex Industries',
      slug: 'globex-industries',
      plan: 'ENTERPRISE',
    },
  });

  const globexOwner = await prisma.user.upsert({
    where: { email_tenantId: { email: 'hank@globex.com', tenantId: globex.id } },
    update: {},
    create: {
      email: 'hank@globex.com',
      name: 'Hank Scorpio',
      passwordHash: await bcrypt.hash('password123', 12),
      role: Role.OWNER,
      tenantId: globex.id,
    },
  });

  const globexProject = await prisma.project.upsert({
    where: { name_tenantId: { name: 'Fusion Reactor UI', tenantId: globex.id } },
    update: {},
    create: {
      name: 'Fusion Reactor UI',
      description: 'Control panel for the fusion reactor',
      color: '#f59e0b',
      tenantId: globex.id,
    },
  });

  const globexLabel = await prisma.label.upsert({
    where: { name_tenantId: { name: 'critical', tenantId: globex.id } },
    update: {},
    create: { name: 'critical', color: '#dc2626', tenantId: globex.id },
  });

  const globexIssues = [
    { title: 'Reactor temperature gauge shows incorrect unit', status: Status.OPEN, priority: Priority.URGENT, description: 'Celsius values displayed as Fahrenheit in the dashboard widget.' },
    { title: 'Emergency shutdown button unresponsive on Firefox', status: Status.IN_PROGRESS, priority: Priority.URGENT, description: 'Critical safety UI issue — Firefox 120 regression.' },
    { title: 'Add multi-language support (i18n)', status: Status.OPEN, priority: Priority.MEDIUM, description: 'Support English, German, and Japanese.' },
    { title: 'Dark mode flicker on page load', status: Status.DONE, priority: Priority.LOW, description: 'Flash of unstyled content before theme loads.' },
  ];

  for (const issue of globexIssues) {
    await prisma.issue.create({
      data: {
        ...issue,
        tenantId: globex.id,
        projectId: globexProject.id,
        createdById: globexOwner.id,
        labels: { create: [{ labelId: globexLabel.id }] },
      },
    });
  }

  const initech = await prisma.tenant.upsert({
    where: { slug: 'initech' },
    update: {},
    create: {
      name: 'Initech Solutions',
      slug: 'initech',
      plan: 'FREE',
    },
  });

  await prisma.user.upsert({
    where: { email_tenantId: { email: 'peter@initech.com', tenantId: initech.id } },
    update: {},
    create: {
      email: 'peter@initech.com',
      name: 'Peter Gibbons',
      passwordHash: await bcrypt.hash('password123', 12),
      role: Role.OWNER,
      tenantId: initech.id,
    },
  });

  console.log('✅ Seed complete!');
  console.log('\n📋 Demo Accounts:');
  console.log('  alice@acme.com     / password123  (Acme Corp - PRO)');
  console.log('  bob@acme.com       / password123  (Acme Corp - member)');
  console.log('  hank@globex.com    / password123  (Globex Industries - ENTERPRISE)');
  console.log('  peter@initech.com  / password123  (Initech Solutions - FREE)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
