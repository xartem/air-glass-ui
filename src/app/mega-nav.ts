import {
  isNavParent,
  type NavEntry,
  type NavGroup,
  type NavIcon,
  type NavItem,
  type NavParent,
} from "@/app/nav";

/*
 * Megamenu bar model for the horizontal shell layout. Turns the permission-filtered
 * nav groups into bar items with pre-packed panel columns, so the UI layer only renders.
 * The "menu" group's top-level parents are promoted to their own bar buttons; every
 * other group becomes a single bar button. Nesting beyond one level is flattened into
 * titled sections — panels never show submenus.
 */

/** One titled block of links inside a panel column. `label` is absent on headerless chunks. */
export interface MegaSection {
  key: string;
  label?: string;
  icon?: NavIcon;
  items: NavItem[];
}

export interface MegaColumn {
  key: string;
  sections: MegaSection[];
}

export interface MegaBarItem {
  key: string;
  label: string;
  columns: MegaColumn[];
}

/** Max rows (headers + links) per packed column before content spills to the next one. */
export const MEGA_ROW_CAP = 12;
/** Column size for bar items made of plain links with no section headers. */
export const MEGA_LEAF_CHUNK = 8;

/** The group whose top-level parents become individual bar buttons. */
const PROMOTED_GROUP_KEY = "menu";

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size));
  return out;
}

/** Flatten a parent subtree into sections: its direct leaves first, then one section per nested parent. */
function flattenParent(parent: NavParent): MegaSection[] {
  const leaves = parent.children.filter(
    (child): child is NavItem => !isNavParent(child),
  );
  const sections: MegaSection[] = [];
  if (leaves.length > 0)
    sections.push({
      key: parent.key,
      label: parent.label,
      icon: parent.icon,
      items: leaves,
    });
  for (const child of parent.children)
    if (isNavParent(child)) sections.push(...flattenParent(child));
  return sections;
}

function sectionsFromEntries(
  parentKey: string,
  entries: NavEntry[],
): MegaSection[] {
  const leaves = entries.filter(
    (entry): entry is NavItem => !isNavParent(entry),
  );
  const sections: MegaSection[] = [];
  if (leaves.length > 0)
    sections.push({ key: `${parentKey}.items`, items: leaves });
  for (const entry of entries)
    if (isNavParent(entry)) sections.push(...flattenParent(entry));
  return sections;
}

function sectionRows(section: MegaSection): number {
  return (section.label ? 1 : 0) + section.items.length;
}

/** Split a section taller than the row cap into header-first continuation chunks. */
function splitOversized(section: MegaSection): MegaSection[] {
  if (sectionRows(section) <= MEGA_ROW_CAP) return [section];
  const headRows = section.label ? MEGA_ROW_CAP - 1 : MEGA_ROW_CAP;
  const head = section.items.slice(0, headRows);
  const rest = chunk(section.items.slice(headRows), MEGA_ROW_CAP);
  return [
    { ...section, items: head },
    ...rest.map((items, index) => ({
      key: `${section.key}.overflow${index + 1}`,
      items,
    })),
  ];
}

/** Greedy top-to-bottom packing: sections keep nav order, columns fill up to the row cap. */
function packColumns(barKey: string, sections: MegaSection[]): MegaColumn[] {
  const columns: MegaColumn[] = [];
  let current: MegaSection[] = [];
  let rows = 0;
  const flush = () => {
    if (current.length > 0)
      columns.push({
        key: `${barKey}.col${columns.length + 1}`,
        sections: current,
      });
    current = [];
    rows = 0;
  };
  for (const section of sections.flatMap(splitOversized)) {
    const size = sectionRows(section);
    if (rows > 0 && rows + size > MEGA_ROW_CAP) flush();
    current.push(section);
    rows += size;
  }
  flush();
  return columns;
}

function barItem(
  key: string,
  label: string,
  entries: NavEntry[],
): MegaBarItem | null {
  const sections = sectionsFromEntries(key, entries).filter(
    (section) => section.items.length > 0,
  );
  if (sections.length === 0) return null;
  // A plain link list (no headers anywhere) reads better as evenly chunked columns.
  if (sections.every((section) => !section.label)) {
    const items = sections.flatMap((section) => section.items);
    return {
      key,
      label,
      columns: chunk(items, MEGA_LEAF_CHUNK).map((part, index) => ({
        key: `${key}.col${index + 1}`,
        sections: [{ key: `${key}.chunk${index + 1}`, items: part }],
      })),
    };
  }
  return { key, label, columns: packColumns(key, sections) };
}

export function buildMegaBar(groups: NavGroup[]): MegaBarItem[] {
  const bar: MegaBarItem[] = [];
  for (const group of groups) {
    if (group.key === PROMOTED_GROUP_KEY) {
      for (const entry of group.items) {
        if (isNavParent(entry)) {
          const item = barItem(entry.key, entry.label, entry.children);
          if (item) bar.push(item);
        }
      }
      // Loose top-level links (no parent) still need a home: one bar item under the group label.
      const loose = group.items.filter((entry) => !isNavParent(entry));
      if (loose.length > 0) {
        const item = barItem(group.key, group.label, loose);
        if (item) bar.push(item);
      }
    } else {
      const item = barItem(group.key, group.label, group.items);
      if (item) bar.push(item);
    }
  }
  return bar;
}
