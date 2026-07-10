import {
  LegalPage,
  type LegalSection,
} from "@/features/pages-extra/legal-page";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /terms (public): long-form terms & conditions. Body paragraphs are placeholder
 * copy — the buyer replaces them with their own legal text.
 */

export function TermsPage() {
  useLocale();
  const placeholder = [
    t("legal.terms.placeholder1"),
    t("legal.terms.placeholder2"),
  ];
  const sections: LegalSection[] = [
    "acceptance",
    "useOfService",
    "accounts",
    "intellectualProperty",
    "liability",
    "contact",
  ].map((id) => ({
    id,
    heading: t(`legal.terms.section.${id}`),
    body: placeholder,
  }));

  return (
    <LegalPage
      title={t("legal.terms.title")}
      lastUpdated="2026-07-01"
      sections={sections}
    />
  );
}
