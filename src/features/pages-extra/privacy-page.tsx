import {
  LegalPage,
  type LegalSection,
} from "@/features/pages-extra/legal-page";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /privacy (public): long-form privacy policy. Body paragraphs are placeholder
 * copy — the buyer replaces them with their own legal text.
 */

export function PrivacyPage() {
  useLocale();
  const placeholder = [
    t("legal.privacy.placeholder1"),
    t("legal.privacy.placeholder2"),
  ];
  const sections: LegalSection[] = [
    "introduction",
    "dataWeCollect",
    "howWeUse",
    "sharing",
    "yourRights",
    "contact",
  ].map((id) => ({
    id,
    heading: t(`legal.privacy.section.${id}`),
    body: placeholder,
  }));

  return (
    <LegalPage
      title={t("legal.privacy.title")}
      lastUpdated="2026-07-01"
      sections={sections}
    />
  );
}
