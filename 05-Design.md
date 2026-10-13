# Design Document
## UI/UX Design and Detailed Technical Design

---

# Part A: UI/UX Design

## 1. Design Principles
1. **Instant feedback:** every action responds immediately (optimistic UI).
2. **Calm collaboration:** presence and activity are visible but never distracting.
3. **Clarity at a glance:** priority, due date, and assignee readable without opening a card.
4. **Touch-first responsiveness:** works equally well with mouse and finger.

## 2. Screens

### 2.1 Board List (`/boards`)
```
┌──────────────────────────────────────────────┐
│  Logo                         [Avatar ▾]     │
├──────────────────────────────────────────────┤
│  Your Boards                    [+ New Board]│
│  ┌────────┐ ┌────────┐ ┌────────┐            │
│  │Sprint12│ │Website │ │Launch  │            │
│  │ 4 mem. │ │ 7 mem. │ │ 2 mem. │            │
│  └────────┘ └────────┘ └────────┘            │
└──────────────────────────────────────────────┘
```

### 2.2 Kanban Board (`/boards/:id`)
```
┌───────────────────────────────────────────────────────────────┐
│ Sprint 12     (P)(A)(S)(+2)  ● 3 online   [Invite] [Activity] │
│ Filters: [Priority ▾] [Member ▾] [Due date ▾]  [Clear]  ●Live │
├───────────────────────────────────────────────────────────────┤
│ TODO (4)       IN PROGRESS (2)   REVIEW (1)     DONE (6)      │
│ ┌───────────┐  ┌───────────┐     ┌───────────┐  ┌──────────┐  │
│ │▌Login UI  │  │▌API auth  │     │▌Nav bug   │  │ Setup    │  │
│ │ HIGH  Oct30│ │ URGENT    │     │ MED       │  │ LOW      │  │
│ │ (S)        │ │ (A) 💬 📎 │     │ (P)       │  │ (A)      │  │
│ └───────────┘  └───────────┘     └───────────┘  └──────────┘  │
│ ┌───────────┐  ┌ ─ ─ ─ ─ ─ ┐                                  │
│ │▌DB schema │  │ Arjun is   │  ← ghost card: another user's    │
│ └───────────┘  │ moving…    │    live drag                     │
│ [+ Add task]   └ ─ ─ ─ ─ ─ ┘                                  │
└───────────────────────────────────────────────────────────────┘
```

### 2.3 Task Modal
```
┌──────────────────────────────────────────────┐
│ Title: [ Design login page            ]   ✕  │
│ ✎ Sara is typing…                            │
│                                              │
│ Description                                  │
│ [ multiline editor                         ] │
│                                              │
│ Status [Todo ▾]   Priority [High ▾]          │
│ Assignee [Sara ▾] Due date [📅 2026-10-30]   │
│                                              │
│ Attachments (bonus)  [+ Upload]              │
│ Activity (bonus)  • Priya changed priority…  │
│                                              │
│ [Delete]                    [Close]          │
└──────────────────────────────────────────────┘
```
Fields auto-save on blur (debounced); no explicit Save button is needed.

### 2.4 Activity Sidebar (bonus)
Slide-in panel with a live feed: avatar, sentence ("Arjun moved *API auth* to Review"), relative time.

### 2.5 Analytics Page (bonus)
Cards (total, overdue, completed this week), bar chart of tasks per column, donut chart per assignee, line chart of completed tasks over time.

## 3. Visual Language

| Element | Spec |
|---------|------|
| Typeface | Inter / system sans-serif |
| Column header | Uppercase 12 px, count badge |
| Card | White, 8 px radius, subtle shadow, 12 px padding |
| Priority | Left color bar and badge: Low gray, Medium blue, High orange, Urgent red |
| Due date | Neutral; amber if due within 24 h; red if overdue |
| Presence | Green dot on avatar |
| Columns | Todo (slate), In Progress (blue), Review (purple), Done (green) accents |
| Dark mode | Token-based colors, optional in v1 |

## 4. Interaction Design

