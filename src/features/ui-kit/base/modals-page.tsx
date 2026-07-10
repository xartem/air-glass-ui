import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Modals showcase (W5): the low-level Dialog primitive, the shared Modal shell,
 * and the ConfirmDialog for destructive actions. Trigger buttons open each one;
 * the confirm handler is a no-op here (static docs — no data flow).
 */
export function ModalsPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.base.modals.title")}
      description={t("showcase.base.modals.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.base.modals.dialog")}
        notes={t("showcase.base.modals.note")}
        code={`<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Share document</DialogTitle>
      <DialogDescription>Anyone with the link can view.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
      <Button>Copy link</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`}
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share document</DialogTitle>
              <DialogDescription>
                Anyone with the link can view this document.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button>Copy link</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.modals.modal")}
        code={`<Modal
  trigger={<Button>Edit profile</Button>}
  title="Edit profile"
  description="Update your account details."
  footer={
    <>
      <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
      <Button>Save changes</Button>
    </>
  }
>
  …
</Modal>`}
      >
        <Modal
          trigger={<Button>Edit profile</Button>}
          title="Edit profile"
          description="Update your account details below."
          footer={
            <>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button>Save changes</Button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">
            The Modal shell keeps every dialog structurally identical: title,
            body, then actions aligned to the bottom-right.
          </p>
        </Modal>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.modals.confirm")}
        code={`<ConfirmDialog
  trigger={<Button variant="destructive-filled">Delete project</Button>}
  title="Delete project?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  destructive
  onConfirm={handleDelete}
/>`}
      >
        <ConfirmDialog
          trigger={<Button variant="destructive-filled">Delete project</Button>}
          title="Delete project?"
          description="This permanently removes the project and all of its data. This action cannot be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={() => {}}
        />
      </ComponentDemo>
    </ShowcasePage>
  );
}
