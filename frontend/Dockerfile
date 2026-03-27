# ==========================================
# Frontend Dockerfile - Next.js Application
# ==========================================

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=development

# Expose port
EXPOSE 3000

# Start the development server
CMD ["npm", "run", "dev"]
