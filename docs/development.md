# Development Guide

This guide covers everything you need to know to contribute to Opendrive, from setting up your development environment to submitting pull requests.

## Prerequisites

### System Requirements

- **Operating System**: macOS, Linux, or Windows with WSL2
- **Node.js**: 20+ with pnpm package manager
- **Go**: 1.24+
- **Docker**: Latest version with Docker Compose
- **Git**: For version control

### Development Tools (Recommended)

- **VS Code**: With Go and Svelte extensions
- **Database Client**: pgAdmin, DBeaver, or similar
- **API Client**: Postman, Insomnia, or similar
- **Browser Dev Tools**: Chrome DevTools or Firefox Developer Tools

## Quick Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/opendrive.git
   cd opendrive
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start development environment**

   ```bash
   # Start PostgreSQL and MinIO containers
   docker compose up -d db storage

   # Run database migrations
   cd packages/api && make migration && cd ../..

   # Start all development servers
   pnpm run dev
   ```

4. **Verify setup**
   - Web UI: http://localhost:5173
   - API: http://localhost:8080
   - API Health: http://localhost:8080/api/v1/healthz
   - MinIO Console: http://localhost:9001

## Backend Development (Go)

### Directory Structure

```
packages/api/
├── main.go              # Application entry point
├── config/              # Configuration files
├── handlers/            # HTTP request handlers
├── services/            # Business logic services
├── db/                  # Database related code
│   ├── migrations/      # SQL migration files
│   ├── query.sql        # SQL queries for SQLC
│   └── sqlc/           # Generated database code
├── logger/              # Logging utilities
├── public/              # Static assets (OpenAPI spec)
└── tmp/                # Development artifacts
```

### Key Technologies

