# OpenDrive Kubernetes Deployment

This directory contains Kubernetes manifests to deploy OpenDrive on your K3s cluster, migrating from Docker Swarm.

## Prerequisites

- K3s cluster running
- `kubectl` configured to access your cluster
- Your container images available at `git.ombrage.space/opendrive/opendrive:latest` and `git.ombrage.space/opendrive/storage:latest`

## Quick Start

1. **Create Registry Secret**: Since the images are hosted on a private registry, you need to create authentication credentials:

   ```bash
   ./create-registry-secret.sh
   ```

   This will prompt for your `git.ombrage.space` username and password/token.

2. **Update Configuration**: Edit `config.yaml` to set your domain, OAuth settings, and other environment variables.

3. **Update Secrets**: Modify the secrets in `config.yaml` with your actual credentials:

   - Database passwords
   - OAuth client credentials
   - Storage access keys

4. **Set Your Domain**: Update the host in `ingress.yaml` with your actual domain name.

5. **Deploy**: Run the deployment script:
   ```bash
   ./deploy.sh
   ```

## Manual Deployment

If you prefer to deploy manually:

```bash
# Create namespace and registry secret
kubectl apply -f namespace.yaml
kubectl apply -f registry-secret.yaml  # After running create-registry-secret.sh
kubectl apply -f namespace.yaml
kubectl apply -f config.yaml

# Deploy database and storage
kubectl apply -f postgres.yaml
kubectl apply -f storage.yaml

# Deploy the application
kubectl apply -f app.yaml
kubectl apply -f ingress.yaml
```

## Files Overview

- **`namespace.yaml`**: Creates the `opendrive` namespace
- **`config.yaml`**: ConfigMap and Secret for environment variables
- **`postgres.yaml`**: PostgreSQL database StatefulSet, PVC, and Service
- **`storage.yaml`**: MinIO storage StatefulSet, PVC, and Service
- **`app.yaml`**: Main OpenDrive application Deployment and Service
- **`ingress.yaml`**: Ingress for external access via Traefik
- **`deploy.sh`**: Automated deployment script

## Configuration Notes

### Storage Classes

The manifests use `local-path` storage class (K3s default). If your cluster uses a different storage class, update the `storageClassName` in the PVC definitions.

### SSL/TLS Certificates

The Ingress is configured for HTTPS but doesn't include automatic certificate provisioning. To enable automatic SSL certificates:

1. Install cert-manager in your cluster
2. Uncomment the cert-manager annotations and TLS section in `ingress.yaml`
3. Create a ClusterIssuer for Let's Encrypt

### Resource Limits

The app deployment includes resource requests and limits. Adjust these based on your cluster capacity and application needs.

### Scaling

The main application is configured with 2 replicas. You can scale it using:

```bash
kubectl -n opendrive scale deployment opendrive-app --replicas=3
```

## Monitoring

Check deployment status:

```bash
kubectl -n opendrive get pods,svc,pvc,ingress
```

View application logs:

```bash
kubectl -n opendrive logs -f deployment/opendrive-app
```

Check database logs:

```bash
kubectl -n opendrive logs -f statefulset/postgres
```

## Undeployment

To completely remove OpenDrive from your cluster:

```bash
./undeploy.sh
```

**⚠️ Warning**: This will remove all OpenDrive resources. The script will:

- Remove all deployments, services, and ingress
- Ask for confirmation before deleting persistent volumes (your data)
- Give you the option to preserve or delete stored data
- Clean up the entire `opendrive` namespace

## Differences from Docker Swarm

- **Networking**: Services communicate using Kubernetes DNS (e.g., `db:5432` instead of container names)
- **Load Balancing**: Kubernetes Services provide load balancing instead of Swarm's built-in load balancer
- **Storage**: Uses Persistent Volume Claims instead of Docker volumes
- **Ingress**: Uses Kubernetes Ingress with Traefik instead of Docker Swarm routing mesh
- **Secrets**: Kubernetes Secrets instead of Docker Secrets
- **Scaling**: Use `kubectl scale` instead of `docker service scale`

## Troubleshooting

1. **Pods not starting**: Check logs with `kubectl -n opendrive logs <pod-name>`
2. **Storage issues**: Verify PVCs are bound with `kubectl -n opendrive get pvc`
3. **Network connectivity**: Test service connectivity from within pods
4. **Ingress not working**: Verify your domain DNS points to your K3s cluster nodes