**Drag and drop**
- Pick up: card lifts (shadow, slight tilt), drop placeholder appears.
- Others see a dashed ghost with "<name> is moving…".
- Drop: card settles; on server rejection it animates back with a toast.
- Keyboard alternative: focus card, Space to lift, arrow keys to move, Space to drop.

**Typing indicator:** "✎ Name is typing…" under the field being edited; multiple users show "Sara and Arjun are typing…".

**Presence:** avatars with green dots; hover shows names; overflow shows "+N".

**Connection chip**
- Green "Live", amber "Reconnecting…", red "Offline - changes will sync".

**Conflict toast:** "Sara updated this task. [View changes]"; the modal shows the latest values with the user's unsaved text preserved.

**Empty states:** an empty column shows "Drop tasks here"; an empty board shows a guided "Add your first task".

## 5. Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| ≥1024 px | All four columns visible, side activity panel |
| 640-1023 px | Columns scroll horizontally, snap to column |
| <640 px | One column per screen width, swipe between columns, tab strip of column names, full-screen modal, long-press to drag, filter bar collapses into a sheet |

## 6. Accessibility
- WCAG AA contrast; priority never conveyed by color alone (text badge too).
- ARIA live region announces remote changes ("Task moved to Review").
- Focus trap in the modal, Esc to close.
- Visible focus rings; touch targets at least 44 px.

---

# Part B: Detailed Technical Design

## 7. Mongoose Schemas

```js
// models/Board.js
const boardSchema = new Schema({
  title:     { type: String, required: true, trim: true, maxlength: 100 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role:     { type: String, enum: ['owner', 'member', 'viewer'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  eventSeq:  { type: Number, default: 0 }
}, { timestamps: true });
boardSchema.index({ 'members.user': 1 });

// models/Task.js
const taskSchema = new Schema({
  boardId:     { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
  title:       { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, maxlength: 5000, default: '' },
  priority:    { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  dueDate:     { type: Date },
  assignedTo:  { type: Schema.Types.ObjectId, ref: 'User' },
  status:      { type: String, enum: ['todo', 'in_progress', 'review', 'done'], default: 'todo' },
  position:    { type: Number, required: true },
  version:     { type: Number, default: 1 },
  createdBy:   { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
taskSchema.index({ boardId: 1, status: 1, position: 1 });
taskSchema.index({ boardId: 1, assignedTo: 1 });
taskSchema.index({ boardId: 1, dueDate: 1 });

// models/Activity.js
const activitySchema = new Schema({
  boardId: { type: Schema.Types.ObjectId, index: true },
  taskId:  { type: Schema.Types.ObjectId },
  actor:   { type: Schema.Types.ObjectId, ref: 'User' },
  action:  { type: String },   // task.created | task.moved | task.updated | task.deleted | member.invited
  meta:    { type: Object },   // { from, to, fields }
}, { timestamps: { createdAt: true, updatedAt: false } });
```

## 8. Move Task: Service Logic

```js
async function moveTask({ taskId, toStatus, beforeTaskId, afterTaskId, userId, opId }) {
  const cached = await opLog.get(opId);            // idempotency
  if (cached) return cached;

  const task = await Task.findById(taskId);
  if (!task) throw new NotFound();
  await assertMember(task.boardId, userId);
  if (!STATUSES.includes(toStatus)) throw new BadRequest('INVALID_STATUS');

  const [before, after] = await Promise.all([
    beforeTaskId ? Task.findOne({ _id: beforeTaskId, boardId: task.boardId, status: toStatus }) : null,
    afterTaskId  ? Task.findOne({ _id: afterTaskId,  boardId: task.boardId, status: toStatus }) : null,
  ]);

  let position = await computePosition(task.boardId, toStatus, before, after);
  // computePosition: between neighbors -> midpoint; top -> first/2; bottom -> last+1000; empty -> 1000
  // if gap < EPS -> rebalanceColumn() then recompute

  const from = task.status;
  const updated = await Task.findByIdAndUpdate(
    taskId,
    { $set: { status: toStatus, position }, $inc: { version: 1 } },
    { new: true }
  );

  const seq = await nextSeq(task.boardId);
  const result = { task: updated, from, to: toStatus, seq };
  await opLog.set(opId, result);
  await Activity.create({ boardId: task.boardId, taskId, actor: userId, action: 'task.moved', meta: { from, to: toStatus } });
  broadcast(task.boardId, 'task:moved', { ...result, actorId: userId, opId });
  return result;
}
```

