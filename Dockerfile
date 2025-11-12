# ========================
# Stage 1: Build the frontend (React + Vite)
# ========================
FROM node:18 AS frontend-build
WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend code and build
COPY frontend/ ./
RUN npm run build   # produces /app/frontend/dist

# ========================
# Stage 2: Setup backend and ML model
# ========================
FROM node:18 AS backend
WORKDIR /app

# Copy backend dependencies
COPY backend/package*.json ./
RUN npm install

# Copy backend source code (including ml/ folder)
COPY backend/ ./

# Copy frontend built files into backend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Environment setup
ENV NODE_ENV=production
ENV PORT=5000

# Expose backend port
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]

FROM node:18 AS backend
WORKDIR /app

# Install Python
RUN apt-get update && apt-get install -y python3 python3-pip

# Copy backend files
COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Install Python dependencies if you have requirements.txt
RUN if [ -f backend/ml/requirements.txt ]; then pip3 install -r backend/ml/requirements.txt; fi

EXPOSE 5000
CMD ["node", "server.js"]
