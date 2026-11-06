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
    craft?: string;
    city?: string;
    bio?: string;
    image_url?: string;
    price_inr?: number;
    bookable?: boolean;
    slug?: string;
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

export const NEELAM_BLOG: Blog = {
  id: "everything-is-connected-to-your-breath",
  title: "Everything Is Connected to Your Breath",
  slug: "everything-is-connected-to-your-breath",
  category: "Wisdom & Practice",
  author_id: "neelam-chheda",
  practitioner_slug: "neelam-chheda",
  author: {
    id: "neelam-chheda",
    full_name: "Neelam Chheda",
    practitioner_slug: "neelam-chheda",
    avatar_url: "/images/journal/neelam-chheda.jpg",
    craft: "Breathwork Guide",
    city: "Online & In-Person",
    bio: "Neelam Chheda is a breathwork guide who works with all five elements. She guides individuals through transformational breathwork journeys to dissolve emotional blockages and connect with their true being.",
    price_inr: 2500,
    bookable: true,
  },
  excerpt:
    "Neelam Chheda guides breathwork through all five elements. Here she shares how she found it, how the elements show up in the body, and what to expect from your sessions.",
  content: `Neelam Chheda guides breathwork through all five elements. Here she shares how she found it, how the elements show up in the body, and what to expect from your sessions.

## How I found breathwork
When my sister first told me about breathwork, I didn’t take her seriously. I thought it was just a modern name for some pranayam. But once I experienced it myself, there was no looking back.

## Five elements, five energy centres
We are primarily made of five elements, and each element corresponds to one chakra, or energy centre, in our body. Water, for example, corresponds to the Svadisthana chakra, and we are about 70% water.

Water loves to flow. In our being, the water element relates to emotions, creativity, vitality, abundance and more.

## What a session feels like
Experiences vary from person to person. Some people have more physical sensations, while others have more emotional ones. The same person can also have very different experiences in different sessions.

No prior experience is needed. Each time you take a session, your breathing mechanism opens up a little more.

To begin with, we recommend a few sessions at a short interval, such as once a week. Once you start breathing in well, we can space the sessions out. Think of it like being on a dose for something: at first the doses are higher, then we taper them down and keep it on a maintenance basis.

There are also a few practices you can do at home regularly, once they have been taught to you.

## What I wish people understood
Everything, and I mean everything, is connected to our breath.

Have you ever observed how you breathe in different situations? When you are angry, sad, scared, happy, in love? Your breath can tell a lot about your entire life. Working with the breath can align you with your true being and help dissolve what is holding you back.

I believe you can control your entire life if you can manage your own breath.

## About Neelam Chheda
Neelam Chheda is a breathwork guide who works with all five elements. Book a session with Neelam Chheda on Kuśala at kusala.in.

> This article is shared for awareness and is not a substitute for medical advice. If you have a medical condition or are pregnant, please check with your doctor before trying breathwork.`,
  tags: ["Breathwork", "Pranayama", "Holistic Healing", "Five Elements", "Mindfulness"],
  featured_image: "/images/journal/neelam-chheda.jpg",
  status: "published",
  created_at: "2026-11-06T12:00:00.000Z",
  updated_at: "2026-11-06T12:00:00.000Z",
};

