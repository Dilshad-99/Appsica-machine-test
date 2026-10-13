# Product Requirements Document (PRD)
## Real-Time Collaborative Task Board

---

## 1. Overview

### 1.1 Problem
Small teams need a simple shared board to track work. Existing tools are often heavy, and many "collaborative" tools show stale data until you refresh, leading to overwritten work, duplicate effort, and confusion about who is doing what.

### 1.2 Vision
A lightweight Kanban board where every change appears **instantly** for everyone, so the board is always the single source of truth.

### 1.3 Goals
1. Zero-refresh collaboration: what you see is what the team sees.
2. Fast, intuitive drag-and-drop task management.
3. Safe concurrency: no lost updates, no scrambled ordering.
4. Works well on desktop and mobile.

### 1.4 Non-Goals (v1)
- Multiple workspaces, billing, or enterprise SSO.
- Custom columns (v1 uses four fixed columns).
- Subtasks, labels, or automations.
- Native mobile apps.

---

## 2. Target Users and Personas

| Persona | Needs |
|---------|-------|
| **Team Lead (Priya)** | Create boards, invite people, see progress at a glance, check analytics |
| **Developer (Arjun)** | Quickly move cards, edit details, see what teammates are changing |
| **Designer/Contributor (Sara)** | Filter to "my tasks", get notified of changes, attach files |
| **Remote team** | Know who is online and working on what right now |

---

## 3. User Stories

### Boards
- As a lead, I can create a board so my team has a shared space.
- As an owner, I can invite teammates so they can collaborate.
- As a member, I can open a board and see all tasks grouped by column.

### Tasks
- As a member, I can create a task with title, description, priority, due date, and assignee.
- As a member, I can drag a task to another column or position to update progress.
- As a member, I can open a task and edit any field in a modal.
- As a member, I can delete tasks that are no longer needed.

### Realtime
- As a member, I see cards move live when others drag them.
- As a member, I see "Arjun is typing..." when someone edits a task I have open.
- As a member, I see who is online on the board.
- As a member, I recover cleanly after losing internet.

### Filtering
- As a member, I can filter by priority, by assignee, and by due date to focus on what matters.

### Bonus
- As a lead, I can view an activity timeline of recent changes.
- As a lead, I can view analytics: workload, overdue tasks, and completion trend.
- As a member, I can attach files to a task.

---

## 4. Features and Priorities

| Priority | Feature |
|----------|---------|
| **P0 (MVP)** | Auth, create board, invite members, task CRUD, four columns, drag-and-drop, Socket.io live sync, get board data |
| **P0** | Conflict handling (versioning, ordering), reconnect handling, duplicate suppression |
| **P1** | Typing indicators, online members, editable modal, filters (priority/member/date), responsive UI |
| **P2 (Bonus)** | Activity timeline |
| **P2 (Bonus)** | Analytics dashboard |
| **P2 (Bonus)** | File attachments |

---

## 5. Functional Summary

**Board:** title, creator, members.
**Task:** title, description, priority (low/medium/high/urgent), due date, assignee, status (Todo / In Progress / Review / Done), position.

**Key flows:**
1. *Create board* → owner is added as member → board opens with 4 empty columns.
2. *Invite* → invited user joins the member list → appears in the online list when active.
3. *Create task* → card appears at the bottom of the chosen column for everyone.
4. *Move task* → optimistic UI move → server confirms → other users see the card slide into place.
5. *Edit task* → modal edit → others see typing indicator → changes appear live.

---

## 6. UX Requirements

- Four columns with task counts; "Add task" at the bottom of each.
- Cards show title, priority badge, due date (red if overdue), and assignee avatar.
- Smooth drag animation with a placeholder where the card will drop.
- Other users' dragged cards show a subtle "being moved by X" indicator.
- Header: board title, member avatars with green dots for online users, filter bar.
- Non-blocking toasts for conflicts ("This task was updated by Sara").
- Connection status chip: Connected / Reconnecting / Offline.
- Mobile: horizontally scrollable columns, long-press to drag, full-screen modal.

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| Realtime propagation latency (p95) | < 300 ms |
| Ordering inconsistencies between clients | 0 in test scenarios |
| Task creation to first move (activation) | < 2 minutes for a new user |
| Weekly active boards with 2+ members | Growth month over month |
| Crash/error-free sessions | > 99% |
| Reconnect success without manual refresh | > 98% |

---

## 8. Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Concurrent drags corrupt ordering | Fractional positioning plus server-authoritative ordering and periodic rebalance |
| Lost updates on simultaneous edits | Versioned updates, field-level patches, conflict toasts |
| Socket event flooding (typing, drag) | Throttle and debounce on client, rate limit on server |
| Scaling realtime across servers | Redis adapter for Socket.io |
| Unauthorized board access via sockets | Authenticate handshake; verify membership on room join and every event |

---

## 9. Release Plan

| Phase | Scope |
|-------|-------|
| **Phase 1** | Auth, boards, tasks CRUD, drag-and-drop, basic Socket.io sync |
| **Phase 2** | Typing, presence, filters, modal, conflict and reconnect handling, responsive polish |
| **Phase 3** | Activity timeline, analytics, attachments |
| **Phase 4** | Hardening: load tests, security review, monitoring |

---

## 10. Open Questions
1. Should invited users who have no account receive an email invite link, or must they already be registered?
2. Are viewer (read-only) roles needed in v1?
3. Should deleted tasks be soft-deleted (recoverable) or permanently removed?
4. Should columns become customizable in a later version?
