# EventHorizon - Local Event Discovery Platform

A modern, premium Event Discovery web application built with Next.js 15, Tailwind CSS v4, and Shadcn UI.

## Features

- **Modern UI/UX**: Glassmorphism, smooth transitions, and premium design.
- **Dark Mode**: Fully supported with system preference detection.
- **Event Discovery**: Search, Filter by Category/Price, and Map View (placeholder).
- **Event Details**: Rich event pages with detailed info and related events.
- **Create Event**: Form to host your own events.
- **Authentication**: Login/Signup pages (UI built, ready for NextAuth integration).
- **Dashboard**: User dashboard to manage events and tickets.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Components**: Shadcn UI (Radix Primitives)
- **Icons**: Lucide React
- **Language**: TypeScript

## Getting Started

1. **Install Dependencies**:
   ```bash
   bun install
   # or
   npm install
   ```

2. **Run Development Server**:
   ```bash
   bun run dev
   # or
   npm run dev
   ```

3. **Open Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

- `src/app`: App Router pages and layouts.
- `src/components`: Reusable UI components.
  - `ui/`: Primitives (Button, Card, Input, etc.).
  - `navbar.tsx`, `footer.tsx`: Layout components.
- `src/lib`: Utilities and configurations (utils.ts, auth.ts).

## Customization

- **Colors**: Edit `src/app/globals.css` to change the CSS variables for the theme (Primary: Indigo/Violet).
- **Fonts**: Uses `Inter` via `next/font/google`.

---
Built by Antigravity
