# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application with TypeScript, using the App Router architecture. The project is configured with shadcn/ui components (New York style) and Tailwind CSS v4 for styling, along with Mongoose for MongoDB integration.

## Development Commands

**Development server:**
```bash
npm run dev
# Uses Turbopack for faster development builds
# Server runs on http://localhost:3000
```

**Production build:**
```bash
npm run build
# Uses Turbopack for optimized production builds
```

**Production server:**
```bash
npm start
# Starts the production server
```

## Architecture & Project Structure

**Tech Stack:**
- Next.js 15.5.6 with App Router
- React 19.1.0
- TypeScript 5
- Tailwind CSS v4 (with PostCSS v4)
- Mongoose 8.19.1 for MongoDB
- shadcn/ui components (New York style variant)
- Lucide React for icons

**Directory Structure:**
```
src/
├── app/                 # Next.js App Router pages
│   ├── layout.tsx      # Root layout with Geist fonts
│   ├── page.tsx        # Homepage
│   └── globals.css     # Global styles with Tailwind v4 and CSS variables
└── lib/
    └── utils.ts        # Utility functions (cn helper for class merging)
```

**Import Aliases:**
The project uses path aliases configured in tsconfig.json and components.json:
- `@/*` → `./src/*`
- `@/components` → shadcn/ui components
- `@/lib` → utility functions
- `@/ui` → UI components
- `@/hooks` → custom React hooks

## Styling & UI

**Tailwind CSS v4:**
- Uses CSS-first configuration in `src/app/globals.css`
- Custom CSS variables defined with `@theme inline`
- Dark mode support with `.dark` class variant
- Custom color palette using OKLCH color space
- Design tokens for radius, colors, and spacing

**shadcn/ui Configuration:**
- Style: "new-york"
- React Server Components enabled (`rsc: true`)
- CSS variables mode enabled
- Base color: neutral
- Icon library: lucide-react

When adding shadcn/ui components, they should be placed in `src/components/ui/` following the aliases configuration.

## Database

The project includes Mongoose for MongoDB integration. When creating models or database connections:
- Models should follow Mongoose schema patterns
- Connection logic should handle Next.js development hot reloading
- Use environment variables for database connection strings

## Fonts

The project uses Next.js font optimization with Geist fonts:
- `--font-geist-sans` for sans-serif text
- `--font-geist-mono` for monospace text

These are loaded in `src/app/layout.tsx` and available as CSS variables.

## TypeScript Configuration

- Target: ES2017
- Strict mode enabled
- Module resolution: bundler
- Path aliases configured for clean imports
- Next.js plugin enabled for type checking
