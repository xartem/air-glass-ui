import { useEffect, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Toggle } from "@/components/ui/toggle";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * RichTextEditor (E6 §3, E2 §7: field type `richtext`) — TipTap (E2 §2).
 * Value is an HTML string; sanitization ALWAYS happens server-side before storage (C3) —
 * the editor itself never trusts or cleans markup.
 */

function LinkControl({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  const apply = () => {
    if (url) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next)
          setUrl(
            (editor.getAttributes("link").href as string | undefined) ?? "",
          );
      }}
    >
      <PopoverTrigger asChild>
        <Toggle
          size="sm"
          pressed={editor.isActive("link")}
          aria-label={t("richtext.link")}
        >
          <LinkIcon className="size-4" />
        </Toggle>
      </PopoverTrigger>
      <PopoverContent
        className="flex w-80 items-center gap-2 p-2"
        align="start"
      >
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://…"
          className="h-8 min-h-8"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              apply();
            }
          }}
        />
        <Button size="sm" onClick={apply}>
          {t("common.save")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function ToolbarToggle({
  pressed,
  onPressedChange,
  label,
  children,
}: {
  pressed: boolean;
  onPressedChange: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Toggle
      size="sm"
      pressed={pressed}
      onPressedChange={onPressedChange}
      aria-label={label}
    >
      {children}
    </Toggle>
  );
}

export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder,
  className,
}: {
  id?: string;
  /** HTML string (sanitized server-side on save, C3). */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const editor = useEditor({
    extensions: [
      // StarterKit v3 ships Link built-in — configure it here, do not add it twice
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false },
      }),
    ],
    content: value,
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
    editorProps: {
      attributes: {
        id: id ?? "",
        class:
          "prose prose-sm max-w-none min-h-36 px-3 py-2 outline-none " +
          "[&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold " +
          "[&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5 " +
          "[&_blockquote]:border-s-2 [&_blockquote]:ps-3 [&_blockquote]:text-muted-foreground " +
          "[&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1",
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
    },
  });

  // Sync external `value` changes (canned responses, programmatic clear after
  // send) into the editor. Guard on getHTML() so typing never triggers a reset;
  // setContent defaults to emitUpdate:false in TipTap v3, so no update loop.
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div
      data-slot="rich-text-editor"
      className={cn(
        "rounded-md border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b p-1">
        <ToolbarToggle
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          label={t("richtext.bold")}
        >
          <Bold className="size-4" />
        </ToolbarToggle>
        <ToolbarToggle
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          label={t("richtext.italic")}
        >
          <Italic className="size-4" />
        </ToolbarToggle>
        <ToolbarToggle
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          label={t("richtext.strike")}
        >
          <Strikethrough className="size-4" />
        </ToolbarToggle>
        <span aria-hidden className="mx-1 h-5 w-px self-center bg-border" />
        <ToolbarToggle
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          label="H2"
        >
          <Heading2 className="size-4" />
        </ToolbarToggle>
        <ToolbarToggle
          pressed={editor.isActive("heading", { level: 3 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          label="H3"
        >
          <Heading3 className="size-4" />
        </ToolbarToggle>
        <span aria-hidden className="mx-1 h-5 w-px self-center bg-border" />
        <ToolbarToggle
          pressed={editor.isActive("bulletList")}
          onPressedChange={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          label={t("richtext.bulletList")}
        >
          <List className="size-4" />
        </ToolbarToggle>
        <ToolbarToggle
          pressed={editor.isActive("orderedList")}
          onPressedChange={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
          label={t("richtext.orderedList")}
        >
          <ListOrdered className="size-4" />
        </ToolbarToggle>
        <ToolbarToggle
          pressed={editor.isActive("blockquote")}
          onPressedChange={() =>
            editor.chain().focus().toggleBlockquote().run()
          }
          label={t("richtext.quote")}
        >
          <Quote className="size-4" />
        </ToolbarToggle>
        <ToolbarToggle
          pressed={editor.isActive("codeBlock")}
          onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
          label={t("richtext.code")}
        >
          <Code className="size-4" />
        </ToolbarToggle>
        <LinkControl editor={editor} />
        <span aria-hidden className="mx-1 h-5 w-px self-center bg-border" />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          aria-label={t("richtext.undo")}
        >
          <Undo2 className="size-4 rtl:-scale-x-100" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          aria-label={t("richtext.redo")}
        >
          <Redo2 className="size-4 rtl:-scale-x-100" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
