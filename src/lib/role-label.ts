import { t } from "@/lib/i18n";

/*
 * Built-in demo roles ship with English seed labels (Administrator / Editor /
 * Viewer). They are demo content, so their display name should follow the UI
 * language like the rest of the interface — translate them via `roles.name.<key>`.
 *
 * Rename-safe: a role is only translated while its label still equals the seed
 * default. Once a user renames it (or for any custom role they create), the
 * label is real data and is shown verbatim.
 */
const SEED_ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  editor: "Editor",
  viewer: "Viewer",
};

export function roleDisplayName(role: { key: string; label: string }): string {
  if (SEED_ROLE_LABELS[role.key] === role.label) {
    return t(`roles.name.${role.key}`);
  }
  return role.label;
}
