# --- Stage 1: Build React App (Dùng Node để build code) ---
FROM node:18-alpine as build

WORKDIR /app

# Copy package.json trước để tận dụng cache của Docker
COPY package*.json ./

# Cài đặt dependencies (dùng npm ci để cài chính xác phiên bản trong lock file nếu có)
RUN npm install --legacy-peer-deps

# Copy toàn bộ source code frontend vào
COPY . .

# Thực hiện lệnh build (kết quả sẽ nằm trong thư mục /app/build)
RUN npm run build

# --- Stage 2: Production Server (Dùng Nginx để chạy web) ---
FROM nginx:alpine

# Copy file cấu hình nginx (Bạn cần tạo file này trong thư mục frontend/)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy kết quả build từ Stage 1 sang thư mục chạy web của Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Mở port 80 (Port mặc định của Nginx trong container)
EXPOSE 80

# Chạy Nginx ở chế độ foreground
CMD ["nginx", "-g", "daemon off;"]