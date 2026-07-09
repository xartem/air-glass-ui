import {
  Ban,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Play,
  Trash2,
} from "lucide-react";
import { Link } from "react-router";

import type { AiBlock, AiBlockButton, AiCardView } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatFileSize } from "@/lib/ai-format";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * Chat blocks (D:ai §4a): the FIXED renderer set for typed agent blocks — free
 * markup from the LLM is impossible by design. A new block type means a row in
 * the D:ai §4a table plus a component here, never inline code. Unknown types
 * from old history are skipped silently (forward-compat).
 */

const BUTTON_VARIANT: Record<
  AiBlockButton["style"],
  "default" | "outline" | "destructive"
> = {
  primary: "default",
  secondary: "outline",
  danger: "destructive",
};

function LinkBlock({ block }: { block: Extract<AiBlock, { type: "link" }> }) {
  const className =
    "inline-flex items-center gap-1 text-sm text-primary hover:underline";
  if (block.route) {
    return (
      <Link to={block.route} className={className}>
        {block.label}
      </Link>
    );
  }
  return (
    <a href={block.url} target="_blank" rel="noopener" className={className}>
      {block.label}
      {/* Foreign domain marker (D:ai §4a) */}
      {block.external ? (
        <ExternalLink aria-hidden className="size-3.5" />
      ) : null}
    </a>
  );
}

function ButtonsBlock({
  block,
  onToolClick,
}: {
  block: Extract<AiBlock, { type: "buttons" }>;
  onToolClick?: (item: AiBlockButton) => void;
}) {
  // ≤4 buttons by contract — extras are dropped, not wrapped (D:ai §4a)
  const items = block.items.slice(0, 4);
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => {
        const variant = BUTTON_VARIANT[item.style];
        if (item.kind === "route" && item.route) {
          return (
            <Button key={index} size="sm" variant={variant} asChild>
              <Link to={item.route}>{item.label}</Link>
            </Button>
          );
        }
        if (item.kind === "url" && item.url) {
          return (
            <Button key={index} size="sm" variant={variant} asChild>
              <a href={item.url} target="_blank" rel="noopener">
                {item.label}
                {item.external ? <ExternalLink aria-hidden /> : null}
              </a>
            </Button>
          );
        }
        // kind=tool runs only on an explicit click; destructive goes through the
        // confirm flow implemented by the chat via onToolClick (D:ai §4a)
        return (
          <Button
            key={index}
            size="sm"
            variant={variant}
            onClick={() => onToolClick?.(item)}
          >
            {item.style === "danger" ? <Trash2 /> : null}
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}

function CardItem({ card }: { card: AiCardView }) {
  if (card.stub) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-dashed bg-background/40 px-3 py-2.5 text-sm text-muted-foreground">
        <Ban className="size-4 shrink-0" />
        {t(
          card.stub === "deleted" ? "ai.blocks.deleted" : "ai.blocks.no_access",
        )}
      </div>
    );
  }
  const body = (
    <>
      {card.preview_url ? (
        <img
          src={card.preview_url}
          alt=""
          className="size-11 shrink-0 rounded-lg border object-cover"
        />
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <ImageIcon className="size-4" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="min-w-0 truncate text-sm font-medium">
            {card.title}
          </span>
          {card.badges?.map((badge) => (
            <Badge key={badge} variant="secondary" className="shrink-0">
              {badge}
            </Badge>
          ))}
        </span>
        {card.subtitle ? (
          <span className="block truncate text-xs text-muted-foreground">
            {card.subtitle}
          </span>
        ) : null}
      </span>
    </>
  );
  return (
    <div className="flex items-center gap-2.5 rounded-xl border bg-background/60 p-2.5">
      {card.route ? (
        <Link
          to={card.route}
          className="flex min-w-0 flex-1 items-center gap-2.5 hover:opacity-80"
        >
          {body}
        </Link>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-2.5">{body}</span>
      )}
      {card.public_url ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("ai.blocks.open_site")}
          asChild
        >
          <a href={card.public_url} target="_blank" rel="noopener">
            <ExternalLink />
          </a>
        </Button>
      ) : null}
    </div>
  );
}

