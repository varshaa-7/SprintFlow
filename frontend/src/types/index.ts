export type Status = 'OPEN' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
export type Priority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
export type Role = 'OWNER' | 'ADMIN' | 'MEMBER';
export type Plan = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  description?: string;
  _count?: { issues: number };
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface IssueLabel {
  label: Label;
}

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: Pick<User, 'id' | 'name' | 'email'>;
}

export interface Issue {
  id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  createdBy: Pick<User, 'id' | 'name' | 'email'>;
  assignedTo?: Pick<User, 'id' | 'name' | 'email'>;
  project?: Pick<Project, 'id' | 'name' | 'color'>;
  labels: IssueLabel[];
  comments?: Comment[];
  _count?: { comments: number };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export interface Stats {
  byStatus: { status: Status; _count: number }[];
  byPriority: { priority: Priority; _count: number }[];
  recentActivity: Pick<Issue, 'id' | 'title' | 'status' | 'priority' | 'updatedAt'>[];
}
