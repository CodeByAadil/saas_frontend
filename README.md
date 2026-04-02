# saas_frontend
Frontend for TeamFlow SaaS platform built with React/Next.js, featuring a modern UI for team collaboration, project management, and real-time updates.

```
/frontend
├─ app/
│ ├─ (auth)/
│ │ ├─ login/page.tsx
│ │ ├─ register/page.tsx
│ │ └─ callback/page.tsx ← OAuth
│ ├─ (dashboard)/
│ │ ├─ layout.tsx
│ │ ├─ workspace/[workspaceId]/
│ │ │ ├─ page.tsx ← overview
│ │ │ ├─ tasks/
│ │ │ │ ├─ page.tsx
│ │ │ │ └─ [taskId]/page.tsx
│ │ │ ├─ members/page.tsx
│ │ │ ├─ settings/page.tsx
│ │ │ └─ billing/page.tsx
│ │ └─ admin/
│ │ ├─ page.tsx
│ │ └─ workspaces/page.tsx
│ ├─ layout.tsx
│ └─ page.tsx
├─ components/
│ ├─ auth/
│ │ └─ GoogleOAuthButton.tsx
│ ├─ tasks/
│ │ ├─ TaskCard.tsx
│ │ ├─ TaskBoard.tsx
│ │ ├─ TaskModal.tsx
│ │ └─ AISummaryPanel.tsx
│ ├─ workspace/
│ │ ├─ WorkspaceSwitcher.tsx
│ │ └─ MemberTable.tsx
│ ├─ billing/
│ │ └─ PricingCard.tsx
│ └─ ui/ ← shared primitives
├─ hooks/
│ ├─ useSocket.ts
│ ├─ useWorkspace.ts
│ └─ useAuth.ts
├─ lib/
│ ├─ api.ts ← axios instance
│ ├─ socket.ts
│ └─ auth.ts ← NextAuth config
├─ store/ ← Zustand slices
│ ├─ authStore.ts
│ ├─ taskStore.ts
│ └─ workspaceStore.ts
├─ types/
│ └─ index.ts
└─ middleware.ts ← JWT guard
```