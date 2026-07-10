import { useState } from "react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { CodeEditor } from "@/components/code-editor";
import { FormField } from "@/components/form-field";
import { RichTextEditor } from "@/components/rich-text-editor";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Editors showcase (W5): the two rich editing surfaces — TipTap RichTextEditor
 * (HTML) and the CodeMirror-backed CodeEditor — both controlled through useState.
 * These are the single wrappers around their engines; screens embed them, never
 * the underlying library.
 */
export function EditorsPage() {
  useLocale();
  const [html, setHtml] = useState(
    '<h2>Release notes</h2><p>This build ships the <strong>Forms</strong> showcase with a <a href="https://example.com">live editor</a>.</p>',
  );
  const [code, setCode] = useState(
    `<section class="card">\n  <h3>Hello</h3>\n  <button onclick="alert('hi')">Click</button>\n</section>`,
  );

  return (
    <ShowcasePage
      title={t("showcase.forms.editors.title")}
      description={t("showcase.forms.editors.desc")}
      breadcrumb={{ group: t("nav.components.forms") }}
    >
      <ComponentDemo
        title={t("showcase.forms.editors.rich")}
        previewClassName="block"
        notes={t("showcase.forms.editors.richNote")}
        code={`const [html, setHtml] = useState("<p>…</p>");

<RichTextEditor value={html} onChange={setHtml} />`}
      >
        <div className="w-full max-w-2xl">
          <FormField name="editor-body" label={t("uikit.field.description")}>
            <RichTextEditor value={html} onChange={setHtml} />
          </FormField>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.forms.editors.code")}
        previewClassName="block"
        notes={t("showcase.forms.editors.codeNote")}
        code={`const [code, setCode] = useState("<section>…</section>");

<CodeEditor value={code} onChange={setCode} ariaLabel="HTML snippet" />`}
      >
        <div className="w-full max-w-2xl">
          <FormField name="editor-code" label="HTML">
            <CodeEditor
              value={code}
              onChange={setCode}
              ariaLabel={t("showcase.forms.editors.code")}
            />
          </FormField>
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
