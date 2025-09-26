# GitHub Workflows Setup

This project has two separate deployment pipelines that can run in parallel:

## 🐳 Docker Swarm Deployment (`cd.yaml`)

- **Trigger**: Push to `main` branch
- **Target**: Docker Swarm cluster (current production)
- **URL**: https://drive.ombrage.space
- **Status**: Active production deployment

## ☸️ Kubernetes Deployment (`cd-k8s.yaml`)

- **Trigger**: Push to `main` branch OR manual workflow dispatch
- **Target**: Kubernetes cluster (K3s/K8s)
- **URL**: https://drive-k8s.ombrage.space (separate domain)
- **Status**: Parallel deployment for testing/migration

## Required GitHub Secrets

### Shared Secrets (used by both workflows)

- `PACKAGES_TOKEN`: Container registry access token
- `OAUTH_CLIENT_ID`: OAuth client ID for authentication
- `OAUTH_CLIENT_SECRET`: OAuth client secret

### Docker Swarm Specific (`cd.yaml`)

- `SSH_PRIVATE_KEY`: SSH private key for Docker context
- `SSH_PUBLIC_KEY`: SSH public key for Docker context
- `SSH_HOST`: SSH host for Docker deployment
- `SSH_PORT`: SSH port for Docker deployment
- `SSH_USERNAME`: SSH username for Docker deployment

### Kubernetes Specific (`cd-k8s.yaml`)

- `KUBECONFIG`: Base64 encoded kubeconfig file for K8s access
- `POSTGRES_PASSWORD`: Database password for K8s deployment

## Setting Up Kubernetes Deployment

### 1. Generate kubeconfig

On your K3s cluster, get the kubeconfig:

```bash
# On your K3s server
sudo cat /etc/rancher/k3s/k3s.yaml
```

Encode it in base64:

```bash
cat /etc/rancher/k3s/k3s.yaml | base64 -w 0
```

Add this as the `KUBECONFIG` secret in GitHub.

### 2. Update DNS

Point your Kubernetes domain (`drive-k8s.ombrage.space`) to your K3s cluster's external IP.

### 3. Customize Configuration

Edit the environment variables in `cd-k8s.yaml`:

- `URL` and `HOSTNAME`: Your Kubernetes domain
- `OAUTH_POCKETID_REDIRECT_URL`: Update callback URL for K8s domain

## Deployment Process

### Automatic Deployment

Both workflows trigger automatically on push to `main`:

1. Docker images are built and pushed to the registry
2. Docker Swarm deployment continues as before
3. Kubernetes deployment runs in parallel using the same images

### Manual Kubernetes Deployment

You can trigger the Kubernetes deployment manually:

1. Go to Actions → CD-Kubernetes
2. Click "Run workflow"
3. Choose environment (staging/production)

## Monitoring Deployments

### Docker Swarm (Current Production)

- Monitor through your existing setup
- URL: https://drive.ombrage.space

### Kubernetes (Testing/Migration)

- Check workflow logs in GitHub Actions
- URL: https://drive-k8s.ombrage.space
- Monitor with: `kubectl -n opendrive get pods,svc,ingress`

## Migration Strategy

1. **Phase 1** (Current): Both systems running in parallel

   - Docker Swarm: Production traffic
   - Kubernetes: Testing and validation

2. **Phase 2**: Gradual traffic shift

   - Use DNS or load balancer to split traffic
   - Monitor both deployments

3. **Phase 3**: Full migration
   - Switch DNS to Kubernetes deployment
   - Disable Docker Swarm workflow
   - Update URLs in `cd-k8s.yaml` to production domain

## Troubleshooting

### Kubernetes Deployment Issues

```bash
# Check pod status
kubectl -n opendrive get pods

# Check logs
kubectl -n opendrive logs -f deployment/opendrive-app

# Check events
kubectl -n opendrive get events --sort-by='.lastTimestamp'
```

### Registry Authentication Issues

The workflow automatically creates registry secrets, but if issues persist:

```bash
kubectl -n opendrive delete secret registry-secret
# Workflow will recreate it on next run
```