## 9. Socket Setup (server)

```js
io.use(async (socket, next) => {
  try { socket.data.user = verifyJwt(socket.handshake.auth.token); next(); }
  catch { next(new Error('UNAUTHORIZED')); }
});

io.on('connection', (socket) => {
  socket.on('board:join', async ({ boardId, lastEventSeq }) => {
    if (!(await isMember(boardId, socket.data.user.id))) return socket.emit('error:event', { code: 'FORBIDDEN' });
    socket.join(`board:${boardId}`);
    presence.add(boardId, socket.data.user.id, socket.id);
    io.to(`board:${boardId}`).emit('presence:update', presence.list(boardId));
    await sendCatchUp(socket, boardId, lastEventSeq);   // missed events or board:snapshot
  });

  socket.on('typing:start', throttle(({ boardId, taskId, field }) => {
    socket.to(`board:${boardId}`).emit('typing:update', typing.set(boardId, taskId, socket.data.user.id, field));
  }));

  socket.on('disconnect', () => {
    presence.removeSocket(socket.id).forEach(boardId =>
      io.to(`board:${boardId}`).emit('presence:update', presence.list(boardId)));
  });
});
```

## 10. Client Reducer Logic (key actions)

```js
taskMoved(state, { payload: { task, actorId, opId, seq } }) {
  if (state.pendingOps[opId]) { delete state.pendingOps[opId]; state.tasks.byId[task._id] = task; return; }
  if (seq !== state.lastEventSeq + 1) { state.needsSync = true; }        // gap detected
  remove id from old column list; insert into new column list sorted by position;
  state.tasks.byId[task._id] = task;
  state.lastEventSeq = Math.max(state.lastEventSeq, seq);
}
```

Filter selector:
```js
const selectVisible = (status) => createSelector(
  [selectIds(status), selectTasks, selectFilters],
  (ids, tasks, f) => ids.map(id => tasks[id]).filter(t =>
    (!f.priority || t.priority === f.priority) &&
    (!f.memberId || t.assignedTo === f.memberId) &&
    matchesDate(t.dueDate, f.dateRange))
);
```

## 11. Component Tree

```
<App>
 ├─ <AuthProvider>
 ├─ <Router>
 │   ├─ <BoardListPage>
 │   └─ <BoardPage>
 │       ├─ <BoardHeader> (title, <PresenceAvatars>, <InviteButton>, <ConnectionChip>)
 │       ├─ <FilterBar>
 │       ├─ <DragDropContext>
 │       │   └─ <Column> ×4
 │       │        └─ <TaskCard> (priority bar, due date, assignee, drag ghost)
 │       ├─ <TaskModal> (<TypingIndicator>, <AttachmentList>)
 │       └─ <ActivityPanel>
```

## 12. Testing Plan

| Level | Scenarios |
|-------|-----------|
| Unit | Position computation, rebalance, filter selectors, reducers |
| API | CRUD authorization, 409 version conflicts, invalid positions, idempotent `opId` |
| Socket | Join authorization, broadcast reaches other clients, presence on connect/disconnect, typing expiry |
| Concurrency | 10 clients moving cards in one column at once: all clients converge on identical order |
| Resilience | Kill network for 30 s, then verify snapshot and queued ops replay |
| E2E (Playwright, 2 browser contexts) | Drag in one window, observe in the other; edit modal; filters |
| Load | 50 concurrent sockets per board, 1,000 tasks, latency under 300 ms |

## 13. Implementation Order
1. Models, auth, board and task REST APIs.
2. Kanban UI with drag-and-drop and store (no realtime).
3. Socket.io rooms and `task:*` broadcasts.
4. Position algorithm, versioning, and `opId` idempotency.
5. Presence and typing indicators.
6. Reconnect, sequence numbers, and snapshot sync.
7. Filters, responsive polish, accessibility.
8. Bonus: activity timeline, analytics, attachments.
9. Test suite and load test.
