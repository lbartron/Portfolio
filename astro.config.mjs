// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://astro.build/config
export default defineConfig({
  integrations: [
    icon({
      iconDir: 'src/assets/images',
    }),
  ],
  markdown: { 
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
  },
});