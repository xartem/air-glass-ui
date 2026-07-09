import {
  LegalPage,
  type LegalSection,
} from "@/features/pages-extra/legal-page";
import { t } from "@/lib/i18n";

/*
 * /terms (public): long-form terms & conditions. Body paragraphs are placeholder
 * copy — the buyer replaces them with their own legal text.
 */

const PLACEHOLDER = [
  "This is placeholder copy for a template. Replace it with your own terms before going live.",
  "By using the service you agree to the conditions described in this section.",
];

export function TermsPage() {
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
    body: PLACEHOLDER,
  }));

  return (
    <LegalPage
      title={t("legal.terms.title")}
      lastUpdated="2026-07-01"
      sections={sections}
    />
  );
}
