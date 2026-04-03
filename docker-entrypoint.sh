#!/bin/sh
set -e

# Start the Discord bot in background if credentials are present.
# The bot only makes outbound connections to Discord — no inbound port needed.
if [ -n "$DISCORD_TOKEN" ]; then
    echo "[entrypoint] Starting Discord bot..."
    node bot/bot.js &
else
    echo "[entrypoint] DISCORD_TOKEN not set — skipping Discord bot."
fi

echo "[entrypoint] Starting web server on port ${PORT:-3000}..."
exec node web/server.js
