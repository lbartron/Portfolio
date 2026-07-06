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
    projectTags: z.array(z.string()).default([""]),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "src/content/notes" }),
  schema: z.object({
    title: z.string().optional().default("Untitled Note"), 
    description: z.string().optional(),
    date: z.coerce.date().optional(), // Allows sorting by date
  }),
});

export const collections = { projects, notes };