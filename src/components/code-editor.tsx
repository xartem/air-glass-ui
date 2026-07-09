import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { html } from "@codemirror/lang-html";

import { cn } from "@/lib/utils";

/*
 * CodeEditor (E2 §2/§7): the ONLY place @codemirror/* is imported — code fields
 * everywhere embed <CodeEditor>, never touch the engine directly (same rule as
 * RichTextEditor). CodeMirror 6 (MIT). `html()` also highlights embedded <script>
 * (JS) and <style> (CSS). This module is loaded lazily by consumers so the editor
 * stays out of the main bundle (E2 §2 bundle budget).
 */
export function CodeEditor({
  value,
  onChange,
  minHeight = 180,
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
  className?: string;
  ariaLabel?: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  // Keep the latest onChange without recreating the editor.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!parentRef.current) return;
    const view = new EditorView({
      parent: parentRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          html(),
          EditorView.lineWrapping,
          // Inherit the admin surface; only size + monospace are pinned here.
          EditorView.theme({
            "&": {
              minHeight: `${minHeight}px`,
              backgroundColor: "transparent",
              fontSize: "13px",
            },
            ".cm-scroller": {
              fontFamily: "var(--font-mono, ui-monospace, monospace)",
            },
            ".cm-gutters": { backgroundColor: "transparent", border: "none" },
            "&.cm-focused": { outline: "none" },
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged)
              onChangeRef.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    if (ariaLabel) view.contentDOM.setAttribute("aria-label", ariaLabel);
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Mount once; external value changes are synced by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. SaveBar reset) without disturbing the cursor
  // when the value already matches (avoids a feedback loop with onChange).
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={parentRef}
      data-slot="code-editor"
      className={cn(
        "overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring",
        className,
      )}
    />
  );
}
