import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, Plus, Sparkles, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { api, type NftChain, type NftCategory } from "@/api";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-field";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumber } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

import { NFT_CATEGORIES, NFT_CHAINS } from "./nft-shared";
import { devDebug } from "@/lib/debug";

/*
 * /nft/create — mint form (demo): art upload with live preview, metadata, price,
 * royalties and a properties repeater, mirrored by a live preview card.
 * Reachable with nft.manage.
 */

const schema = z.object({
  name: z.string().min(1, "required"),
  description: z.string(),
  collection_id: z.number().int().positive("required"),
  price: z.number().positive("invalid"),
  royalties: z.number().min(0).max(20),
  chain: z.enum(["ethereum", "polygon", "solana", "binance"]),
  category: z.enum([
    "art",
    "collectibles",
    "music",
    "photography",
    "gaming",
    "sports",
  ]),
  properties: z.array(z.object({ type: z.string(), value: z.string() })),
});
type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = {
  name: "",
  description: "",
  collection_id: 0,
  price: 1,
  royalties: 5,
  chain: "ethereum",
  category: "art",
  properties: [{ type: "", value: "" }],
};

export function NftCreatePage() {
  const locale = useLocale();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [art, setArt] = useState<{ name: string; preview: string } | null>(
    null,
  );
  const [artError, setArtError] = useState(false);

  const collectionsQuery = useQuery({
    queryKey: ["nft", "collections", "options"],
    queryFn: () => api.nft.collections({ sort: "name" }),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
    mode: "onChange",
  });
  const { register, control, handleSubmit, watch, setValue, formState } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "properties",
  });
  const values = watch();

  const mintMutation = useMutation({
    mutationFn: (payload: FormValues) => {
      devDebug("[NftCreate] mint", { name: payload.name });
      return api.nft.create({
        name: payload.name,
        description: payload.description,
        collection_id: payload.collection_id,
        price: payload.price,
        royalties: payload.royalties,
        chain: payload.chain,
        category: payload.category,
        properties: payload.properties.filter(
          (property) => property.type && property.value,
        ),
        art: art?.name ?? "",
      });
    },
    onSuccess: (result) => {
      toast.success(t("nft.create.minted", { name: result.name }));
      navigate("/nft/marketplace");
    },
    onError: () => toast.error(t("nft.create.mint_failed")),
  });

  function onSubmit(formValues: FormValues) {
    if (!art) {
      setArtError(true);
      return;
    }
    mintMutation.mutate(formValues);
  }

  function onPickFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setArt({ name: file.name, preview: String(reader.result) });
      setArtError(false);
    };
    reader.readAsDataURL(file);
  }

  const collections = collectionsQuery.data ?? [];
  const selectedCollection = collections.find(
    (collection) => collection.id === values.collection_id,
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("nft.create.title")}
        icon={Sparkles}
        primaryAction={{
          label: t("nft.create.mint"),
          onClick: () => void handleSubmit(onSubmit)(),
          disabled: mintMutation.isPending,
        }}
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Panel title={t("nft.create.artwork")}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-input px-4 py-10 text-center text-sm text-muted-foreground transition-colors hover:bg-accent/40"
            >
              <ImagePlus className="size-6" />
              <span className="truncate">
                {art ? art.name : t("nft.create.upload_hint")}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label={t("nft.create.artwork")}
              onChange={(event) => onPickFile(event.target.files?.[0])}
            />
            {artError ? (
              <p className="mt-2 text-sm text-destructive">
                {t("nft.create.error.art")}
              </p>
            ) : null}
          </Panel>

          <Panel title={t("nft.create.details")}>
            <div className="grid gap-4">
              <FormField
                name="name"
                label={t("nft.create.field.name")}
                required
                error={formState.errors.name && t("nft.create.error.required")}
              >
                <Input id="name" {...register("name")} />
              </FormField>
              <FormField
                name="description"
                label={t("nft.create.field.description")}
              >
                <Textarea
                  id="description"
                  rows={3}
                  {...register("description")}
                />
              </FormField>
              <FormField
                name="collection_id"
                label={t("nft.create.field.collection")}
                required
                error={
                  formState.errors.collection_id &&
                  t("nft.create.error.required")
                }
              >
                <Select
                  value={
                    values.collection_id ? String(values.collection_id) : ""
                  }
                  onValueChange={(value) =>
                    setValue("collection_id", Number(value), {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="collection_id" className="w-full">
                    <SelectValue
                      placeholder={t("nft.create.select_collection")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((collection) => (
                      <SelectItem
                        key={collection.id}
                        value={String(collection.id)}
                      >
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  name="price"
                  label={t("nft.create.field.price")}
                  required
                  error={formState.errors.price && t("nft.create.error.price")}
                >
                  <Controller
                    control={control}
                    name="price"
                    render={({ field }) => (
                      <NumberField
                        value={field.value}
                        min={0}
                        step={0.05}
                        onValueChange={(value) => field.onChange(value ?? 0)}
                      />
                    )}
                  />
                </FormField>
                <FormField
                  name="royalties"
                  label={t("nft.create.field.royalties")}
                >
                  <Controller
                    control={control}
                    name="royalties"
                    render={({ field }) => (
                      <NumberField
                        value={field.value}
                        min={0}
                        max={20}
                        step={0.5}
                        onValueChange={(value) => field.onChange(value ?? 0)}
                      />
                    )}
                  />
                </FormField>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField name="chain" label={t("nft.create.field.chain")}>
                  <Select
                    value={values.chain}
                    onValueChange={(value) =>
                      setValue("chain", value as NftChain)
                    }
                  >
                    <SelectTrigger id="chain" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NFT_CHAINS.map((chain) => (
                        <SelectItem key={chain} value={chain}>
                          {t(`nft.chain.${chain}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField
                  name="category"
                  label={t("nft.create.field.category")}
                >
                  <Select
                    value={values.category}
                    onValueChange={(value) =>
                      setValue("category", value as NftCategory)
                    }
                  >
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NFT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {t(`nft.category.${category}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </div>
          </Panel>

          <Panel
            title={t("nft.create.properties")}
            description={t("nft.create.properties_hint")}
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => append({ type: "", value: "" })}
              >
                <Plus />
                {t("nft.create.add_property")}
              </Button>
            }
          >
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-[1fr_1fr_auto] items-center gap-2"
                >
                  <Input
                    aria-label={t("nft.create.property_type")}
                    placeholder={t("nft.create.property_type")}
                    {...register(`properties.${index}.type`)}
                  />
                  <Input
                    aria-label={t("nft.create.property_value")}
                    placeholder={t("nft.create.property_value")}
                    {...register(`properties.${index}.value`)}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("common.delete")}
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel
          title={t("nft.create.preview")}
          className="lg:sticky lg:top-4"
          contentClassName="p-4"
        >
          <div className="glass-card mx-auto flex max-w-xs flex-col overflow-hidden rounded-2xl">
            <div className="flex aspect-square items-center justify-center overflow-hidden bg-muted/50">
              {art ? (
                <img
                  src={art.preview}
                  alt={values.name || t("nft.create.preview")}
                  className="size-full object-cover"
                />
              ) : (
                <ImagePlus className="size-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2 p-4">
              <div className="font-medium">
                {values.name || t("nft.create.untitled")}
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedCollection?.name ?? t("nft.create.no_collection")}
              </div>
              <div className="flex items-end justify-between pt-1">
                <div>
                  <div className="text-[11px] uppercase text-muted-foreground">
                    {t("nft.marketplace.price")}
                  </div>
                  <div className="font-semibold tabular-nums">
                    {formatNumber(values.price || 0, locale)} ETH
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("nft.create.royalties_short", {
                    pct: values.royalties || 0,
                  })}
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
