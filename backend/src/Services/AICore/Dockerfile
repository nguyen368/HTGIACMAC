# Dùng Python nhẹ
FROM python:3.9-slim

WORKDIR /app

# Cài đặt thư viện hệ thống cho AI ---
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy file requirements đã có Pytorch/Tensorflow
COPY requirements.txt .

# Cài đặt thư viện (Pytorch, torchvision, numpy...)
RUN pip install --no-cache-dir -r requirements.txt

# Copy mã nguồn có chức năng kiểm tra GPU/CPU
COPY . .

# Mở cổng 8000 cho Flask
EXPOSE 8000

# Chạy ứng dụng
CMD ["python", "main.py"]
