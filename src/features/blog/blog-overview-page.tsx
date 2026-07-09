import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { devDebug } from "@/lib/debug";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Send } from "lucide-react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { api, ApiError, type BlogListItem, type BlogPost } from "@/api";
import { ErrorPage } from "@/components/error-page";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /blog/:id: the full article — hero, body, tags, author box, related posts and
 * a comments thread with an inline comment form (optimistic append on submit).
 * A missing id renders the shared 404 error page.
 */

const commentSchema = z.object({ body: z.string().min(3, "required") });
type CommentValues = z.infer<typeof commentSchema>;

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function RelatedCard({ post }: { post: BlogListItem }) {
  return (
    <Link
      to={`/blog/${post.id}`}
      className="glass-card overflow-hidden rounded-xl transition-transform hover:-translate-y-0.5"
    >
      <div
        aria-hidden
        className="h-24 w-full"
        style={{
          backgroundImage: `linear-gradient(135deg, ${post.coverColor}, ${post.coverColor}99)`,
        }}
      />
      <p className="line-clamp-2 p-3 text-sm font-medium">{post.title}</p>
    </Link>
  );
}

function CommentForm({ postId }: { postId: number }) {
  const queryClient = useQueryClient();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { body: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: CommentValues) =>
      api.blog.comment(postId, values.body.trim()),
    onSuccess: (comment) => {
      devDebug("[BlogOverviewPage] comment added");
      queryClient.setQueryData<BlogPost>(["blog", "post", postId], (prev) =>
        prev ? { ...prev, comments: [...prev.comments, comment] } : prev,
      );
      toast.success(t("blog.post.commentAdded"));
      reset();
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="space-y-2"
    >
      <Controller
        control={control}
        name="body"
        render={({ field }) => (
          <Textarea
            {...field}
            rows={3}
            placeholder={t("blog.post.commentPlaceholder")}
            aria-label={t("blog.post.commentPlaceholder")}
            aria-invalid={errors.body ? true : undefined}
          />
        )}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : <Send className="size-4" />}
          {t("blog.post.commentSubmit")}
        </Button>
      </div>
    </form>
  );
}

export function BlogOverviewPage() {
  useLocale();
  const { id } = useParams();
  const postId = Number(id);

  const query = useQuery({
    queryKey: ["blog", "post", postId],
    queryFn: () => api.blog.get(postId),
    retry: (count, error) =>
      !(error instanceof ApiError && error.status === 404) && count < 2,
  });
  devDebug("[BlogOverviewPage] load", { id: postId });

  if (
    query.isError &&
    query.error instanceof ApiError &&
    query.error.status === 404
  ) {
    return <ErrorPage code="404" />;
  }

  const post = query.data;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title={post?.title ?? t("blog.title")}
        breadcrumbs={[
          { label: t("blog.title"), href: "/blog/list" },
          { label: post?.title ?? "…" },
        ]}
        secondaryActions={[
          {
            label: t("common.back"),
            href: "/blog/list",
            icon: <ArrowLeft className="size-4" />,
          },
        ]}
      />

      {query.isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : query.isError || !post ? (
        <Panel>
          <p className="text-sm text-muted-foreground">
            {t("table.error.description")}
          </p>
        </Panel>
      ) : (
        <>
          <article className="glass-card overflow-hidden rounded-2xl">
            <div
              aria-hidden
              className="h-56 w-full"
              style={{
                backgroundImage: `linear-gradient(135deg, ${post.coverColor}, ${post.coverColor}99)`,
              }}
            />
            <div className="space-y-4 p-5">
              <Badge variant="secondary">
                {t(`blog.category.${post.category}`)}
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight">
                {post.title}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Avatar size="sm">
                  <AvatarFallback>
                    {initialsOf(post.author.name)}
                  </AvatarFallback>
                </Avatar>
                <span>{post.author.name}</span>
                <span aria-hidden>·</span>
                <span>{post.date.slice(0, 10)}</span>
                <span aria-hidden>·</span>
                <span>{t("blog.readTime", { minutes: post.readMinutes })}</span>
              </div>
              <div className="space-y-4 pt-2">
                {post.body.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-sm leading-relaxed text-foreground/90"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </article>

          {post.related.length > 0 ? (
            <Panel title={t("blog.post.related")}>
              <div className="grid gap-4 sm:grid-cols-3">
                {post.related.map((related) => (
                  <RelatedCard key={related.id} post={related} />
                ))}
              </div>
            </Panel>
          ) : null}

          <Panel
            title={t("blog.post.comments", { count: post.comments.length })}
          >
            <div className="space-y-4">
              {post.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("blog.post.noComments")}
                </p>
              ) : (
                <ul className="space-y-4">
                  {post.comments.map((comment) => (
                    <li key={comment.id} className="flex gap-3">
                      <Avatar size="sm">
                        <AvatarFallback>{comment.initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {comment.author}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {comment.date.slice(0, 10)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {comment.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <CommentForm postId={postId} />
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
