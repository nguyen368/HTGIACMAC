# Dùng Python 3.10 slim
FROM python:3.10-slim

WORKDIR /app

# --- KHẮC PHỤC LỖI TẠI ĐÂY ---
# Thay 'libgl1-mesa-glx' bằng 'libgl1'
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*
# -----------------------------

# Copy file requirements và cài thư viện python
COPY requirements.txt .
# Tăng timeout lên 1000 giây để tránh lỗi mạng
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

# Copy code
COPY . .

# Mở cổng 5001
EXPOSE 5001

# Chạy server
CMD ["python", "app.py"]