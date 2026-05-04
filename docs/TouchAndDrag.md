Touch and Drag / Tap behavior

This document describes the tap (short press) and long-press drag behavior used by the Queens board UI.

Specification

- Long press detection:
  - A press is considered a long press if either:
    - The pointer is held for 0.33 seconds (330 ms) or longer, OR
    - While the pointer is down, the user moves (drags) into a different cell.
  - If neither of the above occurs, the action is a short press (tap).

- Short press (tap):
  - A short press targets the cell that was pressed (the start cell).
  - The cell cycles through states in this order on each short press:
    - Empty -> Cross -> Queen -> Empty -> ...
  - Implementation notes: the short press performs exactly one cycle step.

- Long press (press-and-drag):
  - Determine the start cell's state A when the long press begins.
  - If A is `Cross`: the long-press action fills every touched cell with `Empty`.
  - If A is `Empty`: the long-press action fills every touched cell with `Cross`.
  - If A is `Queen`: no mass-fill is performed; the behavior falls back to a short-press on the start cell.
  - "Touched cells" includes the start cell and any cell the pointer moved into while the press was active.
  - The fill operation is applied immediately as the user touches cells during the long press. Specifically:
    - The start cell is updated when the long-press condition is reached (after 0.33 seconds / 330 ms) or when the user moves off the start cell while still pressing. Cells that already contain a `Queen` are never modified by long-press operations.
    - Any other cell the pointer moves into while the long press is active is updated instantly when touched.
    - The target value for these immediate updates is computed from the start cell's state A (A=Empty -> set Cross, A=Cross -> set Empty). If A is `Queen`, no mass-fill occurs; the start cell is cycled once when long-press is detected.

Implementation details and edge cases

- The implementation attempts to use a provided `onSetCell(pos, value)` callback (preferred) to set cells to a specific value. If `onSetCell` is not provided, `onToggle(pos)` is used as a best-effort fallback.
- When falling back to `onToggle`, the implementation does a single `onToggle` call per touched cell where possible. For some cases (e.g., starting from `Queen` and wanting `Cross`), multiple toggles would be needed; this is best-effort only and may not be reliable without `onSetCell`.
- The UI uses a 0.33 second (330 ms) timer to decide long press. Dragging into another cell before the timer expires also triggers long-press mode immediately.

Rationale

- This behavior provides a quick way to place or clear repeated `Cross` marks across many cells (useful for pencil marks / blocking), while keeping the short press easy for placing/removing single markers and queens.

User-visible examples

- Short tap on an empty cell: it becomes `Cross`.
- Tap again on that cell: it becomes `Queen`.
- Long press starting on an empty cell, drag across three cells, release: all those cells become `Cross`.
- Long press starting on a `Cross`, drag across three cells, release: all those cells become `Empty`.
- Long press starting on a `Queen`: no mass-fill; start cell cycles once instead.


