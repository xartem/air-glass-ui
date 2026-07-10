import { Mail } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { TemplatePreview } from "@/features/email/template-preview";
import { t } from "@/lib/i18n";

/*
 * /email/templates/basic — preview a basic transactional email template.
 * Reachable with email.view.
 */

const HTML = `<div style="font-family: Arial, sans-serif; color: #1f2933; padding: 32px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; width: 44px; height: 44px; border-radius: 12px; background: #6366f1;"></div>
  </div>
  <h1 style="font-size: 22px; margin: 0 0 12px; text-align: center;">Welcome to Air Glass</h1>
  <p style="font-size: 15px; line-height: 1.6; color: #52606d;">
    Hi Alex,<br /><br />
    Thanks for signing up. Your account is ready — you can start exploring the
    dashboard right away. If you have any questions, just reply to this email.
  </p>
  <div style="text-align: center; margin: 28px 0;">
    <a href="#" style="background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 15px; display: inline-block;">Get started</a>
  </div>
  <p style="font-size: 13px; color: #9aa5b1; text-align: center; margin-top: 24px;">
    You received this email because you created an Air Glass account.
  </p>
</div>`;

export function BasicTemplatePage() {
  return (
    <div className="space-y-4">
      <PageHeader title={t("email.templates.basic.title")} icon={Mail} />
      <TemplatePreview html={HTML} />
    </div>
  );
}
