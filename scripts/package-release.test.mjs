import { describe, expect, it } from "vitest";

import {
  FORBIDDEN,
  ROOT_INCLUDE,
  SOURCE_EXCLUDE,
  SOURCE_INCLUDE,
  globToRegExp,
  isSourceIncluded,
} from "./package-release.mjs";

/*
 * The archive contents are the product, so the matcher that decides them is
 * worth pinning. These cases exercise the pure path logic only — no gate, no
 * build, no filesystem.
 *
 * The property that matters most is that this is a WHITELIST: anything not
 * named is out. A blacklist has already let development junk ship once.
 */

describe("globToRegExp", () => {
  it("keeps a single * inside one path segment", () => {
    const re = globToRegExp("src/*.ts");
    expect(re.test("src/main.ts")).toBe(true);
    expect(re.test("src/lib/main.ts")).toBe(false);
  });

  it("lets ** span separators", () => {
    const re = globToRegExp("src/**");
    expect(re.test("src/main.ts")).toBe(true);
    expect(re.test("src/features/shop/orders-page.tsx")).toBe(true);
  });

  it("matches zero directories for a **/ prefix", () => {
    const re = globToRegExp("**/changelog.txt");
    expect(re.test("changelog.txt")).toBe(true);
    expect(re.test("src/features/shop/changelog.txt")).toBe(true);
  });

  it("treats dots literally rather than as any-character", () => {
    const re = globToRegExp("package.json");
    expect(re.test("package.json")).toBe(true);
    expect(re.test("packageXjson")).toBe(false);
  });
});

describe("isSourceIncluded", () => {
  it("admits the source tree and the build config a buyer needs", () => {
    for (const rel of [
      "src/main.tsx",
      "src/features/shop/orders-page.tsx",
      "src/locales/ar.json",
      "public/favicon.svg",
      "scripts/check-rtl.mjs",
      "index.html",
      "package.json",
      "package-lock.json",
      "tsconfig.app.json",
      "vite.config.ts",
      "vitest.config.ts",
      "components.json",
      ".oxlintrc.json",
      ".gitignore",
      "README.md",
    ]) {
      expect(isSourceIncluded(rel), rel).toBe(true);
    }
  });

  it("ships the tests — they are part of what the buyer is paying for", () => {
    expect(isSourceIncluded("src/lib/i18n.test.ts")).toBe(true);
  });

  it("rejects the development artifacts that must never reach a buyer", () => {
    for (const rel of [
      "src/features/shop/changelog.txt",
      "changelog.txt",
      "src/.DS_Store",
      "AGENTS.md",
      ".mcp.json",
      "skills-lock.json",
      ".ai-factory.json",
      ".ai-factory/plans/some-plan.md",
      ".claude/skills/air-glass-package/SKILL.md",
      ".playwright-mcp/page-1.yml",
      "audit/buttons-light-glass.png",
      "screenshots/settings/site-1280.png",
      "node_modules/react/index.js",
    ]) {
      expect(isSourceIncluded(rel), rel).toBe(false);
    }
  });

  it("is a whitelist: an unknown file at the root is not admitted by default", () => {
    // The regression this guards against — junk appearing at the root and
    // riding along because nothing explicitly forbade it.
    for (const rel of [
      "notes.md",
      "todo.txt",
      "maps-markers.png",
      "backup.sql",
      "nginx.txt",
      "some-new-folder/file.ts",
    ]) {
      expect(isSourceIncluded(rel), rel).toBe(false);
    }
  });

  it("excludes a file inside an included directory when it is denied", () => {
    expect(isSourceIncluded("src/features/x/page.tsx")).toBe(true);
    expect(isSourceIncluded("src/features/x/changelog.txt")).toBe(false);
  });
});

describe("pattern hygiene", () => {
  it("declares no include pattern twice", () => {
    const all = [...SOURCE_INCLUDE, ...ROOT_INCLUDE];
    expect(new Set(all).size).toBe(all.length);
  });

  it("never both includes and forbids the same path", () => {
    const clash = FORBIDDEN.filter((name) => isSourceIncluded(name));
    expect(clash).toEqual([]);
  });

  it("keeps every exclude pattern relevant to something included", () => {
    // An exclude that can never fire is dead configuration; this catches one
    // left behind after the include it guarded was renamed.
    for (const pattern of SOURCE_EXCLUDE) {
      const sample = pattern.replace("**/", "src/features/x/");
      expect(isSourceIncluded(sample), pattern).toBe(false);
    }
  });
});
