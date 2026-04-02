---
description: How to deploy the application to production
---

# Deployment Workflow

## Prerequisites
- Docker and Docker Compose installed
- Access to deployment environment
- Verified all environment variables are set

## Pre-deployment Checklist
1. Ensure all tests pass
2. Verify database migrations are up to date
3. Check that environment variables are configured
4. Build and test Docker images locally

## Deployment Steps

### 1. Build Docker Images
```bash
docker-compose build
```

### 2. Run Database Migrations
```bash
docker-compose run --rm backend alembic upgrade head
```

### 3. Start Services
```bash
docker-compose up -d
```

### 4. Verify Deployment
```bash
# Check all containers are running
docker-compose ps

# Check backend health
curl http://localhost:8000/health

# Check frontend is accessible
curl http://localhost:3000
```

### 5. Frontend Dev Server (for local development)
// turbo
```bash
cd frontend
npm install
npm run dev
```
The dev server will start at http://localhost:3000

## Rollback Procedure
If issues are detected:
```bash
docker-compose down
docker-compose pull  # Get previous images if using registry
docker-compose up -d
```

## Post-deployment Verification
- [ ] Application loads without errors
- [ ] API endpoints respond correctly
- [ ] Database connections are stable
- [ ] Frontend hot-reload works (in dev mode)
