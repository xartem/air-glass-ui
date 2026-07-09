import { useMemo, useState } from "react";
import { devDebug } from "@/lib/debug";
import { useQuery } from "@tanstack/react-query";
import { CircleHelp } from "lucide-react";

import { api } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SearchInput } from "@/components/toolbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /faq: grouped Q&A with a category tab bar and a search box that filters across
 * questions and answers. Mock-driven; shows an empty state when nothing matches.
 */

const CATEGORIES = [
  "all",
  "general",
  "billing",
  "account",
  "security",
] as const;

export function FaqPage() {
  useLocale();
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const faqQuery = useQuery({
    queryKey: ["pages", "faq"],
    queryFn: api.pages.faq,
  });
  devDebug("[FaqPage] query", { status: faqQuery.status, category });

  const items = useMemo(() => {
    const rows = faqQuery.data ?? [];
    const q = search.toLowerCase().trim();
    return rows.filter((entry) => {
      if (category !== "all" && entry.category !== category) return false;
      if (q && !`${entry.question} ${entry.answer}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [faqQuery.data, category, search]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title={t("faq.title")}
        icon={CircleHelp}
        breadcrumbs={[{ label: t("faq.title") }]}
      />
      <Panel
        actions={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("faq.search")}
            className="w-full sm:w-64"
          />
        }
      >
        <Tabs value={category} onValueChange={setCategory} className="mb-4">
          <TabsList className="flex-wrap">
            {CATEGORIES.map((key) => (
              <TabsTrigger key={key} value={key}>
                {t(`faq.category.${key}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {faqQuery.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : faqQuery.isError ? (
          <EmptyState
            title={t("table.error.title")}
            description={t("table.error.description")}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={CircleHelp}
            title={t("faq.empty.title")}
            description={t("faq.empty.description")}
          />
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {items.map((entry) => (
              <AccordionItem key={entry.id} value={`faq-${entry.id}`}>
                <AccordionTrigger>{entry.question}</AccordionTrigger>
                <AccordionContent>{entry.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </Panel>
    </div>
  );
}
