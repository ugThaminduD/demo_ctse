# Azure Container Apps Deployment

## Why Azure Container Apps
- Managed container orchestration with minimal setup.
- Easy internal service-to-service communication.
- Fits coursework and DevOps requirements without AKS complexity.

## Prerequisites
- Azure account
- Azure CLI installed and logged in
- ACR name (lowercase, unique)

## 1) Create Azure resources
```bash
az group create -n rg-demo-ctse -l eastus
az acr create -g rg-demo-ctse -n <acrName> --sku Basic
az acr login -n <acrName>
az containerapp env create -g rg-demo-ctse -n ca-env-demo -l eastus
```

## 2) Build and push images to ACR
```bash
docker build -t <acrName>.azurecr.io/user-auth-service:latest ./user-auth-service
docker build -t <acrName>.azurecr.io/course-catalog-service:latest ./course-catalog-service
docker build -t <acrName>.azurecr.io/enrollment-service:latest ./enrollment-service
docker build -t <acrName>.azurecr.io/notification-service:latest ./notification-service
docker build -t <acrName>.azurecr.io/api-gateway:latest ./api-gateway

docker push <acrName>.azurecr.io/user-auth-service:latest
docker push <acrName>.azurecr.io/course-catalog-service:latest
docker push <acrName>.azurecr.io/enrollment-service:latest
docker push <acrName>.azurecr.io/notification-service:latest
docker push <acrName>.azurecr.io/api-gateway:latest
```

## 3) Create Container Apps
### Internal apps (services)
```bash
az containerapp create -g rg-demo-ctse -n user-auth-service \
  --image <acrName>.azurecr.io/user-auth-service:latest \
  --environment ca-env-demo \
  --ingress internal --target-port 3001 \
  --registry-server <acrName>.azurecr.io

az containerapp create -g rg-demo-ctse -n course-catalog-service \
  --image <acrName>.azurecr.io/course-catalog-service:latest \
  --environment ca-env-demo \
  --ingress internal --target-port 3002 \
  --registry-server <acrName>.azurecr.io

az containerapp create -g rg-demo-ctse -n enrollment-service \
  --image <acrName>.azurecr.io/enrollment-service:latest \
  --environment ca-env-demo \
  --ingress internal --target-port 3003 \
  --registry-server <acrName>.azurecr.io

az containerapp create -g rg-demo-ctse -n notification-service \
  --image <acrName>.azurecr.io/notification-service:latest \
  --environment ca-env-demo \
  --ingress internal --target-port 3004 \
  --registry-server <acrName>.azurecr.io
```

### External app (gateway)
```bash
az containerapp create -g rg-demo-ctse -n api-gateway \
  --image <acrName>.azurecr.io/api-gateway:latest \
  --environment ca-env-demo \
  --ingress external --target-port 3005 \
  --registry-server <acrName>.azurecr.io
```

## 4) Configure secrets and environment variables
Use secrets for MongoDB URIs, JWT secret, and email creds. Then set env vars.
```bash
az containerapp secret set -g rg-demo-ctse -n user-auth-service \
  --secrets mongoUri=<value> jwtSecret=<value>

az containerapp update -g rg-demo-ctse -n user-auth-service \
  --set-env-vars \
  MONGO_URI=secretref:mongoUri \
  JWT_SECRET=secretref:jwtSecret \
  NOTIFICATION_SERVICE_URL=https://notification-service.<envId>.internal
```
Repeat for the other services. For service URLs, use each app's internal URL from the Azure portal.

## 5) Verify
- Call the API gateway public URL from the Azure portal.
- Ensure each service responds and inter-service calls work.

## Security notes
- Only the gateway is public; services are internal.
- Store secrets in Container Apps (not in code or env files).
- Use ACR and least-privilege access for image pulls.
