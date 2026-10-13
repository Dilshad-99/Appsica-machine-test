# Server — Folder Structure

REST API + Socket.IO backend for the Trello-like Kanban board app, built with **Express, TypeScript, MongoDB (Mongoose), Socket.IO and Zod**.

## Quick start

**Requirements:** Node.js >= 18, MongoDB running locally (or a remote `MONGODB_URI`).

```bash
cd server
npm install          # install dependencies
npm run dev          # start dev server with hot reload (tsx watch)
npm run build        # compile TypeScript to dist/
npm start            # run compiled output
npm run typecheck    # run the TypeScript compiler without emitting
```

Server starts on `PORT` (default `5000`). Health check: `GET /health`.

## Folder structure

```
server/
├── src/
│   ├── config/
│   │   ├── db.js            → MongoDB connection (connectDB, disconnectDB)
│   │   └── env.js           → loads & validates environment variables
│   ├── models/
│   │   ├── User.js          → user (bcrypt password hashing, login compare)
│   │   ├── Board.js         → board + embedded columns (lists)
│   │   ├── Task.js          → task (columnId, position for ordering, assignees…)
│   │   ├── Comment.js       → comment on a task
│   │   └── Activity.js      → audit log entry per board
│   ├── controllers/
│   │   ├── auth.controller.js      → register / login / me
│   │   ├── board.controller.js     → board CRUD + columns + members
│   │   ├── task.controller.js      → task CRUD + move (reorder)
│   │   ├── comment.controller.js   → comment CRUD per task
│   │   └── activity.controller.js  → board activity feed
│   ├── routes/
│   │   ├── auth.routes.js    → POST /auth/register, POST /auth/login, GET /auth/me
│   │   ├── board.routes.js   → /boards (+ members, columns)
│   │   ├── task.routes.js    → /tasks (+ move endpoint)
│   │   ├── comment.routes.js → /comments
│   │   └── index.js          → mounts all routers under /api
│   ├── middlewares/
│   │   ├── auth.middleware.js    → JWT verification, injects req.user
│   │   ├── error.middleware.js   → notFound + centralized error handler
│   │   └── validate.middleware.js→ Zod schema validation of req.body
│   ├── sockets/
│   │   ├── index.js            → Socket.IO init + JWT auth middleware
│   │   ├── board.socket.js     → board:join / board:leave rooms
│   │   ├── task.socket.js      → task:create / move / update / delete relays
│   │   ├── presence.socket.js  → online members per board
│   │   └── typing.socket.js    → typing indicators
│   ├── services/
│   │   ├── task.service.js     → position / reorder logic (TaskService)
│   │   └── activity.service.js → ActivityService (log + feed)
│   ├── utils/
│   │   ├── ApiError.js         → operational error class
│   │   ├── ApiResponse.js      → standardized JSON response envelope
│   │   └── asyncHandler.js     → wraps async controllers, forwards errors
│   ├── validators/
│   │   ├── board.validator.js  → Zod schemas for board/column/member bodies
│   │   └── task.validator.js   → Zod schemas for task/create/update/move
│   ├── app.js                  → Express app (middleware, routes, errors)
│   └── server.js               → HTTP server + Socket.IO attach + DB connect
├── .env                        → environment variables (see below)
├── package.json
└── tsconfig.json               → TypeScript compiler config
```

> **Note:** The requested structure lists `.js` names; this implementation uses
> TypeScript, so every module is a `.ts` file with identical naming.

## What each layer does

| Layer | Responsibility |
|---|---|
| `config/` | Load/validate env vars; establish the MongoDB connection |
| `models/` | Mongoose schemas + document interfaces |
| `controllers/` | HTTP handlers: validate access, apply services, log activity, emit socket events |
| `routes/` | Path wiring, applies `authenticate` + `validate` middlewares |
| `middlewares/` | JWT auth (`req.user`), Zod validation, centralized error handling |
| `sockets/` | Socket.IO auth + per-feature event handlers bound to board rooms |
| `services/` | Business logic: task position/reorder math, activity logging |
| `validators/` | Zod input schemas shared with routes |
| `utils/` | Shared `ApiError` / `ApiResponse` / `asyncHandler` |

## Environment variables (`.env`)

| Variable | Description |
|---|---|
| `PORT` | HTTP + Socket.IO port (default `5000`) |
| `NODE_ENV` | `development` / `production` |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign/verify JWT tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `CLIENT_URL` | Allowed CORS / Socket.IO origin |

## REST API overview

All endpoints except `register`/`login` require `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account, returns token |
| POST | `/api/auth/login` | Login, returns token |
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/boards` | Create board (defaults: To Do, In Progress, Done) |
| GET | `/api/boards` | Boards user owns or is member of |
| GET | `/api/boards/:boardId` | Board + columns with their tasks |
| PATCH | `/api/boards/:boardId` | Update name/description |
| DELETE | `/api/boards/:boardId` | Delete board (cascades tasks/comments/activities) |
| POST | `/api/boards/:boardId/columns` | Add column |
| PATCH | `/api/boards/:boardId/columns/:columnId` | Rename column |
| DELETE | `/api/boards/:boardId/columns/:columnId` | Delete column + its tasks |
| POST | `/api/boards/:boardId/members` | Add member |
| DELETE | `/api/boards/:boardId/members/:userId` | Remove member |
| GET | `/api/tasks/board/:boardId` | All tasks of a board |
| GET | `/api/tasks/board/:boardId/column/:columnId` | Tasks of one column |
| POST | `/api/tasks/board/:boardId/column/:columnId` | Create task (appended at end) |
| PATCH | `/api/tasks/:taskId` | Update task fields |
| PATCH | `/api/tasks/:taskId/move` | Move task `{ columnId, position? }` |
| DELETE | `/api/tasks/:taskId` | Delete task (re-normalizes positions) |
| GET | `/api/comments/task/:taskId` | Comments of a task |
| POST | `/api/comments/task/:taskId` | Add comment |
| PATCH | `/api/comments/:commentId` | Edit own comment |
| DELETE | `/api/comments/:commentId` | Delete own comment |
| GET | `/api/activities/:boardId` | Board activity feed (`?limit=`) |

## Socket.IO events

Connect with `{ auth: { token } }` in the handshake.

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `board:join` | `boardId` | Join board room |
| `board:leave` | `boardId` | Leave board room |
| `task:create` | `{ boardId, … }` | Broadcast task creation |
| `task:move` | `{ boardId, … }` | Broadcast task move |
| `task:update` | `{ boardId, … }` | Broadcast task update |
| `task:delete` | `{ boardId, … }` | Broadcast task deletion |
| `typing:start` / `typing:stop` | `{ boardId, taskId? }` | Typing indicator |

### Server → Client (board room)

| Event | Description |
|---|---|
| `board:user-joined` / `board:user-left` | Member presence entry/exit |
| `presence:update` | `{ boardId, onlineUsers: string[] }` |
| `task:created` / `task:moved` / `task:updated` / `task:deleted` | Task mutations |
| `column:added` / `column:renamed` / `column:deleted` | Column mutations |
| `board:deleted` | Board deleted |
| `comment:created` / `comment:updated` / `comment:deleted` | Comment mutations |
| `typing:start` / `typing:stop` | Typing indicator (sent to others) |