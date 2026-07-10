import { ImageIcon } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Media showcase (W5): the "media object" pattern — an avatar or thumbnail
 * pinned to the start with a flexible title + text body. Static docs demo.
 */
export function MediaPage() {
  useLocale();

  const people = [
    { name: "Ava Thompson", initials: "AT", role: t("showcase.base.media.role1") },
    { name: "Liam Carter", initials: "LC", role: t("showcase.base.media.role2") },
    { name: "Noah Bennett", initials: "NB", role: t("showcase.base.media.role3") },
  ];

  return (
    <ShowcasePage
      title={t("showcase.base.media.title")}
      description={t("showcase.base.media.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.s.default")}
        notes={t("showcase.base.media.note")}
        previewClassName="block"
        code={`<div className="flex items-start gap-3">
  <Avatar>
    <AvatarFallback>AT</AvatarFallback>
  </Avatar>
  <div className="min-w-0">
    <p className="text-sm font-medium">Ava Thompson</p>
    <p className="text-sm text-muted-foreground">
      Commented on your recent update a few minutes ago.
    </p>
  </div>
</div>`}
      >
        <div className="flex w-full max-w-md items-start gap-3">
          <Avatar>
            <AvatarFallback>AT</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium">Ava Thompson</p>
            <p className="text-sm text-muted-foreground">
              {t("showcase.base.media.text")}
            </p>
          </div>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.media.list")}
        previewClassName="block"
        code={`<ul className="divide-y divide-border">
  {people.map((p) => (
    <li key={p.name} className="flex items-center gap-3 py-3">
      <Avatar>
        <AvatarFallback>{p.initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-sm font-medium">{p.name}</p>
        <p className="text-sm text-muted-foreground">{p.role}</p>
      </div>
    </li>
  ))}
</ul>`}
      >
        <ul className="w-full max-w-md divide-y divide-border">
          {people.map((person) => (
            <li key={person.name} className="flex items-center gap-3 py-3">
              <Avatar>
                <AvatarFallback>{person.initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{person.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {person.role}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.media.thumbnail")}
        previewClassName="block"
        code={`<div className="flex items-start gap-3">
  <div className="flex size-16 items-center justify-center rounded-lg bg-muted text-muted-foreground">
    <ImageIcon />
  </div>
  <div className="min-w-0">
    <p className="text-sm font-medium">Ava Thompson</p>
    <p className="text-sm text-muted-foreground">
      Uploaded 12 new assets to the shared library.
    </p>
  </div>
</div>`}
      >
        <div className="flex w-full max-w-md items-start gap-3">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ImageIcon className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">Ava Thompson</p>
            <p className="text-sm text-muted-foreground">
              {t("showcase.base.media.caption")}
            </p>
          </div>
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
