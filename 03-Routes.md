# Routes Specification
## REST API, Socket.io Events, and Frontend Routes

Base URL: `/api/v1`
Auth: `Authorization: Bearer <JWT>` on all routes except register/login.

---

## 1. REST API Routes

### 1.1 Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/register` | Create a user |
| POST | `/auth/login` | Returns JWT |
| GET | `/auth/me` | Current user |

### 1.2 Boards
| Method | Route | Description | Access |
|--------|-------|-------------|--------|
| POST | `/boards` | **Create board** | Authenticated |
| GET | `/boards` | List boards the user belongs to | Authenticated |
| GET | `/boards/:boardId` | **Get board data** (board, members, tasks grouped by status) | Member |
| PATCH | `/boards/:boardId` | Rename board | Owner |
| DELETE | `/boards/:boardId` | Delete board and its tasks | Owner |
| POST | `/boards/:boardId/invite` | **Invite members** | Owner |
| DELETE | `/boards/:boardId/members/:userId` | Remove member | Owner |

### 1.3 Tasks
| Method | Route | Description | Access |
|--------|-------|-------------|--------|
| POST | `/boards/:boardId/tasks` | **Create task** | Member |
| PATCH | `/tasks/:taskId` | **Update task** (partial fields, requires `version`) | Member |
| PATCH | `/tasks/:taskId/move` | **Move task** (status + position) | Member |
| DELETE | `/tasks/:taskId` | **Delete task** | Member |

### 1.4 Bonus
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/boards/:boardId/activity?limit=50&before=<id>` | Activity timeline (paginated) |
| GET | `/boards/:boardId/analytics` | Aggregated stats |
| POST | `/tasks/:taskId/attachments` | Upload file (multipart) |
| GET | `/tasks/:taskId/attachments` | List attachments |
| DELETE | `/attachments/:attachmentId` | Delete attachment |

---

## 2. Request and Response Contracts

### Create board
```http
POST /api/v1/boards
{ "title": "Sprint 12" }
```
```json
201 { "_id": "b1", "title": "Sprint 12", "createdBy": "u1",
      "members": [{ "user": "u1", "role": "owner" }] }
