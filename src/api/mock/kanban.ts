import { ApiError } from "../client";
import type { KanbanBoard, KanbanCard, KanbanColumn } from "../types";

/*
 * In-memory mock of the kanban board (build-demo-screen-catalog). Shapes mirror
 * the API DTOs (../types) exactly. The board lives in a module-level cache so
 * card moves persist within the session; a real task backend can replace this
 * layer without touching the screen.
 */

const ASSIGNEES = [
  "Ольга Петрова",
  "James Wilson",
  "María García",
  "Luca Rossi",
  "Anna Nowak",
  null,
];

const CARD_TITLES = [
  "Design the new onboarding flow",
  "Fix checkout validation bug",
  "Write API docs for orders",
  "Add dark-mode audit",
  "Refactor the media picker",
  "Prepare Q3 roadmap",
  "Investigate slow dashboard load",
  "Localize the pricing page",
  "Set up error monitoring",
  "Review pull request #482",
  "Update dependency versions",
  "Draft release notes",
];

const CARD_LABELS = [
  ["design"],
  ["bug"],
  ["docs"],
  ["a11y"],
  ["tech-debt"],
  ["planning"],
  ["bug", "perf"],
  ["i18n"],
];

const COLUMN_KEYS = ["backlog", "in_progress", "review", "done"] as const;

let boardCache: KanbanBoard | null = null;

function buildBoard(): KanbanBoard {
  const base = Date.now();
  const cards: Record<string, KanbanCard> = {};
  const columnCards: Record<string, string[]> = {
    backlog: [],
    in_progress: [],
    review: [],
    done: [],
  };

  CARD_TITLES.forEach((title, index) => {
    const id = `card-${index + 1}`;
    cards[id] = {
      id,
      title,
      assignee: ASSIGNEES[index % ASSIGNEES.length]!,
      labels: CARD_LABELS[index % CARD_LABELS.length]!,
      due_at:
        index % 3 === 0
          ? new Date(base + ((index % 5) + 1) * 24 * 3600 * 1000).toISOString()
          : null,
    };
    const columnKey = COLUMN_KEYS[index % COLUMN_KEYS.length]!;
    columnCards[columnKey]!.push(id);
  });

  const columns: KanbanColumn[] = COLUMN_KEYS.map((key) => ({
    id: key,
    title_key: `kanban.column.${key}`,
    card_ids: columnCards[key]!,
  }));

  return { columns, cards };
}

function boardStore(): KanbanBoard {
  boardCache ??= buildBoard();
  return boardCache;
}

export function getBoard(): KanbanBoard {
  return structuredClone(boardStore());
}

/** Move a card to a column at a target index (mock write); returns the whole board. */
export function moveCard(
  cardId: string,
  toColumn: string,
  toIndex: number,
): KanbanBoard {
  const board = boardStore();
  if (!board.cards[cardId]) throw new ApiError(404, "Card not found");
  const target = board.columns.find((column) => column.id === toColumn);
  if (!target) throw new ApiError(404, "Column not found");
  // Detach from its current column first (a card lives in exactly one column).
  for (const column of board.columns) {
    const at = column.card_ids.indexOf(cardId);
    if (at >= 0) column.card_ids.splice(at, 1);
  }
  const index = Math.max(0, Math.min(toIndex, target.card_ids.length));
  target.card_ids.splice(index, 0, cardId);
  return structuredClone(board);
}
