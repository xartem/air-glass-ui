import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, ShieldOff, UserCog } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { api, ValidationError, type UserPayload } from "@/api";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EditorLayout } from "@/components/editor-layout";
import { FormField } from "@/components/form-field";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ADMIN_LOCALES, LOCALE_NAMES, t } from "@/lib/i18n";
import { generatePassword } from "@/lib/password";
import { roleDisplayName } from "@/lib/role-label";

/*
 * /users/new · /users/{id} (UI:users-roles §2): the user editor. Fields are
 * plain controlled inputs (settings-group-form pattern) with per-field 422
 * mapping. On create, a generated password is shown in clear text (no email
 * channel). Editing yourself locks role + active (D:users §4), and the sole
 * admin cannot be demoted — both are also server-enforced.
 */

interface FormState {
  name: string;
  email: string;
  role_id: number | null;
  ui_locale: string;
  is_active: boolean;
  password: string;
}

export function UserEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  const userId = id ? Number(id) : undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: api.roles.all,
    staleTime: 30_000,
  });
  const userQuery = useQuery({
    queryKey: ["users", "detail", userId],
    queryFn: () => api.users.get(userId!),
    enabled: !isNew,
  });

  const initial = useMemo<FormState>(() => {
    if (isNew)
      return {
        name: "",
        email: "",
        role_id: null,
        ui_locale: "ru",
        is_active: true,
        password: "",
      };
    const detail = userQuery.data;
    return {
      name: detail?.name ?? "",
      email: detail?.email ?? "",
      role_id: detail?.role_id ?? null,
      ui_locale: detail?.ui_locale ?? "ru",
      is_active: detail?.is_active ?? true,
      password: "",
    };
  }, [isNew, userQuery.data]);

  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mfaResetOpen, setMfaResetOpen] = useState(false);

  // Seed local form once server data is available; edits override it thereafter.
  const values = form ?? initial;
  const isSelf = userQuery.data?.is_self ?? false;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...(current ?? initial), [key]: value }));
  }

  const dirty =
    form !== null && JSON.stringify(form) !== JSON.stringify(initial);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: UserPayload = {
        name: values.name,
        email: values.email,
        role_id: values.role_id ?? 0,
        ui_locale: values.ui_locale,
        is_active: values.is_active,
      };
      if (isNew) payload.password = values.password;
      return isNew
        ? api.users.create(payload)
        : api.users.update(userId!, payload);
    },
    onSuccess: async (detail) => {
      setErrors({});
      setForm(null);
      toast.success(t("users.saved"));
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      if (isNew) navigate(`/users/${detail.id}`);
    },
    onError: (cause) => {
      if (cause instanceof ValidationError) {
        setErrors(
          Object.fromEntries(
            Object.entries(cause.fields).map(([key, code]) => [
              key,
              t(`users.error.${code}`),
            ]),
          ),
        );
      } else {
        toast.error(t("common.request_failed"));
      }
    },
  });

  const mfaResetMutation = useMutation({
    mutationFn: () => api.users.resetMfa(userId!),
    onSuccess: async () => {
      toast.success(t("users.mfa_reset.done"));
      await queryClient.invalidateQueries({
        queryKey: ["users", "detail", userId],
      });
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const loading = !isNew && userQuery.isPending;
  const title = isNew ? t("users.new_title") : values.name || t("nav.users");

  const formBody = loading ? (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  ) : (
    <Panel icon={UserCog} title={t("users.section.main")}>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          name="name"
          label={t("users.field.name")}
          required
          error={errors.name}
          className="md:col-span-2"
        >
          <Input
            id="name"
            value={values.name}
            onChange={(event) => set("name", event.target.value)}
          />
        </FormField>
        <FormField
          name="email"
          label={t("users.field.email")}
          required
          error={errors.email}
          className="md:col-span-2"
        >
          <Input
            id="email"
            type="email"
            value={values.email}
            onChange={(event) => set("email", event.target.value)}
          />
        </FormField>

        <FormField
          name="role_id"
          label={t("users.field.role")}
          required
          error={errors.role_id}
        >
          <SelfLockTooltip locked={isSelf}>
            <Select
              value={values.role_id ? String(values.role_id) : ""}
              disabled={isSelf}
              onValueChange={(value) => set("role_id", Number(value))}
            >
              <SelectTrigger id="role_id" className="w-full">
                <SelectValue placeholder={t("users.field.role_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {(rolesQuery.data ?? []).map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {roleDisplayName(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SelfLockTooltip>
        </FormField>

        <FormField name="ui_locale" label={t("users.field.ui_locale")}>
          <Select
            value={values.ui_locale}
            onValueChange={(value) => set("ui_locale", value)}
          >
            <SelectTrigger id="ui_locale" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ADMIN_LOCALES.map((code) => (
                <SelectItem key={code} value={code}>
                  {LOCALE_NAMES[code]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {isNew ? (
          <FormField
            name="password"
            label={t("users.field.password")}
            required
            error={errors.password}
            className="md:col-span-2"
          >
            <div className="flex items-center gap-2">
              <Input
                id="password"
                value={values.password}
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
                onChange={(event) => set("password", event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => set("password", generatePassword())}
              >
                <RefreshCw />
                {t("users.password.generate")}
              </Button>
            </div>
          </FormField>
        ) : (
          <FormField
            name="is_active"
            label={t("users.field.active")}
            className="md:col-span-2"
          >
            <SelfLockTooltip locked={isSelf}>
              <Switch
                id="is_active"
                checked={values.is_active}
                disabled={isSelf}
                onCheckedChange={(checked) =>
                  set("is_active", checked === true)
                }
              />
            </SelfLockTooltip>
          </FormField>
        )}
      </div>
    </Panel>
  );

  // Lost 2FA device: users.manage resets the target's 2FA from the card (D:auth §6)
  const securityBody =
    !isNew && !loading && userQuery.data?.mfa_enabled && !isSelf ? (
      <Panel
        icon={ShieldOff}
        title={t("users.mfa_reset.section")}
        description={t("users.mfa_reset.hint")}
      >
        <Button
          type="button"
          variant="outline"
          onClick={() => setMfaResetOpen(true)}
        >
          <ShieldOff className="size-4" />
          {t("users.mfa_reset.action")}
        </Button>
      </Panel>
    ) : null;

  return (
    <>
      <EditorLayout
        back={{ href: "/users" }}
        title={title}
        dirty={dirty}
        primaryAction={{
          label: t("common.save"),
          onClick: () => saveMutation.mutate(),
          disabled: saveMutation.isPending || !dirty,
        }}
        tabs={[
          {
            key: "main",
            label: t("users.section.main"),
            content: (
              <div className="space-y-4">
                {formBody}
                {securityBody}
              </div>
            ),
          },
        ]}
      />
      <ConfirmDialog
        open={mfaResetOpen}
        onOpenChange={setMfaResetOpen}
        title={t("users.mfa_reset.title", { name: values.name })}
        description={t("users.mfa_reset.description")}
        confirmLabel={t("users.mfa_reset.action")}
        destructive
        onConfirm={() => {
          mfaResetMutation.mutate();
          setMfaResetOpen(false);
        }}
      />
    </>
  );
}

/** Wraps a locked control so hovering explains why role/active are disabled on self. */
function SelfLockTooltip({
  locked,
  children,
}: {
  locked: boolean;
  children: ReactNode;
}) {
  if (!locked) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent>{t("users.self_locked")}</TooltipContent>
    </Tooltip>
  );
}
