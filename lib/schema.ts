import { z } from "zod";

export const ACCENTS = ["signal", "ultraviolet", "amber", "mint", "rose", "ice"] as const;
export const SECTION_IDS = [
  "hero", "tryPolyo", "featured", "projects", "shipped", "experience",
  "dsa", "skills", "achievements", "education", "contact",
] as const;

function isHttpUrl(v: string): boolean {
  try {
    const p = new URL(v).protocol;
    return p === "http:" || p === "https:";
  } catch {
    return false;
  }
}

const idStr = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(40);
const text = (max: number) => z.string().trim().min(1).max(max);
const httpUrl = z.string().max(300).refine(isHttpUrl, "Must start with http:// or https://");
const uploadPath = z
  .string()
  .max(120)
  .regex(/^\/uploads\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:webp|png|jpe?g)$/, "Must be an image under /uploads/");

function list<S extends z.ZodType<{ id: string }>>(item: S) {
  return z
    .array(item)
    .max(50)
    .refine((arr) => new Set(arr.map((a) => a.id)).size === arr.length, "Duplicate id");
}

export const SectionIdSchema = z.enum(SECTION_IDS);
export type SectionId = z.infer<typeof SectionIdSchema>;

const Section = z.strictObject({
  id: SectionIdSchema,
  title: text(60),
  visible: z.boolean(),
});

const Project = z.strictObject({
  id: idStr,
  slug: idStr,
  title: text(80),
  oneLiner: text(300),
  kind: text(40).optional(),
  highlights: z.array(text(30)).max(4).optional(),
  stack: z.array(text(40)).max(12),
  bullets: z.array(text(500)).max(10),
  links: z.strictObject({ github: httpUrl.optional(), live: httpUrl.optional() }),
  image: uploadPath.optional(),
  videoUrl: httpUrl.optional(),
  featured: z.boolean(),
  visible: z.boolean(),
  caseStudy: z.string().max(20000).optional(),
});

const Experience = z.strictObject({
  id: idStr,
  org: text(80),
  role: text(80),
  location: text(80),
  start: text(20),
  end: text(20),
  bullets: z.array(text(500)).max(10),
  link: httpUrl.optional(),
  visible: z.boolean(),
});

const Education = z.strictObject({
  id: idStr,
  school: text(120),
  degree: text(160),
  start: text(20),
  end: text(20),
  location: text(80),
  visible: z.boolean(),
});

const SkillRow = z.strictObject({
  id: idStr,
  label: text(40),
  items: z.array(text(60)).max(30),
});

const Achievement = z.strictObject({
  id: idStr,
  title: text(80),
  text: text(400),
  link: httpUrl.optional(),
  visible: z.boolean(),
});

export const SiteSchema = z.strictObject({
  version: z.literal(1),
  settings: z.strictObject({
    accent: z.enum(ACCENTS),
    defaultTheme: z.enum(["dark", "light"]),
  }),
  profile: z.strictObject({
    name: text(60),
    role: text(60),
    headline: text(120),
    tagline: text(240),
    status: z.strictObject({ show: z.boolean(), text: text(120) }),
    location: text(80),
    email: z.email().max(120),
    links: z.strictObject({ github: httpUrl, linkedin: httpUrl, leetcode: httpUrl }),
    photo: uploadPath.optional(),
    resumePdf: z.string().regex(/^\/[a-zA-Z0-9_-]+\.pdf$/),
  }),
  sections: list(Section),
  projects: list(Project).refine(
    (arr) => new Set(arr.map((p) => p.slug)).size === arr.length,
    "Duplicate slug",
  ),
  experience: list(Experience),
  education: list(Education),
  skills: list(SkillRow),
  achievements: list(Achievement),
  dsa: z.strictObject({
    show: z.strictObject({
      solved: z.boolean(),
      byDifficulty: z.boolean(),
      hard: z.boolean(),
      activeDays: z.boolean(),
      streak: z.boolean(),
      heatmap: z.boolean(),
      contestRating: z.boolean(),
      topPercent: z.boolean(),
    }),
    streakMinimum: z.number().int().min(0).max(365),
  }),
  recentlyShipped: z.strictObject({
    show: z.boolean(),
    hideIfOlderThanDays: z.number().int().min(1).max(365),
  }),
});

export type Site = z.infer<typeof SiteSchema>;
export type Project = z.infer<typeof Project>;
export type Section = z.infer<typeof Section>;

export const LeetcodeSchema = z.strictObject({
  fetchedAt: z.iso.datetime(),
  solved: z.number().int().nonnegative(),
  easy: z.number().int().nonnegative(),
  medium: z.number().int().nonnegative(),
  hard: z.number().int().nonnegative(),
  activeDays: z.number().int().nonnegative(),
  // ISO date -> submissions that day (only days with at least one submission)
  calendar: z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.number().int().positive()),
  rating: z.number().nonnegative(),
  topPercent: z.number().min(0).max(100),
  contests: z.number().int().nonnegative(),
});
export type Leetcode = z.infer<typeof LeetcodeSchema>;