export const ANJALI_BLOG: Blog = {
  id: "no-emotion-is-too-small",
  title: "No Emotion Is Too ‘Small’",
  slug: "no-emotion-is-too-small",
  category: "Wisdom & Practice",
  author_id: "anjali-sawlani",
  practitioner_slug: "anjali-sawlani",
  author: {
    id: "anjali-sawlani",
    full_name: "Anjali Sawlani",
    practitioner_slug: "anjali-sawlani",
    avatar_url: "/images/journal/anjali-sawlani.jpg",
    craft: "Emotional Wellbeing & Positive Mindset Counsellor",
    city: "Online & In-Person",
    bio: "Anjali Sawlani is a warm, compassionate Emotional Wellbeing and Positive Mindset Counsellor, offering a safe, non-judgemental space where you feel truly heard and supported. She works with women, single parents and young adults, helping them navigate anxiety, stress, low mood, grief, trauma and life transitions, with an approach that is empathetic, solution-focused and tailored to each person.",
    price_inr: 2500,
    bookable: true,
  },
  excerpt:
    "Anjali works with women, single parents and young adults. Here she shares what drew her to this work, what to expect from a first session, and one simple habit you can try tonight.",
  content: `Anjali works with women, single parents and young adults. Here she shares what drew her to this work, what to expect from a first session, and one simple habit you can try tonight.

## Why I do this work
My own journey drew me to this space. I was diagnosed with anxiety and depression about nine years ago. Seeing a doctor and being on medication wasn’t enough; it had to be a 360-degree approach. I experienced the benefits of therapy and regular sessions, and I began including overall wellbeing practices in my daily life.

I realised how many people must be experiencing the same and feeling extremely lonely in their journey. Many don’t ask for help, either because of the stigma or the cost, and in many cases both. Having the right person listen to you without judgement is key to recovery.

## What a safe space really means
A safe, non-judgemental space is one where a client can have their guard down. Confidentiality, and zero ‘talking at’ or simply offering advice, gives them room to speak freely. Clients should be able to hear their own thoughts in a space where they can speak without bias or judgement.

## Please don’t dismiss your emotions
When I look back, the journey from our twenties has been nothing short of a roller coaster. Life does not come with a manual, and everyone’s journey is unique. Knowing that we will feel heard and supported is actually the most important thing.

No emotion is too ‘small’. As a society, we have been asked to simply carry on and accept a lot of situations and emotions without actually sitting with them. So please, don’t dismiss yours. There is help available, and you do not need to wait for a crisis to reach out to a therapist.

## If you’re unsure about reaching out
That hesitation is absolutely normal. Simply accepting that you need to deal with something, and taking the smallest step, is a big win. I would say acceptance is the prime factor: yes, I do have an issue, and I want to take a step towards making it better. Making peace with it, rather than dismissing it and letting it fester, matters, because it will snowball and show up later.

For a first session, please come with zero expectations, from both yourself and me. Many people come looking for quick-fix solutions. The first session is for me to hear you out and understand a little about your background and history. It is also for you to gauge whether I will be the right fit for you.

## Try this tonight: a 10-minute mind declutter
One simple thing that can help declutter the mind is to sit with a pen and paper, or even digitally, at the end of the day.

1. Write a bit about your day. Even if it is just two lines. Good or bad. Get it out of your head and onto paper, your phone or your laptop, whichever you choose.
2. Make tomorrow’s to-do list. It doesn’t have to be anything big. Simple things like what you might eat for breakfast, what groceries you need to order, the phone call you have to make.
3. Tick them off, one by one. This gives a sense of accomplishment and small wins, and a little structure and meaning to the day.

## Moving forward with clarity
Healing is never a linear path. It takes time, and it does not mean you need to be happy every single day. It means you can now identify your emotions and be in control of your reactions to them. This helps not only your own mind, but also the people around you.

The one small shift would be to not react to everything. Be mindful, and sit with what may have upset or hurt you. Everything does not need solving or reacting to right away.

## About Anjali
Anjali Sawlani is a warm, compassionate Emotional Wellbeing and Positive Mindset Counsellor, offering a safe, non-judgemental space where you feel truly heard and supported. She works with women, single parents and young adults, helping them navigate anxiety, stress, low mood, grief, trauma and life transitions, with an approach that is empathetic, solution-focused and tailored to each person. Book a session with Anjali on Kuśala at kusala.in.

> This article is shared for awareness and is not a substitute for professional care. If you are in crisis, please reach out to a helpline or someone you trust.`,
  tags: ["Emotional Wellbeing", "Mental Health", "Mindfulness", "Anxiety", "Healing"],
  featured_image: "/images/journal/anjali-sawlani.jpg",
  status: "published",
  created_at: "2026-11-05T12:00:00.000Z",
  updated_at: "2026-11-05T12:00:00.000Z",
};

export const STATIC_BLOGS: Blog[] = [NEELAM_BLOG, ANJALI_BLOG];

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

  try {
    const res = await api<BlogsResponse>(`/api/content/blogs${query ? `?${query}` : ""}`);
    const existing = res?.data || [];
    const missingStatic = STATIC_BLOGS.filter(
      (sb) => !existing.some((b) => b.slug === sb.slug || b.id === sb.id)
    );
    const combined = [...missingStatic, ...existing];

    return {
      data: combined,
      pagination: {
        page: res?.pagination?.page || 1,
        limit: res?.pagination?.limit || combined.length,
        total: Math.max(combined.length, res?.pagination?.total || 0),
        totalPages: Math.max(1, Math.ceil(Math.max(combined.length, res?.pagination?.total || 0) / (res?.pagination?.limit || 10))),
      },
    };
  } catch (error) {
    console.warn("Could not fetch remote blogs, falling back to curated journal articles:", error);
    return {
      data: STATIC_BLOGS,
      pagination: {
        page: 1,
        limit: 10,
        total: STATIC_BLOGS.length,
        totalPages: 1,
      },
    };
  }
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
  const staticFound = STATIC_BLOGS.find((b) => b.slug === slug);
  try {
    const res = await api<Blog>(`/api/content/blogs/${slug}`);
    if (res && res.title) return res;
  } catch {
    // Fallback to static
  }
  if (staticFound) return staticFound;
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
