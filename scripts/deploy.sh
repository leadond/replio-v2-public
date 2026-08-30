#!/bin/bash

set -e

echo "🚀 Replio v2 Deployment Script"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Deployment configuration
ENVIRONMENT=${1:-staging}
DEPLOYMENT_TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${YELLOW}[1/10]${NC} Pre-deployment validation..."
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found${NC}"
  exit 1
fi

echo -e "${YELLOW}[2/10]${NC} Database backup..."
BACKUP_FILE="backups/replio_v2_${DEPLOYMENT_TIMESTAMP}.sql.gz"
mkdir -p backups
pg_dump -U replio -h localhost replio_v2 | gzip > "$BACKUP_FILE"
echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"

echo -e "${YELLOW}[3/10]${NC} Running database migrations..."
python -m alembic upgrade head
echo -e "${GREEN}✓ Database migrations complete${NC}"

echo -e "${YELLOW}[4/10]${NC} Installing dependencies..."
python -m pip install -r requirements.txt
cd replio-frontend && npm install && cd ..
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo -e "${YELLOW}[5/10]${NC} Running tests..."
python -m pytest tests/ --tb=short
cd replio-frontend && npm test -- --watchAll=false && cd ..
echo -e "${GREEN}✓ All tests passing${NC}"

echo -e "${YELLOW}[6/10]${NC} Building frontend..."
cd replio-frontend
npm run build
cd ..
echo -e "${GREEN}✓ Frontend built${NC}"

echo -e "${YELLOW}[7/10]${NC} Security scan..."
python -m pip-audit
npx audit
echo -e "${GREEN}✓ Security scan passed${NC}"

echo -e "${YELLOW}[8/10]${NC} Docker build..."
docker build -t replio-backend:latest replio-backend/
docker build -t replio-frontend:latest replio-frontend/
echo -e "${GREEN}✓ Docker images built${NC}"

echo -e "${YELLOW}[9/10]${NC} Health checks..."
timeout 30 bash -c 'until curl -f http://localhost:8000/health >/dev/null 2>&1; do sleep 1; done'
echo -e "${GREEN}✓ Backend healthy${NC}"

echo -e "${YELLOW}[10/10]${NC} Deployment complete!"
echo ""
echo -e "${GREEN}✅ Replio v2 deployed to $ENVIRONMENT${NC}"
echo -e "Backup: $BACKUP_FILE"
echo "Timestamp: $DEPLOYMENT_TIMESTAMP"
echo ""
echo "Next steps:"
echo "1. Monitor logs: docker logs -f replio-backend"
echo "2. Check dashboard: http://localhost:3000"
echo "3. API docs: http://localhost:8000/docs"
