#!/bin/bash
# Manual deployment script for Unraid
# Copy-paste this into the Unraid terminal (root@Metron:~#)

set -e
cd /mnt/user/appdata

# 1. Clone the repo (or pull if it exists)
if [ -d "StarcraftTMG/.git" ]; then
  echo "=== Pulling existing repo ==="
  cd StarcraftTMG
  git pull
  cd ..
else
  echo "=== Cloning repo ==="
  rm -rf StarcraftTMG
  git clone https://github.com/desjani/StarcraftTMG.git
fi

# 2. Write .env with Discord credentials
echo "=== Writing .env ==="
cat > StarcraftTMG/.env << 'ENVEOF'
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_guild_id_here
PORT=3000
ENVEOF

# 3. Build and start the container
echo "=== Building and starting Docker container ==="
cd StarcraftTMG
docker compose up -d --build

# 4. Show status
echo ""
echo "=== Container status ==="
docker compose ps

echo ""
echo "✓ Deployment complete!"
echo "  Image server: http://192.168.68.54:3000"
echo "  Discord bot : running (outbound only)"
