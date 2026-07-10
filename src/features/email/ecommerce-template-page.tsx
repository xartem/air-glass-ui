import { ShoppingBag } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { TemplatePreview } from "@/features/email/template-preview";
import { t } from "@/lib/i18n";

/*
 * /email/templates/ecommerce — preview an order-confirmation email template.
 * Reachable with email.view.
 */

const HTML = `<div style="font-family: Arial, sans-serif; color: #1f2933; padding: 32px;">
  <h1 style="font-size: 22px; margin: 0 0 4px;">Order confirmed</h1>
  <p style="font-size: 14px; color: #52606d; margin: 0 0 24px;">Order #10542 · July 10, 2026</p>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    <tr style="border-bottom: 1px solid #e4e7eb;">
      <td style="padding: 10px 0;">Aurora Desk Lamp × 1</td>
      <td style="padding: 10px 0; text-align: right;">$49.00</td>
    </tr>
    <tr style="border-bottom: 1px solid #e4e7eb;">
      <td style="padding: 10px 0;">Onyx Water Bottle × 2</td>
      <td style="padding: 10px 0; text-align: right;">$36.00</td>
    </tr>
    <tr>
      <td style="padding: 12px 0; font-weight: bold;">Total</td>
      <td style="padding: 12px 0; text-align: right; font-weight: bold;">$85.00</td>
    </tr>
  </table>
  <div style="text-align: center; margin: 28px 0;">
    <a href="#" style="background: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 15px; display: inline-block;">Track your order</a>
  </div>
  <p style="font-size: 13px; color: #9aa5b1; text-align: center;">
    Thanks for shopping with Air Glass Store.
  </p>
</div>`;

export function EcommerceTemplatePage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title={t("email.templates.ecommerce.title")}
        icon={ShoppingBag}
      />
      <TemplatePreview html={HTML} />
    </div>
  );
}
