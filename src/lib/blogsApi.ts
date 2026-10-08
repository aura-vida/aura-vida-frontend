import { api } from "@/lib/api";

export interface Blog {
  id: string;
  author_id?: string | null;
  practitioner_slug?: string | null;
  author?: {
    id: string;
    full_name?: string;
    practitioner_slug?: string;
    avatar_url?: string;
  } | null;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  category?: string | null;
  tags?: string[];
  featured_image?: string | null;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

export interface BlogsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BlogsResponse {
  data: Blog[];
  pagination: BlogsPagination;
}

export async function listPublishedBlogs(params?: {
  author_id?: string;
  practitioner_slug?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<BlogsResponse> {
  const qs = new URLSearchParams();
  if (params?.author_id) qs.append("author_id", params.author_id);
  if (params?.practitioner_slug) qs.append("practitioner_slug", params.practitioner_slug);
  if (params?.category) qs.append("category", params.category);
  if (params?.page) qs.append("page", String(params.page));
  if (params?.limit) qs.append("limit", String(params.limit));
  const query = qs.toString();
  return api<BlogsResponse>(`/api/content/blogs${query ? `?${query}` : ""}`);
}

export async function listMyBlogs(params?: {
  page?: number;
  limit?: number;
}): Promise<BlogsResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.append("page", String(params.page));
  if (params?.limit) qs.append("limit", String(params.limit));
  const query = qs.toString();
  return api<BlogsResponse>(`/api/content/blogs/my${query ? `?${query}` : ""}`);
}

export async function getBlogBySlug(slug: string): Promise<Blog> {
  return api<Blog>(`/api/content/blogs/${slug}`);
}

export async function createBlog(payload: {
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  slug?: string;
  status?: "draft" | "published";
  featured_image?: string;
}): Promise<Blog> {
  return api<Blog>("/api/content/blogs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });
}

export async function updateBlog(
  id: string,
  payload: Partial<Blog>
): Promise<Blog> {
  return api<Blog>(`/api/content/blogs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });
}

export async function deleteBlog(id: string): Promise<{ message: string }> {
  return api<{ message: string }>(`/api/content/blogs/${id}`, {
    method: "DELETE",
  });
}
