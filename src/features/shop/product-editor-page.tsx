import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

import { api, type ProductPayload } from '@/api'
import { EditorLayout } from '@/components/editor-layout'
import { FormField } from '@/components/form-field'
import { Panel } from '@/components/panel'
import { MediaPicker, type MediaPage } from '@/components/media-picker'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { t } from '@/lib/i18n'

/*
 * /shop/products/new · /shop/products/{id} (build-demo-screen-catalog): product
 * editor built on react-hook-form + Zod. Sections (general / pricing / inventory /
 * media) live in EditorLayout tabs with the sticky save bar; validation errors
 * surface per field via FormField. Saves through the mock catalog API.
 */

const schema = z.object({
  name: z.string().min(1, 'required'),
  sku: z.string().min(1, 'required'),
  description: z.string(),
  category: z.string(),
  status: z.enum(['active', 'draft', 'archived']),
  price: z.number().min(0),
  compare_at_price: z.number().min(0).nullable(),
  cost: z.number().min(0),
  stock: z.number().int().min(0),
  weight: z.number().min(0),
  image: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const DEFAULTS: FormValues = {
  name: '',
  sku: '',
  description: '',
  category: '',
  status: 'draft',
  price: 0,
  compare_at_price: null,
  cost: 0,
  stock: 0,
  weight: 0,
  image: undefined,
}

const STATUSES = ['active', 'draft', 'archived'] as const

function loadMedia(query: string, page: number): Promise<MediaPage> {
  return api.media.list(query, page).then((res) => ({
    items: res.rows.map((m) => ({
      path: m.path,
      name: m.name,
      previewUrl: m.preview_url,
    })),
    pagination: {
      page: res.page,
      pages: Math.max(1, Math.ceil(res.total / res.per_page)),
      total: res.total,
      perPage: res.per_page,
    },
  }))
}

export function ProductEditorPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const productId = isNew ? undefined : Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const productQuery = useQuery({
    queryKey: ['shop', 'products', 'detail', productId],
    queryFn: () => api.products.get(productId!),
    enabled: !isNew,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  })
  const { register, control, handleSubmit, reset, setValue, watch, formState } = form

  useEffect(() => {
    if (productQuery.data) {
      const p = productQuery.data
      reset({
        name: p.name,
        sku: p.sku,
        description: p.description,
        category: p.category,
        status: p.status,
        price: p.price,
        compare_at_price: p.compare_at_price,
        cost: p.cost,
        stock: p.stock,
        weight: p.weight,
        image: p.image,
      })
    }
  }, [productQuery.data, reset])

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: ProductPayload = { ...values }
      console.debug('[ProductEditorPage] save', { id: productId, payload })
      return isNew ? api.products.create(payload) : api.products.update(productId!, payload)
    },
    onSuccess: (product) => {
      console.debug('[ProductEditorPage] saved', { id: product.id })
      toast.success(t('shop.products.saved'))
      void queryClient.invalidateQueries({ queryKey: ['shop', 'products'] })
      navigate('/shop/products')
    },
    onError: () => toast.error(t('common.request_failed')),
  })

  function onSubmit(values: FormValues) {
    console.debug('[ProductEditorPage] submit valid', { id: productId })
    saveMutation.mutate(values)
  }

  const errors = formState.errors
  const image = watch('image')
  const status = watch('status')

  const generalTab = (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        name="name"
        label={t('shop.products.field.name')}
        required
        error={errors.name && t('shop.products.error.required')}
      >
        <Input id="name" {...register('name')} />
      </FormField>
      <FormField
        name="sku"
        label={t('shop.products.field.sku')}
        required
        error={errors.sku && t('shop.products.error.required')}
      >
        <Input id="sku" {...register('sku')} />
      </FormField>
      <FormField name="category" label={t('shop.products.field.category')} className="sm:col-span-2">
        <Input id="category" {...register('category')} />
      </FormField>
      <FormField name="description" label={t('shop.products.field.description')} className="sm:col-span-2">
        <Textarea id="description" rows={4} {...register('description')} />
      </FormField>
      <FormField name="status" label={t('shop.products.field.status')}>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`shop.products.status.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>
    </div>
  )

  const pricingTab = (
    <div className="grid gap-4 sm:grid-cols-3">
      <FormField name="price" label={t('shop.products.field.price')}>
        <Input id="price" type="number" step="0.01" min="0" {...register('price', { valueAsNumber: true })} />
      </FormField>
      <FormField
        name="compare_at_price"
        label={t('shop.products.field.compare_at_price')}
        help={t('shop.products.field.compare_help')}
      >
        <Input
          id="compare_at_price"
          type="number"
          step="0.01"
          min="0"
          {...register('compare_at_price', {
            setValueAs: (value) => (value === '' || value === null ? null : Number(value)),
          })}
        />
      </FormField>
      <FormField name="cost" label={t('shop.products.field.cost')}>
        <Input id="cost" type="number" step="0.01" min="0" {...register('cost', { valueAsNumber: true })} />
      </FormField>
    </div>
  )

  const inventoryTab = (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField name="stock" label={t('shop.products.field.stock')}>
        <Input id="stock" type="number" step="1" min="0" {...register('stock', { valueAsNumber: true })} />
      </FormField>
      <FormField name="weight" label={t('shop.products.field.weight')}>
        <Input id="weight" type="number" step="0.1" min="0" {...register('weight', { valueAsNumber: true })} />
      </FormField>
    </div>
  )

  const mediaTab = (
    <FormField name="image" label={t('shop.products.field.image')}>
      <MediaPicker
        value={image ? [image] : []}
        onChange={(paths) => setValue('image', paths[0], { shouldDirty: true })}
        loadMedia={loadMedia}
        resolveUrl={(path) => (path.startsWith('data:') || path.startsWith('http') ? path : undefined)}
      />
    </FormField>
  )

  return (
    <EditorLayout
      back={{ href: '/shop/products' }}
      title={isNew ? t('shop.products.new') : (productQuery.data?.name ?? t('common.edit'))}
      status={status === 'active' ? 'success' : status === 'archived' ? 'archived' : 'pending'}
      dirty={formState.isDirty}
      primaryAction={{
        label: t('common.save'),
        onClick: handleSubmit(onSubmit),
        disabled: saveMutation.isPending,
      }}
      tabs={[
        {
          key: 'general',
          label: t('shop.products.tab.general'),
          content: <Panel>{generalTab}</Panel>,
        },
        {
          key: 'pricing',
          label: t('shop.products.tab.pricing'),
          content: <Panel>{pricingTab}</Panel>,
        },
        {
          key: 'inventory',
          label: t('shop.products.tab.inventory'),
          content: <Panel>{inventoryTab}</Panel>,
        },
        {
          key: 'media',
          label: t('shop.products.tab.media'),
          content: <Panel>{mediaTab}</Panel>,
        },
      ]}
    />
  )
}
