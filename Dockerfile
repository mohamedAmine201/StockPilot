# ==========================================
# Stage 1: Build the React application
# ==========================================

FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy dependency files first for better Docker layer caching
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the React application
COPY frontend/ .

# Make the Vite environment variable available during the build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build React
RUN npm run build


# ==========================================
# Stage 2: Django + Gunicorn
# ==========================================

FROM python:3.12-slim

WORKDIR /app/backend

# Prevent Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1

# Send Python output directly to the terminal
ENV PYTHONUNBUFFERED=1

# Copy requirements first for Docker layer caching
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy Django project
COPY backend/ .

# Copy the React production build
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Collect Django and React static files
RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]