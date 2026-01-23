# Dùng Python 3.9 Slim (Nhẹ, ổn định)
FROM python:3.9-slim

WORKDIR /app

# [QUAN TRỌNG] Cài đặt thư viện hệ thống cho OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy và cài đặt thư viện Python
COPY requirements.txt .
# Cài đặt torch bản CPU trước (nhẹ hơn, tránh lỗi mạng)
RUN pip install --default-timeout=1000 --no-cache-dir torch==2.1.1 --index-url https://download.pytorch.org/whl/cpu
# Cài các thư viện còn lại
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt
# Copy source code
COPY . .

# Tạo các thư mục cần thiết
# /app/uploads: Nơi nhận ảnh từ .NET (Shared Volume)
# /app/static/results: Nơi lưu ảnh kết quả AI vẽ đè lên
RUN mkdir -p /app/uploads && mkdir -p /app/static/results

# Mở cổng 8000
EXPOSE 8000

# Chạy server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]