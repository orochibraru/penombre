---
applyTo: "packages/mobile/**"
description: "Use when creating or modifying React Native / Expo mobile app code. Covers navigation, styling, and API client patterns."
---

# Mobile Package Guidelines

Expo + React Native app with NativeWind styling and Expo Router.

## Stack

- **Navigation**: Expo Router (file-based routing in `app/`)
- **Styling**: NativeWind (TailwindCSS classes via `className`)
- **Data fetching**: SWR with openapi-fetch client from `@/lib/api`
- **Types**: OpenAPI-generated types from `assets/api.v1.json`

## API client

```tsx
import useSWR from "swr";
import { listFiles, type ObjectItem } from "@/lib/api";

const { data, error, mutate, isLoading } = useSWR(
    "/api/v1/storage/list",
    listFiles,
);
```

## Rules

- DO NOT use web-only APIs (`window`, `document`, DOM APIs)
- DO NOT import from `packages/web/` — the mobile package has its own API types
- Use `@/` path alias for imports (maps to project root)
- Components in `components/`, hooks in `hooks/`, shared utils in `lib/`
- Use `ThemedView` and `ThemedText` for automatic dark mode support
