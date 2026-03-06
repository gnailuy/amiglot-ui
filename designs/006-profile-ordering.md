---
description: "Persisted ordering for profile languages and availability slots, with drag-and-drop reordering."
whenToUse: "Read when designing profile list ordering, drag-and-drop behavior, or ordering data contracts."
---

# Profile list ordering (Languages + Availability)

## Goal
Preserve the **user-defined order** of profile languages and availability slots across saves/reloads, and let users **drag to reorder**. Ordering must be saved only when the user clicks **Save profile**.

## Scope
- **Languages list** (profile languages)
- **Availability list** (grouped time slots)

## Data model (UI ↔ API)
### Languages
Add a stable integer `order` to each language item.

- **GET /profile** returns `languages[].order`.
- **PUT /profile/languages** accepts `languages[].order`.

Ordering rules:
- UI sorts by `order` ascending.
- If `order` is missing, UI falls back to the existing list order and **normalizes** by assigning indices on the next save.

### Availability
Availability is stored as **weekday-level records** but **displayed as grouped slots**.
Add a stable integer `order` to each availability record.

- **GET /profile** returns `availability[].order`.
- **PUT /profile/availability** accepts `availability[].order`.

Grouping rules:
- UI groups records by `(start_local_time, end_local_time, timezone)` into a single slot.
- **All records in the same group should share the same `order`.**
- UI sorts grouped slots by `order` ascending (fallback to list order if missing).
- If the API returns inconsistent `order` values for the same group, UI uses the **lowest order** as the group order and **normalizes** on the next save by sending the shared order on all records in that group.

## UX behavior
- Each list item shows a **drag handle**.
- Dragging reorders list items immediately in the UI.
- Reordering does **not** persist until the user clicks **Save profile**.
- Keyboard users can reorder using focusable drag handles (keyboard DnD behavior must be supported).

## Implementation notes (UI)
- Use React Hook Form’s `useFieldArray` `move()` to reorder items.
- Keep drag behavior accessible (pointer + keyboard). If using a library, prefer one with first‑class keyboard support.
- For availability groups, maintain a `groupOrder` in form state and expand to weekday records on save.

## API alignment
- API should store and return `order` for both languages and availability records.
- Ordering is a UI concern but must be **persisted** by the API to survive reloads.

## Acceptance criteria
1. Adding multiple languages preserves their input order after save + reload.
2. Dragging languages changes their order; after save + reload, the order matches.
3. Adding multiple availability slots preserves their input order after save + reload.
4. Dragging availability slots changes their order; after save + reload, the order matches.
5. Grouped availability records share the same order for identical `(start, end, timezone)`.
