import { defineCollection } from 'astro:content';
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "src/content/projects" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    featured: z.boolean().default(false),
    themeColor: z.string(),
    liveUrl: z.string(),
    githubUrl: z.string(),
    detailsUrl: z.string(),
    devpostUrl: z.string(),
  }),
});

export const collections = { projects };