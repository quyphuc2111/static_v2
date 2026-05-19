#!/bin/sh
set -e

echo "Running database schema sync..."

# Use db push to sync schema directly (ignores migration history)
# This is safe for fresh databases and avoids P3009 failed migration issues
node ./node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss

echo "Starting application..."
exec node server.js
