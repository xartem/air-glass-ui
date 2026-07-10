import { PanelRight } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Offcanvas showcase (W5): Sheet slide-overs anchored to each edge plus a vaul
 * Drawer, each opened from a trigger button. Static docs demo — no data flow.
 */
export function OffcanvasPage() {
  useLocale();

  const sides = [
    { side: "left" as const, label: t("showcase.base.offcanvas.left") },
    { side: "right" as const, label: t("showcase.base.offcanvas.right") },
    { side: "top" as const, label: t("showcase.base.offcanvas.top") },
    { side: "bottom" as const, label: t("showcase.base.offcanvas.bottom") },
  ];

  return (
    <ShowcasePage
      title={t("showcase.base.offcanvas.title")}
      description={t("showcase.base.offcanvas.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.base.offcanvas.sides")}
        notes={t("showcase.base.offcanvas.note")}
        code={`<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Left</Button>
  </SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Panel title</SheetTitle>
      <SheetDescription>Secondary content.</SheetDescription>
    </SheetHeader>
  </SheetContent>
</Sheet>`}
      >
        {sides.map(({ side, label }) => (
          <Sheet key={side}>
            <SheetTrigger asChild>
              <Button variant="outline">{label}</Button>
            </SheetTrigger>
            <SheetContent side={side}>
              <SheetHeader>
                <SheetTitle>
                  {t("showcase.base.offcanvas.panelTitle")}
                </SheetTitle>
                <SheetDescription>
                  {t("showcase.base.offcanvas.panelDesc")}
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        ))}
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.offcanvas.sheet")}
        code={`<Sheet>
  <SheetTrigger asChild>
    <Button>Open sheet</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Panel title</SheetTitle>
      <SheetDescription>Secondary content.</SheetDescription>
    </SheetHeader>
    <SheetFooter>
      <Button>Save</Button>
      <SheetClose asChild>
        <Button variant="outline">Close</Button>
      </SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>`}
      >
        <Sheet>
          <SheetTrigger asChild>
            <Button>
              <PanelRight className="rtl:-scale-x-100" />
              {t("showcase.base.offcanvas.openSheet")}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{t("showcase.base.offcanvas.panelTitle")}</SheetTitle>
              <SheetDescription>
                {t("showcase.base.offcanvas.panelDesc")}
              </SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <Button>{t("showcase.base.offcanvas.save")}</Button>
              <SheetClose asChild>
                <Button variant="outline">
                  {t("showcase.base.offcanvas.close")}
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.offcanvas.drawer")}
        code={`<Drawer>
  <DrawerTrigger asChild>
    <Button variant="outline">Open drawer</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Panel title</DrawerTitle>
      <DrawerDescription>Secondary content.</DrawerDescription>
    </DrawerHeader>
    <DrawerFooter>
      <Button>Save</Button>
      <DrawerClose asChild>
        <Button variant="outline">Close</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`}
      >
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">
              {t("showcase.base.offcanvas.openDrawer")}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>
                {t("showcase.base.offcanvas.panelTitle")}
              </DrawerTitle>
              <DrawerDescription>
                {t("showcase.base.offcanvas.panelDesc")}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button>{t("showcase.base.offcanvas.save")}</Button>
              <DrawerClose asChild>
                <Button variant="outline">
                  {t("showcase.base.offcanvas.close")}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </ComponentDemo>
    </ShowcasePage>
  );
}
