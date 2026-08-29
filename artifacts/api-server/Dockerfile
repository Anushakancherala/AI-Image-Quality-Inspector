FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
COPY artifacts/api-server/app /app/app
COPY ml /app/ml
COPY samples /app/samples
COPY models /app/models
COPY evaluation /app/evaluation

ENV SQLITE_PATH=/app/data/analyses.db
EXPOSE 5000
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]