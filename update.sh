#!/bin/sh
set -e

cd /mnt/user/appdata/StarcraftTMG

echo "[update] Pulling latest code..."
git pull

echo "[update] Building image..."
docker build -t starcraft-tmg:latest .

echo "[update] Recreating container..."
docker rm -f starcraft-tmg 2>/dev/null || true
docker run -d \
  --name starcraft-tmg \
  --restart unless-stopped \
  --shm-size=256m \
  --env-file /mnt/user/appdata/StarcraftTMG/.env \
  -p 3000:3000 \
  starcraft-tmg:latest

echo "[update] Recent logs:"
docker logs --tail 80 starcraft-tmg

echo "[update] Done."
