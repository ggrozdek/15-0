# Road to 15-0 Deployment Guide

Road to 15-0 is a Vite React app. Production output is written to `dist`.

## Local Setup

```bash
npm install
npm run data:build
npm run data:validate
npm run data:debug-random
npm run build
npm run preview
```

The app loads generated data from `public/data/generated/*.json` at runtime. If those files are missing, it falls back to sample data and shows a warning.

## Local Development

```bash
npm run dev
```

Open the shown localhost URL.

## Vercel

1. Import the repository in Vercel.
2. Set the build command to `npm run data:build && npm run build`.
3. Set the output directory to `dist`.
4. Deploy.

## Netlify

1. Import the repository in Netlify.
2. Set the build command to `npm run data:build && npm run build`.
3. Set the publish directory to `dist`.
4. Deploy.

## GitHub Pages

Vite builds to `dist`. If publishing under a repository subpath, set `base` in `vite.config.ts` to the repository path, for example:

```ts
export default defineConfig({
  base: "/road-to-15-0/",
});
```

Then run:

```bash
npm run data:build
npm run build
```

Publish the `dist` folder with your preferred GitHub Pages workflow.

## Pre-Publish Checklist

```bash
npm run data:build
npm run data:validate
npm run data:debug-random
npm run build
npm run preview
```

Check mobile widths around 360px, 390px, 430px, 768px, and desktop before publishing.