function ImageBlock({ block }: { block: Extract<AiBlock, { type: "image" }> }) {
  // Media-library only (media_id, D:ai §4a) — click leads to the library
  return (
    <Link
      to="/media"
      className="inline-block"
      aria-label={t("ai.blocks.open_media")}
    >
      {block.preview_url ? (
        <img
          src={block.preview_url}
          alt={block.alt ?? ""}
          className="max-h-40 max-w-full rounded-xl border"
        />
      ) : (
        <span className="flex size-24 items-center justify-center rounded-xl border bg-muted text-muted-foreground">
          <ImageIcon className="size-5" />
        </span>
      )}
    </Link>
  );
}

function VideoBlock({ block }: { block: Extract<AiBlock, { type: "video" }> }) {
  return (
    <Link
      to="/media"
      aria-label={t("ai.blocks.open_media")}
      className="relative inline-flex h-28 w-48 items-center justify-center overflow-hidden rounded-xl border bg-muted"
      style={
        block.poster_url
          ? {
              backgroundImage: `url(${block.poster_url})`,
              backgroundSize: "cover",
            }
          : undefined
      }
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-background/80">
        <Play className="size-4" />
      </span>
      {block.label ? (
        <span className="absolute inset-x-0 bottom-0 truncate bg-background/80 px-2 py-1 text-xs">
          {block.label}
        </span>
      ) : null}
    </Link>
  );
}

function FileBlock({ block }: { block: Extract<AiBlock, { type: "file" }> }) {
  return (
    <div className="flex max-w-full items-center gap-2.5 rounded-xl border bg-background/60 p-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <FileText className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {block.label ?? block.name}
        </span>
        <span className="block text-xs text-muted-foreground">
          {block.name} · {formatFileSize(block.size)}
        </span>
      </span>
      <Button variant="outline" size="sm" asChild>
        <Link to="/media">
          <Download />
          {t("ai.blocks.open_media")}
        </Link>
      </Button>
    </div>
  );
}

function TableBlock({ block }: { block: Extract<AiBlock, { type: "table" }> }) {
  // Compact summary caps: ≤5 columns × ≤10 rows (D:ai §4a)
  const columns = block.columns.slice(0, 5);
  return (
    <div className="max-w-full overflow-x-auto rounded-xl border bg-background/60">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column} className="text-xs">
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {block.rows.slice(0, 10).map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.slice(0, columns.length).map((cell, cellIndex) => (
                <TableCell key={cellIndex} className="text-xs">
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ProgressBlock({
  block,
}: {
  block: Extract<AiBlock, { type: "progress" }>;
}) {
  return (
    <div className="w-full max-w-xs space-y-1.5 rounded-xl border bg-background/60 p-2.5">
      <p className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="min-w-0 truncate">{block.label}</span>
        <span className="shrink-0">{block.percent}%</span>
      </p>
      <Progress value={block.percent} />
    </div>
  );
}

export function AiBlockView({
  block,
  className,
  onToolClick,
}: {
  block: AiBlock;
  className?: string;
  onToolClick?: (item: AiBlockButton) => void;
}) {
  const content = (() => {
    switch (block.type) {
      case "link":
        return <LinkBlock block={block} />;
      case "buttons":
        return <ButtonsBlock block={block} onToolClick={onToolClick} />;
      case "card":
        return <CardItem card={block.card} />;
      case "card_list":
        return (
          <div className="space-y-1.5">
            {block.items.slice(0, 10).map((card, index) => (
              <CardItem key={index} card={card} />
            ))}
          </div>
        );
      case "image":
        return <ImageBlock block={block} />;
      case "video":
        return <VideoBlock block={block} />;
      case "file":
        return <FileBlock block={block} />;
      case "table":
        return <TableBlock block={block} />;
      case "progress":
        return <ProgressBlock block={block} />;
      default:
        return null; // unknown type in old history — skipped silently (D:ai §4a)
    }
  })();
  if (!content) return null;
  return <div className={cn("max-w-[85%]", className)}>{content}</div>;
}
