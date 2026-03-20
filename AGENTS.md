# Agent Guide: todos-web

## What this repo is

The web client for the todos product. Implements user stories from the product spec repo at https://github.com/agentpotm/todos-product.

Always read the relevant spec(s) from todos-product before implementing a feature. The spec is the source of truth for acceptance criteria.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| State | React context (global) + local state |
| Real-time | WebSocket (native browser API) |
| Auth | HttpOnly cookie (set by backend) + JWT in memory |
| Testing | Vitest + React Testing Library |
| Lint | ESLint + Prettier |

## Project Structure

```
todos-web/
├── index.html
├── vite.config.ts
├── package.json
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── auth.test.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── TodoList.tsx
│   │   │   ├── TodoItem.tsx
│   │   │   └── dashboard.test.tsx
│   │   └── sync/
│   │       ├── useWebSocket.ts
│   │       ├── ConnectionIndicator.tsx
│   │       └── sync.test.tsx
│   ├── api/
│   │   └── client.ts       (fetch wrapper, base URL, auth headers)
│   └── types/
│       └── index.ts
└── tests/
```

## Conventions

- Functional components only, no class components
- Co-locate tests with feature files (`foo.tsx` + `foo.test.tsx`)
- Optimistic UI for mutations — apply locally, roll back on error
- No global state for server data — fetch on mount, update via WS events
- TypeScript strict mode — no `any`

## Real-Time Pattern

```ts
// Connect on app load after auth
// On message: update local state directly (no refetch)
// On disconnect: show ConnectionIndicator
// On reconnect: refetch full todo list to reconcile, then re-subscribe
```

## Workflow

1. Read the spec from todos-product for the story you're implementing
2. Only implement specs with `stage: ready`
3. Implement the feature, write tests
4. Open a PR — title format: `feat(web): <spec-name>` (e.g. `feat(web): auth/login`)
5. After PR is merged, update `specs/status.yml` in todos-product:
   `web: { state: done, version: <spec_version> }`

## Definition of Done

- [ ] All acceptance criteria from the spec pass in browser
- [ ] Tests written and passing (`npm test`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No lint errors (`npm run lint`)
- [ ] PR references the spec (e.g. `Implements agentpotm/todos-product spec: auth/login`)
