#!/bin/bash
# Phase 7: Monitoring & Operations Setup

echo "Setting up Prometheus + Grafana monitoring..."

# Create monitoring directories
mkdir -p monitoring/{prometheus,grafana}

# Prometheus Configuration
cat > monitoring/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - localhost:9093

rule_files:
  - "rules.yml"

scrape_configs:
  - job_name: 'replio-backend'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['localhost:8000']

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:6379']

  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
EOF

# Alert Rules
cat > monitoring/prometheus/rules.yml << 'EOF'
groups:
  - name: replio_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: increase(replio_errors_total[5m]) > 100
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: HighLatency
        expr: histogram_quantile(0.95, replio_request_duration_seconds) > 1
        for: 5m
        annotations:
          summary: "High API latency"

      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        annotations:
          summary: "PostgreSQL is down"

      - alert: CacheDown
        expr: up{job="redis"} == 0
        for: 1m
        annotations:
          summary: "Redis is down"

      - alert: HighMemoryUsage
        expr: node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes < 0.1
        for: 5m
        annotations:
          summary: "Memory usage above 90%"
EOF

# Docker Compose for monitoring
cat > monitoring/docker-compose.monitoring.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/rules.yml:/etc/prometheus/rules.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'

  node_exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/'
      - '--path.sysfs=/host/sys'

  redis_exporter:
    image: oliver006/redis_exporter:latest
    ports:
      - "9121:9121"
    environment:
      REDIS_ADDR: redis:6379

volumes:
  prometheus_data:
  grafana_data:
EOF

# Health check script
cat > monitoring/health-check.sh << 'EOF'
#!/bin/bash

HEALTHY=0

# Check backend
if curl -sf http://localhost:8000/health > /dev/null; then
  echo "✓ Backend healthy"
  ((HEALTHY++))
else
  echo "✗ Backend down"
fi

# Check database
if pg_isready -h localhost -U replio -d replio_v2 > /dev/null 2>&1; then
  echo "✓ Database healthy"
  ((HEALTHY++))
else
  echo "✗ Database down"
fi

# Check cache
if redis-cli -h localhost ping > /dev/null 2>&1; then
  echo "✓ Cache healthy"
  ((HEALTHY++))
else
  echo "✗ Cache down"
fi

# Check LLM
if curl -sf http://localhost:11434/api/tags > /dev/null; then
  echo "✓ LLM healthy"
  ((HEALTHY++))
else
  echo "✗ LLM down"
fi

echo ""
echo "Healthy services: $HEALTHY/4"

if [ "$HEALTHY" -lt 4 ]; then
  exit 1
fi
EOF

chmod +x monitoring/health-check.sh

echo "✓ Monitoring setup complete"
echo ""
echo "Start monitoring stack:"
echo "  docker-compose -f monitoring/docker-compose.monitoring.yml up -d"
echo ""
echo "Access dashboards:"
echo "  Prometheus: http://localhost:9090"
echo "  Grafana: http://localhost:3001 (admin/admin)"
echo "  AlertManager: http://localhost:9093"
