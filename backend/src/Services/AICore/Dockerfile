# Dùng Python nhẹ
FROM python:3.9-slim

WORKDIR /app

# Copy thư viện và cài đặt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy code
COPY . .

# Mở cổng 8000
EXPOSE 8000

# Chạy app
CMD ["python", "main.py"]