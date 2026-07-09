import {
  LegalPage,
  type LegalSection,
} from "@/features/pages-extra/legal-page";
import { t } from "@/lib/i18n";

/*
 * /privacy (public): long-form privacy policy. Body paragraphs are placeholder
 * copy — the buyer replaces them with their own legal text.
 */

const PLACEHOLDER = [
  "This is placeholder copy for a template. Replace it with your own policy before going live.",
  "We describe here what information is collected, how it is used, and the choices available to you.",
];

export function PrivacyPage() {
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
    body: PLACEHOLDER,
  }));

  return (
    <LegalPage
      title={t("legal.privacy.title")}
      lastUpdated="2026-07-01"
      sections={sections}
    />
  );
}
