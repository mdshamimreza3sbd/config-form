# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Restaurant Form Management System built with Next.js 15, featuring JWT authentication, MongoDB integration, and a form-based interface for managing restaurant security forms. The application allows authenticated users to submit and track restaurant form tasks including password changes, firewall settings, and remote access credentials.

## Development Commands

**Package Manager:** This project uses **pnpm** (not npm)

```bash
pnpm install         # Install dependencies
pnpm dev            # Development server with Turbopack (http://localhost:3000)
pnpm build          # Production build with Turbopack
pnpm start          # Start production server
```

## Architecture & Project Structure

**Tech Stack:**
- Next.js 15.5.6 with App Router
- React 19.1.0 with TypeScript 5
- MongoDB with Mongoose 8.19.1
- JWT Authentication (jsonwebtoken)
- Zod for form validation
- Tailwind CSS v4 with shadcn/ui (New York style)
- react-hot-toast for notifications

**Directory Structure:**
```
src/
├── app/
│   ├── page.tsx                          # Login page
│   ├── form/page.tsx                     # Main form (protected route)
│   ├── layout.tsx                        # Root layout with Geist fonts
│   ├── globals.css                       # Tailwind v4 CSS with custom variables
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts            # POST: User login, returns JWT
│       │   ├── verify/route.ts           # GET: Verify JWT token
│       │   └── logout/route.ts           # POST: User logout
│       └── form/
│           ├── submit/route.ts           # POST: Submit form
│           └── list/route.ts             # GET: List user forms
├── lib/
│   ├── mongodb.ts                        # MongoDB connection with caching
│   ├── jwt.ts                            # JWT utilities (verifyToken, verifyRequest)
│   └── utils.ts                          # Tailwind class merging (cn helper)
└── models/
    ├── User.ts                           # User schema with plain-text password comparison
    └── Form.ts                           # Form schema with indexes
```

## Authentication & Security

**JWT Authentication Flow:**
1. User logs in at `/` (login page) with username/password
2. Backend validates credentials and returns JWT token
3. Token stored in localStorage as 'token' and 'userName'
4. Protected routes (`/form`) verify token via `/api/auth/verify`
5. All API requests include JWT in Authorization header: `Bearer ${token}`

**Authentication Utilities (`src/lib/jwt.ts`):**
- `verifyToken(token)` - Validates JWT and returns payload
- `getTokenFromRequest(request)` - Extracts token from cookie or Authorization header
- `verifyRequest(request)` - Combined token extraction and verification

**User Model (`src/models/User.ts`):**
- Uses plain-text password comparison (NOT hashed)
- Method: `comparePassword(candidatePassword)` for authentication

## Database Models

**Form Model (`src/models/Form.ts`):**
Stores restaurant security form submissions with:
- Required fields: restaurantName, outletName, saPassword, nonSaCredentials (array of {username, password})
- Optional remote access: anydeskUsername, anydeskPassword, ultraviewerUsername, ultraviewerPassword
- Boolean checkboxes: saPassChange, syncedUserPassChange, nonSaPassChange, windowsAuthDisable, sqlCustomPort, firewallOnAllPcs, anydeskUninstall, ultraviewerPassAndId, posAdminPassChange
- Optional text field: remarks (for additional notes)
- Metadata: userId, username, userAgent, ipAddress, timestamps
- Indexes: `{userId: 1, createdAt: -1}` and `{restaurantName: 1, outletName: 1}`
- Note: nonSaCredentials supports multiple Non-SA users with Add/Remove functionality

**MongoDB Connection (`src/lib/mongodb.ts`):**
- Uses global caching to prevent multiple connections in development
- Handles Next.js hot reloading properly
- Requires `MONGODB_URI` environment variable

## Form Behavior & Validation

**Form Page (`src/app/form/page.tsx`):**
- Uses Zod schema for client-side validation
- Auto-generates 16-character passwords for SA and Non-SA fields (excludes single/double quotes)
- Supports multiple Non-SA credentials with dynamic Add/Remove buttons (minimum 1 required)
- Password fields are disabled; only regenerate button can change them
- Copy button for generated passwords with visual feedback (green checkmark)
- Includes optional remarks textarea for additional notes
- Compact UI design with reduced spacing
- react-hot-toast for success/error notifications
- Form resets 3 seconds after successful submission
- Captures userAgent on submission

**Password Generation:**
- Length: 16 characters
- Character sets: uppercase, lowercase, numbers, symbols
- Excludes: single quotes ('), double quotes (")
- Ensures at least one character from each category

## Environment Variables

Required in `.env` or `.env.local`:
```bash
MONGODB_URI=mongodb://localhost:27017/your-database-name
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
```

## Styling & UI

**Tailwind CSS v4:**
- CSS-first configuration in `src/app/globals.css`
- Custom CSS variables with `@theme inline`
- OKLCH color space for custom palette
- Compact spacing: reduced padding, margins, and gaps throughout

**shadcn/ui Configuration:**
- Style: "new-york"
- RSC enabled, CSS variables mode
- Base color: neutral
- Icon library: lucide-react
- Components path: `src/components/ui/`

**Import Aliases:**
- `@/*` → `./src/*`
- `@/components` → shadcn/ui components
- `@/lib` → utility functions
- `@/ui` → UI components
- `@/hooks` → custom React hooks

## API Routes

**Authentication:**
- `POST /api/auth/login` - Login with username/password, returns JWT
- `GET /api/auth/verify` - Verify JWT token validity
- `POST /api/auth/logout` - Logout (clears token)

**Form:**
- `POST /api/form/submit` - Submit new form (requires JWT)
- `GET /api/form/list` - List user's forms (requires JWT)

All protected routes validate JWT using `verifyRequest()` from `@/lib/jwt`
