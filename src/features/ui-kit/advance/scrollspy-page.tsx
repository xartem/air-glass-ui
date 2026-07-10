import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { useScrollSpy } from "@/hooks/use-scroll-spy";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * ScrollSpy showcase (W5): the useScrollSpy gap hook highlights the anchor for
 * the section currently in view via IntersectionObserver. Clicking an anchor
 * scrolls its section into view. The hook logs its own active changes.
 */

const SECTIONS = [
  { id: "spy-introduction", key: "introduction" },
  { id: "spy-installation", key: "installation" },
  { id: "spy-usage", key: "usage" },
  { id: "spy-theming", key: "theming" },
  { id: "spy-accessibility", key: "accessibility" },
] as const;

const IDS = SECTIONS.map((section) => section.id);

export function ScrollSpyPage() {
  useLocale();
  const active = useScrollSpy(IDS, { rootMargin: "0px 0px -55% 0px" });

  return (
    <ShowcasePage
      title={t("showcase.advance.scrollspy.title")}
      description={t("showcase.advance.scrollspy.desc")}
      breadcrumb={{ group: t("nav.components.advance") }}
    >
      <ComponentDemo
        title={t("showcase.s.default")}
        notes={t("showcase.advance.scrollspy.note")}
        previewClassName="items-stretch"
        code={`const ids = ["spy-introduction", "spy-installation", "spy-usage"];
const active = useScrollSpy(ids);

<a aria-current={active === id ? "true" : undefined} href={"#" + id}>…</a>
<section id={id}>…</section>`}
      >
        <div className="grid w-full gap-4 sm:grid-cols-[10rem_1fr]">
          <nav
            aria-label={t("showcase.advance.scrollspy.navLabel")}
            className="hidden sm:block"
          >
            <ul className="sticky top-4 flex flex-col gap-1 text-sm">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    aria-current={active === section.id ? "true" : undefined}
                    className={cn(
                      "block rounded-md border-s-2 px-3 py-1.5 transition-colors",
                      active === section.id
                        ? "border-primary bg-primary/10 font-medium text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t(`showcase.advance.scrollspy.${section.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="h-72 overflow-y-auto rounded-lg border border-[var(--glass-border)]">
            <div className="flex flex-col gap-6 p-4">
              {SECTIONS.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-4 space-y-2"
                >
                  <h3 className="text-sm font-semibold tracking-tight">
                    {t(`showcase.advance.scrollspy.${section.key}`)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("showcase.advance.scrollspy.body")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("showcase.advance.scrollspy.body")}
                  </p>
                </section>
              ))}
            </div>
          </div>
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
