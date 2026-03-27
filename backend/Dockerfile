# ==========================================
# Backend Dockerfile - FastAPI Application
# ==========================================

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (for psycopg2)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire app directory
COPY app/ ./app/
COPY init_settings.py .
COPY create_admin.py .

# Set Python path
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8000

# Start the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
