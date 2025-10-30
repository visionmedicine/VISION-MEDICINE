# Use a lightweight Node.js image for production builds
FROM node:22-alpine

# Set environment variables early so dependent tooling picks them up
ENV NODE_ENV=production

# Create and use app directory inside the image
WORKDIR /usr/src/app

# Install dependencies separately to leverage Docker layer caching
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
  && npm cache clean --force

# Copy the rest of the backend source code
COPY --chown=node:node . .

# Expose the port used by the Express app
EXPOSE 5000

# Drop privileges before running the app
USER node

# Run the backend server
CMD ["node", "server.js"]
