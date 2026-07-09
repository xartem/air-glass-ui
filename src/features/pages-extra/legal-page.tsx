import { Panel } from "@/components/panel";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Shared long-form legal layout (privacy, terms): a sticky anchor-link table of
 * contents beside a reading column. Section headings are localized; the body
 * paragraphs are placeholder copy the buyer replaces.
 */

export interface LegalSection {
  id: string;
  heading: string;
  body: string[];
}

export function LegalPage({
  title,
  lastUpdated,
  sections,
}: {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}) {
  useLocale();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {t("legal.lastUpdated", { date: lastUpdated })}
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav
          aria-label={t("legal.toc")}
          className="lg:sticky lg:top-6 lg:h-fit"
        >
          <ul className="space-y-1 text-sm">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="block rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <Panel>
          <article className="max-w-2xl space-y-8">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-6 space-y-2"
              >
                <h2 className="text-lg font-semibold tracking-tight">
                  {section.heading}
                </h2>
                {section.body.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-sm leading-relaxed text-muted-foreground"
                  >
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </article>
        </Panel>
      </div>
    </div>
  );
}
