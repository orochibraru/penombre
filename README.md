# 🚗 Opendrive

**A modern, self-hosted cloud storage solution with mobile and web clients**

Opendrive is a comprehensive file storage and synchronization platform that provides you with complete control over your data. Built with modern technologies and designed for both individual users and organizations who want the convenience of cloud storage without sacrificing privacy and control.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Bun Version](https://img.shields.io/badge/bun-1.3.1-green.svg)

## ✨ Features

- **🌐 Web Interface**: Modern, responsive web application built with SvelteKit
- **🔐 OAuth Integration**: Secure authentication with multiple providers
- **📂 File Management**: Upload, download, organize files and folders
- **🏷️ Smart Categories**: Automatic categorization of files (images, documents, music, etc.)
- **🔒 Self-Hosted**: Complete control over your data and infrastructure
- **🐳 Docker Support**: Easy deployment with Docker
- **📊 Recent Files**: Quick access to recently modified files
- **🌍 Multi-Platform**: Works on web, mobile, and desktop

## 🏗️ Architecture

Opendrive follows a microservices architecture with the following components:

- **API Server** (Bun): RESTful API backend with OpenAPI specification
- **Web UI** (SvelteKit): Modern web interface with Shadcn/ui components
- **Database** (PostgreSQL): User data and metadata storage
- **Reverse Proxy** (Traefik): Load balancing and SSL termination

## 🚀 Quick Start

### Prerequisites

- Bun 1.3+
- Docker and Docker Compose
- PostgreSQL (for production)

### Development Setup

1. **Clone the repository**

    ```bash
    git clone https://github.com/opendrive/opendrive.git
    cd opendrive
    ```

2. **Install dependencies**

    ```bash
    bun install
    ```

3. **Start development services**

    ```bash
    # This runs with a concurrently config to launch docker compose, air and vite.
    bun run dev
    ```

4. **Access the application**
    - Web UI: http://localhost:8080
    - API Documentation: http://localhost:8080/docs

## 🛠️ Development

### Tech Stack

- **Backend**: Bun, Koritsu, Drizzle ORM, PostgreSQL
- **Frontend**: SvelteKit, TypeScript, TailwindCSS, Shadcn/svelte
- **DevOps**: Docker, GitHub Actions

### Available Commands

```bash
# Development
bun run dev          # Start all development servers
bun run test         # Run tests
bun run build        # Build all packages

# API specific (in packages/api/)
bun run dev          # Start API development server with hot reload
bun run db:migrate   # Run database migrations
bun run db:generate  # Generate Drizzle schema types

# UI specific (in packages/ui/)
bun run dev         # Start web development server
bun run build       # Build web application
bun run lint        # Lint TypeScript/Svelte code
bun run lint:fix    # Lint TypeScript/Svelte code and fix (fixable) issues
```

### API Code Generation

The project uses OpenAPI for API specification and code generation:

```bash
# Generate TypeScript client code (for UI)
bun run gen:api
# This is automatically done during build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with amazing open-source technologies:

- [SvelteKit](https://kit.svelte.dev/) - Web framework
- [Shadcn/ui (svelte)](https://shadcn-svelte.com/) - UI components
- [Bun](https://bun.sh/) - JavaScript runtime and toolkit
- [Koritsu](https://koritsu.dev/) - Web framework
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [PostgreSQL](https://postgresql.org/) - Database

## 🆘 Support

- 🐛 [Issue Tracker](https://github.com/boyer-nicolas/opendrive/issues)
- 💬 [Discussions](https://github.com/boyer-nicolas/opendrive/discussions)
