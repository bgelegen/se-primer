# Render.com (ücretsiz katman) ya da herhangi bir Docker sunucusu. Model başlangıçta HF'deki commit'e sabit
# URL'den indirilir ve sha256'sı kontrol edilir (app.py).
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT} --proxy-headers --no-access-log"]
