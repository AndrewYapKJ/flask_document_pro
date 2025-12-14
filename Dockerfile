FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=run.py \
    DEBUG=True

# Install Microsoft ODBC Driver 18 + dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        gnupg && \
    curl -sSL -O https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb && \
    dpkg -i packages-microsoft-prod.deb && \
    rm packages-microsoft-prod.deb && \
    apt-get update && \
    ACCEPT_EULA=Y apt-get install -y --no-install-recommends \
        msodbcsql18 \
        unixodbc-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy env and app code
COPY env.sample .env
COPY . .

# Run with Gunicorn (migrations at runtime – see previous advice)
CMD ["gunicorn", "--config", "gunicorn-cfg.py", "run:app"]