- **HTTP Router**: [Chi](https://go-chi.io/) - Lightweight, composable router
- **Database**: [SQLC](https://sqlc.dev/) - Generate type-safe Go from SQL
- **API Generation**: [oapi-codegen](https://github.com/oapi-codegen/oapi-codegen)
- **Hot Reload**: [Air](https://github.com/air-verse/air) - Live reloading for development

### Development Workflow

1. **Make changes** to Go code
2. **Air automatically reloads** the server
3. **Run tests** to ensure functionality
4. **Update OpenAPI spec** if API changes
5. **Regenerate code** if needed

### Common Commands

```bash
cd packages/api

# Development server with hot reload
go tool air

# Run tests
make test

# Run linter
make lint

# Database migrations
make migration

# Generate API code from OpenAPI spec
go tool oapi-codegen -config ./config/codegen.yaml ./public/openapi.json
go mod tidy

# Build binary
go build -o opendrive .
```

### Database Development

#### Migrations

Create new migration files in `db/migrations/`:

```sql
-- 002_add_user_preferences.up.sql
ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';

-- 002_add_user_preferences.down.sql
ALTER TABLE users DROP COLUMN preferences;
```

#### Queries

Add SQL queries to `db/query.sql`:

```sql
-- name: GetUser :one
SELECT id, name, email, created_at
FROM users
WHERE id = $1;

-- name: CreateUser :one
INSERT INTO users (id, name, email)
VALUES ($1, $2, $3)
RETURNING *;
```

Generate Go code with SQLC:

```bash
cd packages/api
go tool sqlc generate
```

### API Development

#### Adding New Endpoints

1. **Update OpenAPI specification** in `public/openapi.json`
2. **Regenerate Go code**:
   ```bash
   go tool oapi-codegen -config ./config/codegen.yaml ./public/openapi.json
   ```
3. **Implement handler** in `handlers/` directory
4. **Add business logic** in `services/` directory
5. **Update tests**

#### Example Handler

```go
// handlers/storage_handler.go
func (h *Handler) ListObjects(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    // Extract parameters
    params := &services.ListObjectsParams{}
    if err := binding.Bind(r, params); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    // Call service
    objects, err := h.storageService.ListObjects(ctx, params)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    // Return response
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(objects)
}
```

## Frontend Development (SvelteKit)

### Directory Structure

```
packages/ui/src/
├── lib/
│   ├── api/             # Generated API client
│   ├── components/      # Reusable components
│   │   └── ui/         # Shadcn/ui components
│   ├── auth.ts          # Authentication logic
│   └── utils.ts         # Utility functions
├── routes/              # File-based routing
│   ├── +layout.svelte   # Root layout
│   ├── +page.svelte     # Home page
│   └── dashboard/       # Dashboard pages
└── app.html             # HTML template
```

### Key Technologies

- **Framework**: [SvelteKit](https://kit.svelte.dev/) - Full-stack web framework
- **Styling**: [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS
- **Components**: [Shadcn/ui](https://shadcn-svelte.com/) - High-quality components
- **Type Safety**: TypeScript with generated API client
- **Build Tool**: [Vite](https://vitejs.dev/) - Fast build tool

### Development Workflow

1. **Make changes** to Svelte components
2. **Vite hot-reloads** the browser
3. **TypeScript checks** for type errors
4. **Lint and format** code automatically
5. **Test changes** in browser

### Common Commands

```bash
cd packages/ui

# Development server
pnpm run dev

# Build for production
pnpm run build

# Type checking
pnpm run check

# Linting
pnpm run lint

# Auto-fix linting issues
pnpm run lint:fix

# Format code
pnpm run format

# Check for circular dependencies
pnpm run circular
```

### Component Development

#### Creating New Components

1. **Create component file** in appropriate directory
2. **Follow naming conventions**: PascalCase for components
3. **Use TypeScript**: Add proper type definitions
4. **Style with Tailwind**: Use utility classes
5. **Add to component exports** if reusable

#### Example Component

```svelte
<!-- lib/components/FileCard.svelte -->
<script lang="ts">
  import type { ObjectItem } from '$lib/api/schema';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

  export let file: ObjectItem;

  function formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
</script>

<Card class="hover:shadow-md transition-shadow">
  <CardHeader>
    <CardTitle class="truncate">{file.key}</CardTitle>
  </CardHeader>
  <CardContent>
    <div class="text-sm text-muted-foreground">
      <p>Size: {formatFileSize(file.size || 0)}</p>
      <p>Type: {file.contentType}</p>
      <p>Modified: {new Date(file.lastModified || '').toLocaleDateString()}</p>
    </div>
  </CardContent>
</Card>
```

### API Integration

The frontend uses auto-generated TypeScript client from the OpenAPI specification:

```typescript
// lib/api/client.ts
import type { paths } from "./schema";

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "/api/v1") {
    this.baseUrl = baseUrl;
  }

  async listObjects(): Promise<
    paths["/storage/objects"]["get"]["responses"]["200"]["content"]["application/json"]
  > {
    const response = await fetch(`${this.baseUrl}/storage/objects`);
    if (!response.ok) throw new Error("Failed to fetch objects");
    return response.json();
  }
}
```

## Mobile Development (Capacitor)

### Setup

1. **Install Capacitor CLI**

   ```bash
   npm install -g @capacitor/cli
   ```

2. **Sync mobile projects**
   ```bash
   cd packages/ui
   npx cap sync
   ```

### Android Development

```bash
# Open Android Studio
npx cap open android

# Run on device/emulator
npx cap run android

# Build APK
cd packages/android
./gradlew assembleDebug
```

### iOS Development

```bash
# Open Xcode (macOS only)
npx cap open ios

# Run on device/simulator
npx cap run ios
```

## Database Management

### Local Development Database

The development environment uses PostgreSQL in Docker:

```yaml
# compose.yaml
db:
  image: postgres:17-alpine
  environment:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
    POSTGRES_DB: opendrive
  ports:
    - "5432:5432"
```

### Migration Management

```bash
cd packages/api

# Create new migration
migrate create -ext sql -dir db/migrations -seq migration_name

# Run migrations
make migration

# Rollback migration
migrate -database "postgres://postgres:postgres@localhost/opendrive?sslmode=disable" -path db/migrations down 1
```

## Testing

### Go Backend Testing

```bash
cd packages/api

# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run specific test
go test ./handlers -run TestListObjects
```

### Frontend Testing

```bash
cd packages/ui

# Component tests (future)
pnpm run test

# Type checking
pnpm run check
```

### End-to-End Testing

```bash
# Run Playwright tests
pnpm run test

# Run tests in headed mode
pnpm run test:headed

# Generate test report
pnpm run test:report
```

## Code Quality

### Linting and Formatting

#### Go Code

```bash
cd packages/api

# Format code
go fmt ./...

# Run linter
golangci-lint run

# Fix linting issues automatically
golangci-lint run --fix
```

#### Frontend Code

```bash
cd packages/ui

# Lint TypeScript and Svelte
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Format with Prettier
pnpm run format
```

### Pre-commit Hooks

The project uses Husky and lint-staged for pre-commit hooks:

```javascript
// lint-staged.config.mjs
export default {
  "packages/ui/**/*.{ts,svelte}": [
    "pnpm -C packages/ui run lint:fix",
    "pnpm -C packages/ui run check",
    "pnpm -C packages/ui run format",
  ],
  "**/*.go": [
    "sh -c 'cd packages/api && go fmt'",
    "sh -c 'cd packages/api && make lint'",
    "sh -c 'cd packages/api && make test'",
  ],
};
```

## Environment Configuration

### Development Environment

Create `.env` file in project root:

```bash
# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/opendrive?sslmode=disable

# Storage
STORAGE_URL=http://localhost:9000
STORAGE_ACCESS_KEY_ID=minioadmin
STORAGE_ACCESS_KEY_SECRET=minioadmin

# OAuth (optional for development)
OAUTH_PROVIDERS=pocketid
OAUTH_POCKETID_CLIENT_ID=your-client-id
OAUTH_POCKETID_CLIENT_SECRET=your-client-secret
OAUTH_POCKETID_DISCOVERY_URL=https://your-provider.com/.well-known/openid_configuration
OAUTH_POCKETID_REDIRECT_URL=http://localhost:8080/api/v1/auth/pocketid/callback
```

### Environment Variables Reference

| Variable                    | Description                  | Default                 |
| --------------------------- | ---------------------------- | ----------------------- |
| `DATABASE_URL`              | PostgreSQL connection string | Required                |
| `STORAGE_URL`               | MinIO/S3 endpoint URL        | Required                |
| `STORAGE_ACCESS_KEY_ID`     | S3 access key                | Required                |
| `STORAGE_ACCESS_KEY_SECRET` | S3 secret key                | Required                |
| `ORIGIN`                    | Frontend URL for CORS        | `http://localhost:5173` |
| `OAUTH_PROVIDERS`           | Enabled OAuth providers      | Empty                   |
| `BODY_SIZE_LIMIT`           | Max request body size        | `50MB`                  |

## Debugging

### Backend Debugging

#### VS Code Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "go",
      "request": "launch",
      "mode": "auto",
      "program": "${workspaceFolder}/packages/api",
      "env": {
        "DATABASE_URL": "postgres://postgres:postgres@localhost:5432/opendrive?sslmode=disable",
        "STORAGE_URL": "http://localhost:9000"
      }
    }
  ]
}
```

#### Logging

```go
// Use structured logging
logger.Info("Processing request",
  "method", r.Method,
  "path", r.URL.Path,
  "user_id", userID,
)
```

### Frontend Debugging

#### Browser DevTools

- Use Chrome/Firefox developer tools
- Check Network tab for API requests
- Use Console for JavaScript errors
- Use Svelte DevTools extension

#### VS Code Integration

```json
// .vscode/settings.json
{
  "svelte.enable-ts-plugin": true,
  "typescript.preferences.includePackageJsonAutoImports": "auto"
}
```

## Contributing

### Development Process

1. **Fork the repository** on GitHub
2. **Create a feature branch** from `main`
3. **Make your changes** following coding standards
4. **Write tests** for new functionality
5. **Ensure all tests pass** locally
6. **Submit a pull request** with clear description

### Coding Standards

#### Go Code

- Follow [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- Use `gofmt` for formatting
- Write meaningful variable names
- Add comments for exported functions
- Handle errors properly

```go
// Good
func (s *StorageService) GetObject(ctx context.Context, key string) (*Object, error) {
    if key == "" {
        return nil, fmt.Errorf("key cannot be empty")
    }

    obj, err := s.client.GetObject(ctx, key)
    if err != nil {
        return nil, fmt.Errorf("failed to get object %s: %w", key, err)
    }

    return obj, nil
}
```

#### TypeScript/Svelte Code

- Use TypeScript for type safety
- Follow consistent naming conventions
- Use meaningful component and variable names
- Add JSDoc comments for complex functions

```typescript
/**
 * Formats file size in human readable format
 * @param bytes - File size in bytes
 * @returns Formatted string like "1.5 MB"
 */
function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
}
```

### Commit Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add file upload progress indicator
fix: resolve authentication redirect loop
docs: update API documentation
test: add unit tests for storage service
refactor: simplify error handling logic
```

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure CI passes** (tests, linting, type checking)
4. **Request review** from maintainers
5. **Address feedback** and update PR
6. **Squash commits** if requested

## Troubleshooting

### Common Issues

#### Docker Issues

```bash
# Reset Docker environment
docker compose down -v
docker compose up -d

# Clear Docker cache
docker system prune -af
```

#### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps db

# Connect to database directly
docker compose exec db psql -U postgres -d opendrive
```

#### Go Module Issues

```bash
# Clean module cache
go clean -modcache

# Download dependencies
go mod download

# Tidy modules
go mod tidy
```

#### Node.js/pnpm Issues

```bash
# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Getting Help

- **Documentation**: Check this guide and other docs
- **Issues**: Search GitHub issues for similar problems
- **Discussions**: Join GitHub Discussions for questions
- **Community**: Reach out to the community on Discord/Slack

## Performance Tips

### Backend Optimization

- Use connection pooling for database
- Implement proper caching strategies
- Profile with `go tool pprof`
- Optimize database queries

### Frontend Optimization

- Use SvelteKit's prerendering features
- Implement lazy loading for components
- Optimize images and assets
- Use Vite's code splitting

### Development Speed

- Use Air for Go hot reloading
- Enable Vite's fast refresh
- Use VS Code extensions for better DX
- Set up proper debugging configuration

This development guide should help you get started with contributing to Opendrive. For specific questions or issues, don't hesitate to reach out to the community or check the existing documentation.
