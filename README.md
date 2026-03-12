# IssueFlow — Multi-Tenant Issue Tracker

A production-grade, multi-tenant SaaS issue tracker built as a technical assessment demonstrating **systemic vision**: secure data isolation, clean architecture, and a polished frontend — all in a unified monorepo.

---

## 🗂 Repository Structure

```
issue-tracker/
├── backend/                  # Node.js / Express / Prisma API
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema (single source of truth)
│   │   └── seed.ts           # Demo data for 3 fictitious companies
│   ├── src/
│   │   ├── controllers/      # Route handlers (auth, issues, projects, tenants)
│   │   ├── middleware/        # auth.ts (JWT + tenant injection), errorHandler.ts
│   │   ├── routes/           # Express routers
│   │   └── utils/            # prisma.ts singleton, jwt.ts helpers
│   └── package.json
├── frontend/                 # Next.js 14 App Router + React Query
│   └── src/
│       ├── app/
│       │   ├── login/        # Auth page (login + register)
│       │   └── dashboard/    # Protected routes (overview, issues, projects, team)
│       ├── lib/              # api.ts (axios), auth.tsx (context), utils.ts
│       └── types/            # Shared TypeScript interfaces
└── README.md
```

---

## 🏗 Architecture Deep-Dive

### 1. Multi-Tenancy Strategy: Shared Database, Separate Rows

This project uses the **Shared Database, Shared Schema** (Row-Level Security) pattern — the most common SaaS approach.

**Why not separate databases per tenant?**
- Operationally expensive (N databases to migrate, back up, and monitor)
- Complex connection pooling
- Overkill for most SaaS at early/mid scale

**Why not separate schemas per tenant?**
- Prisma has limited multi-schema support
- Still complex to migrate all schemas simultaneously

**Row-Level Security via Application Layer:**
Every table that holds tenant-owned data has a `tenantId` column. The enforcement is in the application middleware, not the database.

```
Request → JWT Middleware → Extract tenantId → Inject into all DB queries
```

### 2. The Tenant Isolation Model

```
┌─────────────────────────────────────────────────────┐
│                    JWT Token                        │
│  { userId, tenantId, email, role }                  │
│          ↑ Signed server-side, tamper-proof         │
└──────────────────────┬──────────────────────────────┘
                       │
              ┌────────▼────────┐
              │  authenticate() │  middleware/auth.ts
              │  Middleware      │
              └────────┬────────┘
                       │ req.auth.tenantId
                       │
          ┌────────────▼────────────────┐
          │    Every DB Query           │
          │    WHERE tenantId = req.auth.tenantId  │
          └─────────────────────────────┘
```

**Key insight**: `tenantId` is *never* read from the request body for security-sensitive operations — it's always extracted from the validated JWT. A malicious user cannot forge their `tenantId`.

### 3. Database Schema Design

```
Tenant (1)
  └── Users (N)          — email unique per tenant (not globally)
  └── Projects (N)       — organizational groupings
  └── Issues (N)         — core entity; indexed on (tenantId, status)
      └── Comments (N)   — scoped via Issue's tenantId (no direct tenantId needed)
      └── IssueLabels    — many-to-many join
  └── Labels (N)         — tenant-owned tag vocabulary
```

**Critical indexes:**
```sql
-- Primary tenant isolation index
CREATE INDEX ON issues (tenant_id);

-- Composite indexes for common filtered queries
CREATE INDEX ON issues (tenant_id, status);
CREATE INDEX ON issues (tenant_id, priority);
```

**Unique constraint design:**
```sql
-- Email is unique *per tenant*, not globally
-- Alice can have accounts at both Acme and Globex
UNIQUE (email, tenant_id)

-- Project names unique per tenant
UNIQUE (name, tenant_id)
```

### 4. Authentication & Security

**JWT Payload:**
```json
{
  "userId": "uuid",
  "tenantId": "uuid",   ← tenant boundary embedded in token
  "email": "alice@acme.com",
  "role": "OWNER",
  "iat": 1234567890,
  "exp": 1235172690
}
```

**Security layers:**
1. **Helmet.js** — sets 11 security HTTP headers (X-Frame-Options, CSP, etc.)
2. **Rate limiting** — 100 req/15min global; 20 req/15min on auth endpoints
3. **CORS** — restricted to `FRONTEND_URL` env var only
4. **bcrypt (rounds=12)** — password hashing
5. **Input validation** — `express-validator` on all mutation routes
6. **Tenant cross-contamination prevention** — every query uses `findFirst({ where: { id, tenantId } })` not `findUnique({ where: { id } })`

**The critical security pattern (issues controller):**
```typescript
// ❌ INSECURE — trusts the id alone
const issue = await prisma.issue.findUnique({ where: { id } });

// ✅ SECURE — validates both id AND tenant ownership
const issue = await prisma.issue.findFirst({
  where: { id, tenantId: req.auth!.tenantId }
});
if (!issue) return res.status(404).json({ error: 'Issue not found' });
// Returning 404 (not 403) prevents enumeration attacks
```

