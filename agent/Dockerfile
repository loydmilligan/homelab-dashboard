FROM python:3.11-slim

WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends procps \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir docker
COPY exporter.py .

EXPOSE 9100

CMD ["python", "exporter.py"]
