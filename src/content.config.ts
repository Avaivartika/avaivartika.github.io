import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const commonSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false)
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: commonSchema.extend({
    hero: z.string().optional()
  })
});

const notes = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/notes" }),
  schema: commonSchema.extend({
    source: z.enum(["obsidian", "manual"]).default("manual")
  })
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: commonSchema.extend({
    repo: z.string().optional(),
    demo: z.string().url().optional(),
    status: z.enum(["active", "building", "archive"]).default("active")
  })
});

export const collections = { blog, notes, projects };
