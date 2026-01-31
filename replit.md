# Eleven Docs

A curated digital marketplace for high-quality digital assets built with Next.js.

## Overview

Eleven Docs is a modern web application designed for the modern student, developer, and creative professional. It offers a curated collection of digital assets with AI-powered PDF generation features.

## Tech Stack

- **Framework**: Next.js 15.5.9 (with Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Backend Integration**: Firebase
- **AI**: Genkit with Google AI

## Project Structure

```
src/
├── ai/           # AI integration (Genkit flows)
├── app/          # Next.js App Router pages
├── components/   # React components
├── firebase/     # Firebase configuration
├── hooks/        # Custom React hooks
└── lib/          # Utility functions and types
```

## Development

The dev server runs on port 5000 with:
```bash
npm run dev -- --port 5000 --hostname 0.0.0.0
```

## Build & Production

Build the application:
```bash
npm run build
```

Start production server:
```bash
npm run start -- --port 5000 --hostname 0.0.0.0
```

## Environment Variables

The application uses Firebase and AI integrations that may require environment variables for API keys and configuration.

## Recent Changes

- 2026-01-24: Configured for Replit environment with allowedDevOrigins for proxy support
- 2026-01-24: Set up workflow on port 5000
- 2026-01-24: Upgraded to Node.js 24 for project compatibility
