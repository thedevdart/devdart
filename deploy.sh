#!/usr/bin/env bash
set -euo pipefail
REPO_DIR="/opt/projectocr"
COMPOSE_DIR="/opt/ai-bhai"
echo "==> Pulling latest code"
sudo -u projectocr git -C "$REPO_DIR" pull --ff-only
echo "==> Rebuilding image"
docker compose -f "$COMPOSE_DIR/docker-compose.yml" build projectocr
echo "==> Restarting container"
docker compose -f "$COMPOSE_DIR/docker-compose.yml" up -d projectocr
echo "==> Done. Recent logs:"
docker logs --tail 15 projectocr
