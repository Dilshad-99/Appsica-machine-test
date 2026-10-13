# Software Requirements Specification (SRS)
## Real-Time Collaborative Task Management System (Trello-like)

**Version:** 1.0
**Stack:** MERN (MongoDB, Express, React, Node.js) + Socket.io

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements of a collaborative Kanban-style task management system with real-time synchronization across all connected members of a board.

### 1.2 Scope
The system lets users create boards, invite members, and manage tasks across four columns (Todo, In Progress, Review, Done). All changes (task movement, edits, typing, presence) propagate live to every member viewing the board.

### 1.3 Definitions

| Term | Meaning |
|------|---------|
| Board | A shared workspace containing tasks and members |
| Task | A card with title, description, priority, due date, assignee, status, position |
| Column | A status lane: `todo`, `in_progress`, `review`, `done` |
| Position | Sortable value that decides a task's order inside a column |
| Presence | Which members are currently online on a board |
| Optimistic update | UI applies a change immediately, then reconciles with server |

---

## 2. Overall Description

### 2.1 Product Perspective
A web application: React SPA (frontend), Node/Express REST API, MongoDB persistence, Socket.io for bidirectional realtime events.

### 2.2 User Classes
- **Owner:** creates the board, manages members, can delete the board.
- **Member:** creates, edits, moves tasks; sees live activity.
- **Viewer (optional):** read-only access.

### 2.3 Operating Environment
Modern browsers (Chrome, Firefox, Safari, Edge), desktop and mobile. Node.js 18+, MongoDB 6+.

### 2.4 Assumptions and Dependencies
- Users are authenticated (JWT). Auth is a prerequisite even though not listed in the brief.
- Stable WebSocket support, with long-polling fallback.
- Redis is needed only when scaling Socket.io horizontally.

---

## 3. Data Requirements

### 3.1 Board
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `title` | String | required, 1-100 chars |
| `createdBy` | ObjectId (User) | owner |
| `members` | [{ user, role, joinedAt }] | role: owner / member / viewer |
| `createdAt`, `updatedAt` | Date | |

### 3.2 Task
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `boardId` | ObjectId | indexed |
| `title` | String | required, max 200 |
| `description` | String | optional, max 5000 |
| `priority` | Enum | `low`, `medium`, `high`, `urgent` |
| `dueDate` | Date | optional |
| `assignedTo` | ObjectId (User) | optional, must be a board member |
| `status` | Enum | `todo`, `in_progress`, `review`, `done` |
| `position` | Number (or string rank) | sort key within column |
| `version` | Number | increments on every update (concurrency control) |
| `createdBy`, `createdAt`, `updatedAt` | | |

### 3.3 Supporting Models
- **User:** name, email, passwordHash, avatar.
- **Activity (bonus):** boardId, taskId, actor, action, meta, createdAt.
- **Attachment (bonus):** taskId, filename, url, size, mimeType, uploadedBy.

---

## 4. Functional Requirements

### 4.1 Board Management
| ID | Requirement |
|----|-------------|
| FR-1 | A user shall be able to create a board with a title. |
| FR-2 | The creator shall automatically become owner and member. |
| FR-3 | Owner shall be able to invite members by email or user ID. |
| FR-4 | Only board members shall be able to view or modify board data. |
| FR-5 | A user shall be able to fetch full board data (board, members, tasks grouped by column) in one request. |

### 4.2 Task Management
| ID | Requirement |
|----|-------------|
| FR-6 | A member shall be able to create a task in any column. |
| FR-7 | A member shall be able to update title, description, priority, due date, assignee. |
| FR-8 | A member shall be able to move a task between columns and reorder within a column. |
| FR-9 | A member shall be able to delete a task. |
| FR-10 | Assignee must be a member of the board. |
| FR-11 | New tasks shall be placed at the bottom of the target column by default. |

### 4.3 Real-Time Features
| ID | Requirement |
|----|-------------|
| FR-12 | Task create/update/move/delete shall be broadcast to all board members within ~300 ms. |
| FR-13 | Dragging a task shall show live movement to other users (drag start, drag end, drop). |
| FR-14 | A typing indicator shall show who is editing a task's title or description. |
| FR-15 | The board shall show the list of currently online members. |
| FR-16 | The sender shall not be re-applied its own broadcast (duplicate suppression). |