### 5. Frontend Architecture

**State management stack:**
- **React Query (TanStack Query)** — server state, caching, background refetch
- **React Context (AuthContext)** — user/tenant/token in memory + localStorage
- **Local component state** — UI state (modals, filters, form values)

**API client (axios interceptors):**
```typescript
// Request interceptor — auto-attach JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — auto-redirect on 401
api.interceptors.response.use(res => res, error => {
  if (error.response?.status === 401) {
    localStorage.clear();
    window.location.href = '/login';
  }
  return Promise.reject(error);
});
```

**Route protection:** Layout components check `useAuth()` state and redirect unauthenticated users to `/login` via `useEffect`.

---

## 🚀 Deployment

### Option A: Railway (Recommended — one-click)

1. Create a Railway project
2. Add a PostgreSQL service
3. Deploy backend service:
   ```
   Root: /backend
   Build: npm install && npx prisma generate && npm run build
   Start: npm start
   Variables: DATABASE_URL (from Railway Postgres), JWT_SECRET, FRONTEND_URL
   ```
4. Deploy frontend service:
   ```
   Root: /frontend
   Build: npm install && npm run build
   Start: npm start
   Variables: NEXT_PUBLIC_API_URL (backend Railway URL)
   ```

### Option B: Docker Compose (Local/Self-hosted)

```yaml
version: '3.8'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: issue_tracker
      POSTGRES_PASSWORD: password
    ports: ["5432:5432"]

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/issue_tracker
      JWT_SECRET: your-secret-here
      FRONTEND_URL: http://localhost:3000
    ports: ["4000:4000"]
    depends_on: [db]

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
    ports: ["3000:3000"]
    depends_on: [backend]
```

### Option C: Vercel + Railway

- Frontend → Vercel (Next.js optimized)
- Backend → Railway
- Database → Railway PostgreSQL or Supabase

---

## 🛠 Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm

### Steps

```bash
# 1. Clone and install
git clone <repo-url>
cd issue-tracker

# 2. Backend setup
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
npm install

# 3. Database setup
npx prisma migrate dev --name init
npx prisma generate
npx ts-node prisma/seed.ts

# 4. Start backend
npm run dev
# → http://localhost:4000

# 5. Frontend setup (new terminal)
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
# → http://localhost:3000
```

---

## 🧪 Demo Accounts

All accounts use password: **`password123`**

| Email | Organization | Plan | Role |
|-------|-------------|------|------|
| alice@acme.com | Acme Corporation | PRO | Owner |
| bob@acme.com | Acme Corporation | PRO | Member |
| hank@globex.com | Globex Industries | Enterprise | Owner |
| peter@initech.com | Initech Solutions | Free | Owner |

**Test tenant isolation:** Log in as alice@acme.com and as hank@globex.com in separate browsers. Each sees only their own organization's issues.

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create org + owner account |
| POST | `/api/auth/login` | Login, receive JWT |
| GET | `/api/auth/me` | Current user + tenant |

### Issues
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/issues` | List (paginated, filterable) |
| GET | `/api/issues/stats` | Status/priority breakdown |
| GET | `/api/issues/:id` | Single issue with comments |
| POST | `/api/issues` | Create issue |
| PATCH | `/api/issues/:id` | Update issue |
| DELETE | `/api/issues/:id` | Delete issue |
| POST | `/api/issues/:id/comments` | Add comment |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| DELETE | `/api/projects/:id` | Delete project |

### Tenants
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tenants/me` | Org info + members + labels |
| POST | `/api/tenants/invite` | Add member (OWNER/ADMIN only) |

---

## 🔮 Production Considerations / What I'd Add Next

1. **Database-level RLS** — PostgreSQL Row Level Security policies as a second enforcement layer (defense in depth)
2. **Refresh tokens** — Short-lived access tokens + refresh token rotation
3. **Audit log** — Immutable log of who did what and when, per tenant
4. **Email invitations** — Real invite flow with tokenized links (currently simplified)
5. **Webhooks** — Tenants can subscribe to issue events
6. **File attachments** — S3/R2 with presigned URLs scoped per tenant
7. **Real-time** — WebSocket or SSE for live issue updates within a tenant
8. **Tests** — Unit tests for auth middleware, integration tests for tenant isolation
9. **Observability** — OpenTelemetry traces with tenantId as a span attribute
10. **Plan limits** — Middleware to enforce issue/member limits per plan tier

---

## ⚖️ Technical Decision Record

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ORM | Prisma | Type-safe, excellent DX, migration tooling |
| Auth | JWT (stateless) | Horizontal scaling without session store |
| Tenancy model | Shared DB + tenantId | Operational simplicity at this scale |
| Frontend state | React Query | Server state caching, deduplication |
| API style | REST | Simpler than GraphQL for this scope |
| Monorepo | Workspaces | Shared types, unified CI, easier deployment |
