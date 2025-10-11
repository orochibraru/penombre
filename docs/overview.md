# Overview

Opendrive is a comprehensive, self-hosted cloud storage solution designed for individuals and organizations who want complete control over their data while maintaining the convenience and functionality of modern cloud storage services.

## What is Opendrive?

Opendrive provides a complete ecosystem for file storage, synchronization, and sharing:

- **Web Application**: A modern, responsive interface for managing files from any browser
- **Mobile Applications**: Native Android and iOS apps for on-the-go access
- **S3-Compatible Storage**: Industry-standard object storage compatible with existing tools
- **OAuth Integration**: Secure authentication with popular identity providers
- **Self-Hosted**: Deploy on your own infrastructure for complete data sovereignty

## Key Concepts

### Architecture

Opendrive follows a microservices architecture with clearly separated concerns:

- **API Server**: Handles all business logic, authentication, and storage operations
- **Web UI**: Modern SvelteKit application providing the user interface
- **Mobile Apps**: Cross-platform applications built with Capacitor
- **Object Storage**: MinIO provides S3-compatible storage backend
- **Database**: PostgreSQL stores user data and metadata

### Storage Model

Files in Opendrive are organized using a flat namespace with support for:

- **Buckets**: Top-level containers for organizing files
- **Objects**: Individual files stored in buckets
- **Categories**: Automatic classification of files (images, documents, music, etc.)
- **Recent Files**: Time-based access to recently modified content
- **Folders**: Logical grouping of related files

### Security

Security is built into every layer:

- **OAuth 2.0**: Industry-standard authentication
- **Session Management**: Secure session handling with CSRF protection
- **Access Control**: Fine-grained permissions for files and folders
- **Self-Hosted**: Keep your data on infrastructure you control

## Getting Started

The fastest way to get started with Opendrive:

1. **Development**: Set up a local development environment
2. **Docker Compose**: Simple deployment for smaller setups

See our [Development Guide](./development.md) for detailed instructions.

## Use Cases

### Personal Cloud Storage

Replace commercial cloud storage services while maintaining:

- Cross-device synchronization
- Mobile and web access
- Automatic file organization
- Privacy and control

### Team Collaboration

Enable secure file sharing and collaboration:

- Shared folders and workspaces
- Access control and permissions
- Version history and backups
- Integration with existing workflows

### Enterprise Deployment

Scale for organizational needs:

- High availability and redundancy
- Integration with existing identity systems
- Compliance and data governance
- Custom deployment configurations

## Community and Support

- **Documentation**: Comprehensive guides and API references
- **Issue Tracking**: Report bugs and request features on GitHub
- **Discussions**: Community support and feature discussions
- **Contributing**: Join the development community

## Next Steps

- [🏗️ Architecture](./architecture.md) - Understand the system design
- [💻 Development](./development.md) - Set up your development environment
- [🚀 Deployment](./deployment.md) - Deploy Opendrive in production
- [📖 User Guide](./user-guide.md) - Learn how to use Opendrive
