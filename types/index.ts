/**
 * types/index.ts — Shared TypeScript types
 *
 * Keep in sync with the backend Mongoose models.
 * These are the shapes the API returns (after .toJSON() / .lean()).
 */

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface User {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    createdAt: string;
}

// ── Workspace ─────────────────────────────────────────────────────────────────
export type PlanType = 'free' | 'pro' | 'enterprise';
export type RoleType = 'owner' | 'admin' | 'member';

export interface Workspace {
    _id: string;
    name: string;
    slug: string;
    ownerId: string;
    plan: PlanType;
    memberCount: number;
    logoUrl?: string;
    createdAt: string;
    // Joined from WorkspaceMember (present in list/getOne responses)
    role: RoleType;
}

export interface WorkspaceMember {
    _id: string;
    userId: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role: RoleType;
    joinedAt: string;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
    _id: string;
    workspaceId: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    createdBy: Pick<User, '_id' | 'name' | 'avatarUrl'>;
    assigneeId: Pick<User, '_id' | 'name' | 'avatarUrl'> | null;
    aiSummary: string | null;
    attachments: string[];       // S3 keys
    dueDate: string | null;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

// ── Subscription ──────────────────────────────────────────────────────────────
export type SubStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';

export interface Subscription {
    _id: string;
    workspaceId: string;
    stripeCustomerId: string;
    stripeSubId: string | null;
    plan: PlanType;
    status: SubStatus;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    createdAt: string;
}

// ── API response wrappers ─────────────────────────────────────────────────────
export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface ApiError {
    error: string;
    details?: string[];
}