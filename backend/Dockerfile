# Stage 1: Runtime dependencies
FROM node:22-alpine AS deps

# Install build dependencies for native modules like 'canvas'
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    pkgconfig \
    cairo-dev \
    pango-dev \
    libjpeg-turbo-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:22-alpine AS builder

# Install build dependencies again for the build stage
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    pkgconfig \
    cairo-dev \
    pango-dev \
    libjpeg-turbo-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:22-alpine
WORKDIR /usr/src/app

# Install runtime libraries needed by 'canvas'
RUN apk add --no-cache \
    cairo \
    pango \
    libjpeg-turbo \
    giflib \
    librsvg \
    pixman

# Copy production dependencies
COPY --from=deps /usr/src/app/node_modules ./node_modules
# Copy built assets
COPY --from=builder /usr/src/app/dist ./dist
# Copy assets and templates
COPY --from=builder /usr/src/app/src/i18n ./src/i18n
COPY --from=builder /usr/src/app/src/mail/mail-templates ./src/mail/mail-templates
# Copy necessary metadata
COPY package*.json ./

# Copy scripts
COPY ./wait-for-it.sh /opt/wait-for-it.sh
COPY ./startup.relational.prod.sh /opt/startup.relational.prod.sh
RUN chmod +x /opt/*.sh && sed -i 's/\r//g' /opt/*.sh

# Create empty .env if not exists
RUN touch .env

EXPOSE 8000
CMD ["/opt/startup.relational.prod.sh"]
