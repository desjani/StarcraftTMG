FROM node:22-bookworm-slim

# Install Chromium from Debian repos to avoid external apt repo/key issues.
RUN apt-get update \
    && apt-get install -y chromium ca-certificates fonts-liberation --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Point Puppeteer at the installed browser and skip its bundled download.
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

COPY docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
