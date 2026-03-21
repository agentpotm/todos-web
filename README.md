# todos-web

The web frontend for the todos app. A React single-page app that lets users register, log in, manage their todo list, and see changes update live across browser tabs without refreshing.

## What this app does

- Register and log in with email and password
- View, add, edit, and delete todos
- See changes from other browser tabs or devices update instantly — no page refresh needed
- Show a connection indicator when the server is unreachable

---

## Tools and why we use them

| Tool | What it is | Why we use it |
|------|-----------|---------------|
| **React 19** | UI library | Builds the interface as composable components. Each piece of UI (a button, a todo item, a form) manages its own state and re-renders when that state changes. |
| **TypeScript** | JavaScript with types | Catches bugs before you run the code. If you pass the wrong type of value to a function, the editor tells you immediately. |
| **Vite** | Build tool and dev server | Starts the dev server in under a second and refreshes the browser instantly when you save a file (called Hot Module Replacement). Much faster than older tools like webpack. |
| **Tailwind CSS** | Utility-first CSS framework | Style elements by adding short class names directly in JSX (`className="text-red-500 font-bold"`) instead of writing separate CSS files. |
| **Vitest** | Test runner | Runs the unit tests. Fast, and uses the same module system as Vite so no extra configuration is needed. |
| **React Testing Library** | Testing utilities | Tests components by simulating real user interactions — clicking buttons, typing into inputs, reading what appears on screen — rather than calling internal functions. |
| **ESLint + Prettier** | Linter and formatter | ESLint catches code quality problems. Prettier enforces consistent formatting automatically so diffs stay clean. |

---

## Architecture

```
src/
├── main.tsx                      # Entry point — mounts the React app into index.html
├── App.tsx                       # Root component — controls which screen is shown
├── api/
│   └── client.ts                 # Wraps fetch() — all HTTP requests go through here
├── types/
│   └── index.ts                  # Shared TypeScript types (e.g. the shape of a Todo)
├── features/
│   ├── auth/
│   │   ├── LoginPage.tsx         # Login form
│   │   ├── RegisterPage.tsx      # Registration form
│   │   └── auth.test.tsx
│   ├── dashboard/
│   │   ├── DashboardPage.tsx     # Main page: loads todos, wires up WebSocket
│   │   ├── TodoList.tsx          # Renders the list of todo items
│   │   ├── TodoItem.tsx          # A single todo row with inline edit + delete
│   │   ├── AddTodoForm.tsx       # The "add new todo" input
│   │   └── dashboard.test.tsx
│   └── sync/
│       ├── useWebSocket.ts           # Hook that manages the live WebSocket connection
│       ├── ConnectionIndicator.tsx   # Banner shown when disconnected from the server
│       └── sync.test.tsx
└── test/
    └── setup.ts                  # Loads extra test matchers before each test run
```

### How navigation works

There is no URL-based router. `App.tsx` holds a `view` state variable (`'login'` | `'register'` | `'dashboard'`). Only the active view renders. When login succeeds, the view switches to `'dashboard'` and the JWT token is stored in React state — never in `localStorage` — so it disappears on page refresh by design.

### How API calls work

All HTTP requests go through `src/api/client.ts`, which adds `credentials: 'include'` so the browser automatically sends the session cookie. During development, Vite proxies every `/api/*` request to `http://localhost:3000`, avoiding CORS errors without any extra setup.

### How real-time updates work

`DashboardPage` uses the `useWebSocket` hook. After login, the hook opens a WebSocket connection to `/api/ws?token=<jwt>`. The backend broadcasts events like `{ type: "todo:created", payload: {...} }` whenever any client modifies a todo. The hook updates local React state directly — no refetch needed. On reconnect after a dropped connection, it refetches the full list to reconcile any missed events.

---

## Prerequisites

**Node.js 18 or later.** Check your version:

```bash
node --version   # should print v18.x.x or higher
```

Download from [nodejs.org](https://nodejs.org) if needed.

You also need the **backend running on localhost:3000** — see the todos-backend README.

---

## Setup

```bash
# Install dependencies (run once, or again after package.json changes)
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The page updates automatically when you save a file. The backend must be running or API calls will fail.

---

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start the dev server at localhost:5173 with hot reload |
| `npm run build` | Type-check + compile to `dist/` for deployment |
| `npm run preview` | Serve the `dist/` build locally (test before deploying) |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode — reruns on file save |
| `npm run typecheck` | Check TypeScript without building |
| `npm run lint` | Run ESLint across all source files |
| `npm run format` | Auto-format all files with Prettier |

---

## Environment variables

No `.env` file is needed for local development. For production:

```bash
VITE_API_URL=https://your-backend.example.com
```

When `VITE_API_URL` is an `https://` URL, API calls go directly to that host and WebSocket connections use `wss://` automatically.

---

## Tests

```bash
npm test
```

Test files live next to the source files they cover (`Foo.tsx` → `Foo.test.tsx` in the same directory). Tests simulate real user behavior — fill a form, click submit, assert what appears on screen.

Key note: always use `vi.resetAllMocks()` in `afterEach`, not `vi.clearAllMocks()`. The difference: `clearAllMocks` only resets call counts but leaves the mock return-value queue intact. Unconsumed mock values bleed into the next test and cause failures that appear random. `resetAllMocks` wipes everything clean.

---

## Contributing

1. **Read the spec** in [todos-product](https://github.com/agentpotm/todos-product) under `specs/` — it defines what the feature must do
2. **Branch**: `git checkout -b feat/web/<spec-name>`
3. **Implement** the feature following the existing patterns
4. **Write tests** co-located with the source file
5. **Run `npm test`** — must pass with zero failures before pushing
6. **Run `npm run typecheck && npm run lint`** — both must be clean
7. **Open a PR** titled `feat(web): <spec-name>`, referencing the spec in the description

### Definition of done

- [ ] All spec acceptance criteria work in the browser
- [ ] Tests written and passing (`npm test`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No lint errors (`npm run lint`)
- [ ] PR references the spec commit
