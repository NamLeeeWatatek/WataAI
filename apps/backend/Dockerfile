# Stage 1: Build
FROM node:22-bookworm AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Install all dependencies for building
RUN npm install

COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y bash && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./
RUN touch .env

# Install only production dependencies
RUN npm install --only=production --ignore-scripts && npm install env-cmd

# Copy built assets from builder stage
COPY --from=builder /usr/src/app/dist ./dist
# Copy i18n files
COPY --from=builder /usr/src/app/src/i18n ./i18n
# Copy mail templates if they exist (handling potential path issues)
COPY --from=builder /usr/src/app/src/mail/mail-templates ./src/mail/mail-templates

# Copy necessary scripts
COPY ./wait-for-it.sh /opt/wait-for-it.sh
COPY ./startup.relational.prod.sh /opt/startup.relational.prod.sh
RUN chmod +x /opt/*.sh && sed -i 's/\r//g' /opt/*.sh

CMD ["/opt/startup.relational.prod.sh"]
