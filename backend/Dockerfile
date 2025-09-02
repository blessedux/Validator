# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory at root of monorepo
WORKDIR /app

# Install pnpm globally with specific version
RUN npm install -g pnpm@8.15.4

# Copy the entire monorepo into the image
COPY . .

# Install all dependencies from the root (monorepo context)
RUN pnpm install --no-frozen-lockfile

# Set working directory to backend
WORKDIR /app/backend

# Generate Prisma client
RUN pnpm run db:generate

# Build the backend application
RUN pnpm run build

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 4000

# Set environment to production
ENV NODE_ENV=production

# Start the backend application
CMD ["pnpm", "start"] 