### 4.4 Frontend Features
| ID | Requirement |
|----|-------------|
| FR-17 | Drag-and-drop of cards within and across columns. |
| FR-18 | Click a card to open an editable modal. |
| FR-19 | Filters by priority, assigned member, and due date (overdue, today, this week, none). |
| FR-20 | Responsive layout: horizontal-scroll columns on mobile, full board on desktop. |
| FR-21 | Global state management (Redux Toolkit or Zustand). |

### 4.5 Synchronization Logic
| ID | Requirement |
|----|-------------|
| FR-22 | Simultaneous updates to different fields of one task shall both be preserved (field-level merge). |
| FR-23 | Simultaneous updates to the same field shall resolve by last-write-wins using server order, and the losing client shall be notified. |
| FR-24 | Simultaneous reordering shall always produce a consistent, gap-free visible order for all clients. |
| FR-25 | On reconnect or on version mismatch, the client shall auto-refresh board state. |

### 4.6 Bonus Features
| ID | Requirement |
|----|-------------|
| FR-26 | Activity timeline listing who did what and when, updated live. |
| FR-27 | Analytics: tasks per column, per assignee, overdue count, completion rate, throughput over time. |
| FR-28 | File attachments on tasks (upload, list, download, delete). |

---

## 5. Edge Cases and Handling

| Case | Required Behavior |
|------|-------------------|
| Duplicate updates | Each mutation carries a client-generated `opId`; server ignores a repeated `opId` and returns the earlier result. Clients ignore events they originated. |
| Invalid position | Server validates the target status and position; invalid or out-of-range values are clamped to the column bounds, or rejected with `400` when malformed (NaN, negative, wrong type). |
| Disconnect | Client shows an "offline / reconnecting" banner, queues pending operations, and disables destructive actions if offline too long. |
| Reconnect | Client re-joins the board room, requests missed events since `lastEventSeq` (or refetches the full board), then flushes its queue. |
| Task deleted while being edited | Editor sees a "task was deleted" notice and the modal closes. |
| Member removed while online | Socket is removed from the board room; the client is redirected. |
| Stale edit | A write with an old `version` returns `409` with the latest task; the client merges or prompts. |
| Same user, multiple tabs | Presence counts the user once; every tab still receives updates. |
| Typing indicator orphaned | Indicators expire after 3 seconds without a new typing event, and on disconnect. |

---

## 6. Non-Functional Requirements

### 6.1 Performance
- REST responses under 300 ms (p95) for boards up to 500 tasks.
- Realtime event delivery under 300 ms (p95) on the same region.
- Support at least 50 concurrent users per board.

### 6.2 Security
- JWT authentication on REST and on the Socket.io handshake.
- Authorization check on every REST call and every socket event (membership and role).
- Input validation and sanitization (e.g., Joi/Zod) to prevent injection and XSS.
- Rate limiting on REST and on high-frequency socket events (typing, drag).
- Upload restrictions: size limit, MIME allow-list.

### 6.3 Reliability and Availability
- Server is the source of truth; the DB write happens before the broadcast.
- Graceful reconnect with exponential backoff.
- 99.5% target uptime.

### 6.4 Scalability
- Stateless Node instances behind a load balancer.
- Socket.io Redis adapter for multi-instance broadcast; sticky sessions or WebSocket-only transport.

### 6.5 Usability and Accessibility
- Responsive and touch-friendly drag-and-drop.
- Keyboard-accessible modal and a keyboard alternative to dragging.
- Clear visual feedback for loading, offline, and conflict states.

### 6.6 Maintainability
- Modular code (routes / controllers / services / models / socket handlers).
- Unit and integration tests for services and socket flows; ESLint and Prettier.

---

## 7. External Interface Requirements

- **User interface:** Kanban board, task modal, filter bar, member avatars with presence dots, activity sidebar.
- **API interface:** REST (JSON) plus Socket.io events (see `03-Routes.md`).
- **Database interface:** MongoDB via Mongoose.
- **Storage interface (bonus):** local disk, S3, or Cloudinary for attachments.

---

## 8. Constraints
- MERN stack preferred.
- Socket.io is mandatory for realtime.
- Responsive UI required.
- A client-side state management library is required.

---

## 9. Acceptance Criteria (summary)
1. Two browsers on the same board see each other's task moves, edits, and deletions instantly.
2. Typing indicator and online list update correctly, including on tab close.
3. Two users reordering the same column at once end up with an identical order on both screens.
4. After disconnecting for 30 seconds and reconnecting, the board matches the server state.
5. Replaying the same mutation (same `opId`) does not create duplicates.
6. Filters work independently and in combination.
