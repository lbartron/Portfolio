---
title: "Portfolio"
description: "My Portfolio page that you are currently viewing!"
featured: true
themeColor: "#bb1f1f"
liveUrl: ""
githubUrl: "https://github.com/lbartron/Portfolio"
detailsUrl: ""
devpostUrl: ""
projectTags: ["Astro", "Typescript", "Node JS"]
---

My personal portfolio site. Built to be a place to share projects and a current set of technical notes from coursework and side reading.

## Tech Stack

**Astro:** The site is built with [Astro](https://astro.build/), a static site generator that outputs plain HTML with no client-side framework by default. This keeps the page fast and cheap to host.

**TypeScript:** Used across the Astro components and content collection schemas for type safety when the project or note frontmatter is missing or malformed.

**Content Collections:** Projects and notes live as markdown files in `src/content/`. A Zod schema in `src/content.config.ts` validates each file's frontmatter at build time, so broken pages aren't shipped out. 

**KaTeX:** Math in note frontmatter and body content is rendered with `remark-math` and `rehype-katex`. This is what makes the equations in the CS coursework notes actually readable.

**Mermaid:** Diagrams in notes are rendered at build time with `rehype-mermaid`, which uses Playwright under the hood. The tradeoff is a heavier build step in exchange for real SVG diagrams instead of client-side rendering.

**Shiki:** Code blocks in notes and project pages use Shiki for syntax highlighting, which runs at build time so no highlighting library ships to the client.

**GitHub Pages:** The site is deployed to GitHub Pages via a workflow in `.github/workflows/deploy.yml`. Every push to `main` triggers a fresh build and deploy.

## Project Structure

```
src/
  assets/         Images and icons used across the site
  components/     Reusable Astro components (sidebar, tiles, timeline, etc.)
  content/
    projects/     Markdown files for projects
    notes/        Markdown files for technical notes
    data/         JSON for the timeline and skills list
  layouts/        Base HTML layout
  pages/          Route files. Dynamic routes live under projects/ and notes/
  styles/         Global CSS and markdown-specific styles
public/           Static assets served at the site root
```

## Local Development

If you want to use my website as a template for your own personal page, you can follow these directions below. 

### Prerequisites

Node.js 22.12 or newer is required. The `package.json` engines field enforces this.

### Running The Site

Install dependencies and start the dev server:
```
npm install
npm run dev
```

The dev server runs at `http://localhost:4321/Portfolio/` by default. The `/Portfolio/` base path matches the production deployment on GitHub Pages.

### Building The Site

To produce a production build in `dist/`:
```
npm run build
```

To preview the built site locally:
```
npm run preview
```

## Adding Content

### Projects

Add a new `.md` file under `src/content/projects/`. The frontmatter schema is defined in `src/content.config.ts` and requires a title, description, and theme color at minimum. Set `featured: true` to have the project appear on the home page in addition to the projects listing.

### Notes

Add a new `.md` file under `src/content/notes/`. Notes support KaTeX math with `$...$` and `$$...$$`, and Mermaid diagrams inside ```` ```mermaid ```` code blocks. A `date` field in the frontmatter is used to sort notes and group them by year on the notes page.

### Timeline and Skills

The about page reads from `src/content/data/timeline.json` and `src/content/data/skills.json`. Edit those files directly to add career events, education entries, or new skills.

## Deployment

Deployment is handled automatically. Pushing to `main` runs the GitHub Actions workflow, which installs dependencies, installs Chromium via Playwright for Mermaid rendering, builds the site, and publishes the `dist/` directory to GitHub Pages.