```

### Invite members
```http
POST /api/v1/boards/b1/invite
{ "emails": ["sara@team.com"], "role": "member" }
```
```json
200 { "added": ["u7"], "notFound": [], "alreadyMembers": [] }
```

### Create task
```http
POST /api/v1/boards/b1/tasks
{
  "title": "Design login page",
  "description": "Figma + responsive",
  "priority": "high",
  "dueDate": "2026-10-30",
  "assignedTo": "u7",
  "status": "todo",
  "opId": "c-9f3a..."
}
```
```json
201 { "_id": "t1", "status": "todo", "position": 3000, "version": 1, ... }
```

### Update task
```http
PATCH /api/v1/tasks/t1
{ "priority": "urgent", "version": 4, "opId": "c-1b2c..." }
```
- `200` updated task (version 5)
- `409` `{ "error": "VERSION_CONFLICT", "latest": { ...task } }`

### Move task
```http
PATCH /api/v1/tasks/t1/move
{
  "toStatus": "review",
  "beforeTaskId": "t8",
  "afterTaskId": "t5",
  "opId": "c-77de..."
}
```
Client sends the **neighbors**, not an absolute index. The server computes the position between them. This makes concurrent moves safe.
- `200` `{ "task": { ... }, "position": 2500 }`
- `400` invalid status or neighbor not in the target column
- `404` task not found

### Get board data
```json
GET /api/v1/boards/b1
200 {
  "board": { "_id": "b1", "title": "Sprint 12", "createdBy": "u1" },
  "members": [{ "_id": "u1", "name": "Priya", "role": "owner" }],
  "columns": {
    "todo": [ { task }, ... ],
    "in_progress": [],
    "review": [],
    "done": []
  },
  "lastEventSeq": 482
}
```

### Standard error format
```json
{ "error": "CODE", "message": "Human readable", "details": {} }
```
| Status | Meaning |
|--------|---------|
| 400 | Validation failed / invalid position |
| 401 | Missing or invalid token |
| 403 | Not a board member / insufficient role |
| 404 | Resource not found |
| 409 | Version conflict |
| 429 | Rate limited |

---

## 3. Socket.io Events

**Namespace:** `/` (default)
**Handshake:** `io(URL, { auth: { token: "<JWT>" } })`. The server verifies the token and rejects invalid connections.
**Rooms:** `board:<boardId>`

### 3.1 Client to Server
| Event | Payload | Purpose |
|-------|---------|---------|
| `board:join` | `{ boardId, lastEventSeq? }` | Join room (membership verified); triggers presence and optional catch-up |
| `board:leave` | `{ boardId }` | Leave room |
| `task:drag:start` | `{ boardId, taskId }` | Show "being moved" for others |
| `task:drag:end` | `{ boardId, taskId }` | Clear the indicator |
| `typing:start` | `{ boardId, taskId, field }` | Typing indicator on |
| `typing:stop` | `{ boardId, taskId }` | Typing indicator off |
| `sync:request` | `{ boardId, lastEventSeq }` | Ask for missed events or a snapshot |

> Mutations (create, update, move, delete) go through REST. The server then broadcasts the result via Socket.io, so DB write and broadcast stay in one authoritative path. Socket-based mutations with acknowledgements are an acceptable alternative.

### 3.2 Server to Client
| Event | Payload | Meaning |
|-------|---------|---------|
| `task:created` | `{ task, actorId, opId, seq }` | New task |
| `task:updated` | `{ task, changedFields, actorId, opId, seq }` | Task fields changed |
| `task:moved` | `{ task, from, to, actorId, opId, seq }` | Status and/or position changed |
| `task:deleted` | `{ taskId, actorId, opId, seq }` | Task removed |
| `task:drag:started` | `{ taskId, userId }` | Someone is dragging |
| `task:drag:ended` | `{ taskId, userId }` | Drag finished |
| `typing:update` | `{ taskId, users: [{ userId, field }] }` | Current typists |
| `presence:update` | `{ boardId, onlineUserIds: [] }` | Online members |
| `member:added` / `member:removed` | `{ user }` | Membership changes |
| `board:updated` | `{ board }` | Title changed |
| `board:snapshot` | `{ columns, lastEventSeq }` | Full state (after reconnect or gap) |
| `activity:new` | `{ activity }` | Timeline entry (bonus) |
| `error:event` | `{ code, message }` | Rejected socket action |

### 3.3 Connection Lifecycle Events (built in)
`connect`, `disconnect`, `connect_error`, `reconnect_attempt`, `reconnect`

### 3.4 Client Handling Rules
1. On `connect` (including reconnect): emit `board:join` with `lastEventSeq`.
2. Ignore broadcasts where `actorId === me` and `opId` was already applied locally.
3. If incoming `seq` is not `lastSeq + 1`, there is a gap, so emit `sync:request`.
4. Throttle `typing:start` to once per second; send `typing:stop` after 2 seconds idle.

---

## 4. Frontend Routes (React Router)

| Path | Page | Notes |
|------|------|-------|
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/boards` | Board list and "Create board" | Protected |
| `/boards/:boardId` | Kanban board | Protected, member only |
| `/boards/:boardId/task/:taskId` | Board with task modal open | Deep-linkable |
| `/boards/:boardId/analytics` | Analytics dashboard (bonus) | Protected |
| `/invite/:token` | Accept invitation (optional) | Protected |
| `*` | 404 page | |

---

## 5. Middleware Chain (Express)

```
requireAuth → validate(schema) → requireBoardMember(minRole) → controller
```
- `requireAuth`: verify JWT, attach `req.user`.
- `validate`: Zod/Joi schema per route.
- `requireBoardMember`: load the board (via the task if needed), confirm membership and role.
- Global: `helmet`, `cors`, `express-rate-limit`, central error handler.
