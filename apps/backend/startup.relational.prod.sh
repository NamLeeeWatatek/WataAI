#!/usr/bin/env bash
set -e

/opt/wait-for-it.sh $DATABASE_HOST:${DATABASE_PORT:-5432}
# Run migration using built JS files
npx typeorm migration:run -d dist/database/data-source.js
# Seed is removed for production to prevent data reset
npm run start:prod
