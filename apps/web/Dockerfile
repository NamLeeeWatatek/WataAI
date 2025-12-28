FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Copy root package files
COPY package.json package-lock.json ./
# Copy workspace package manifests
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/types/package.json ./packages/types/

# Install all dependencies (including workspace packages)
RUN npm ci

# Copy the rest of the repository
COPY . .

# Build the Next.js app
RUN npm run build

# Expose the port used by Next.js
EXPOSE 3001

# Start the app in production mode
CMD ["npm", "run", "start", "-w", "@wata/web"]
