# 🚗 Opendrive

**A modern, self-hosted cloud storage solution with mobile and web clients**

Opendrive is a comprehensive file storage and synchronization platform that provides you with complete control over your data. Built with modern technologies and designed for both individual users and organizations who want the convenience of cloud storage without sacrificing privacy and control.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Go Version](https://img.shields.io/badge/go-1.25+-blue.svg)
![Node Version](https://img.shields.io/badge/node-20+-green.svg)

## ✨ Features

-   **🌐 Web Interface**: Modern, responsive web application built with SvelteKit
-   **📱 Mobile Apps**: Native Android and iOS applications using Capacitor
-   **🔐 OAuth Integration**: Secure authentication with multiple providers
-   **📂 File Management**: Upload, download, organize files and folders
-   **🏷️ Smart Categories**: Automatic categorization of files (images, documents, music, etc.)
-   **🔗 S3 Compatible**: Compatible with S3 API for easy integration
-   **🔒 Self-Hosted**: Complete control over your data and infrastructure
-   **⚡ High Performance**: Built with Go backend and modern frontend technologies
-   **🐳 Docker Support**: Easy deployment with Docker
-   **📊 Recent Files**: Quick access to recently modified files
-   **🌍 Multi-Platform**: Works on web, mobile, and desktop

## 🏗️ Architecture

Opendrive follows a microservices architecture with the following components:

-   **API Server** (Go): RESTful API backend with OpenAPI specification
-   **Web UI** (SvelteKit): Modern web interface with Shadcn/ui components
-   **Mobile Apps** (Capacitor): Cross-platform mobile applications
-   **Database** (PostgreSQL): User data and metadata storage
-   **Object Storage** (MinIO): S3-compatible file storage
-   **Reverse Proxy** (Traefik): Load balancing and SSL termination

## 🚀 Quick Start

### Prerequisites

-   Node.js 20+ with pnpm
-   Go 1.25+
-   Docker and Docker Compose
-   PostgreSQL (for production)

### Development Setup

1. **Clone the repository**

    ```bash
    git clone https://github.com/opendrive/opendrive.git
    cd opendrive
    ```

2. **Install dependencies**

    ```bash
    pnpm install
    ```

3. **Start development services**

    ```bash
    # This runs with a concurrently config to launch docker compose, air and vite.
    pnpm run dev
    ```

4. **Access the application**
    - Web UI: http://localhost:8080
    - API Documentation: http://localhost:8080/docs

## 📖 Documentation

-   [📋 Overview](./docs/overview.md) - Project overview and concepts
-   [🏗️ Architecture](./docs/architecture.md) - System architecture and design
-   [🚀 Deployment](./docs/deployment.md) - Production deployment guide
-   [💻 Development](./docs/development.md) - Local development setup
-   [� CI/CD](./docs/ci-cd.md) - Continuous integration and deployment
-   [🧪 PR Testing](./docs/pr-testing.md) - Pull request testing and preview environments
-   [�🔌 API Reference](./docs/api.md) - Complete API documentation
-   [👤 User Guide](./docs/user-guide.md) - End-user documentation

## 🛠️ Development

### Tech Stack

-   **Backend**: Go, Chi router, SQLC, PostgreSQL
-   **Frontend**: SvelteKit, TypeScript, TailwindCSS, Shadcn/ui
-   **Mobile**: Capacitor, Android/iOS native
-   **Storage**: MinIO (S3-compatible)
-   **DevOps**: Docker, GitHub Actions

### Available Commands

```bash
# Development
pnpm run dev          # Start all development servers
pnpm run test         # Run tests
pnpm run build        # Build all packages

# API specific (in packages/api/)
make migration        # Run database migrations
make lint            # Lint Go code
make test            # Run Go tests
go tool air          # Hot reload development server

# UI specific (in packages/ui/)
pnpm run dev         # Start web development server
pnpm run build       # Build web application
pnpm run lint        # Lint TypeScript/Svelte code
```

### API Code Generation

The project uses OpenAPI for API specification and code generation:

```bash
cd packages/api
# Generate Go server code
make api
# Generate TypeScript client code (for UI)
# This is automatically done during build
```

## 🤝 Contributing

We welcome contributions! Please see our [Development Guide](./docs/development.md) for details on:

-   Setting up your development environment
-   Code style and conventions
-   Testing requirements
-   Submitting pull requests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with amazing open-source technologies:

-   [SvelteKit](https://kit.svelte.dev/) - Web framework
-   [Shadcn/ui](https://shadcn-svelte.com/) - UI components
-   [Go](https://golang.org/) - Backend language
-   [Chi](https://go-chi.io/) - HTTP router
-   [MinIO](https://min.io/) - Object storage
-   [PostgreSQL](https://postgresql.org/) - Database
-   [Capacitor](https://capacitorjs.com/) - Mobile framework

## 🆘 Support

-   📖 [Documentation](./docs/)
-   🐛 [Issue Tracker](https://github.com/opendrive/opendrive/issues)
-   💬 [Discussions](https://github.com/opendrive/opendrive/discussions)
