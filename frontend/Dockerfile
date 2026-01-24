# GIAI ĐOẠN 1: Build mã nguồn React
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
# Bỏ qua lỗi cảnh báo (Warning) từ ESLint để đảm bảo build thành công
ENV CI=false
RUN npm run build

# GIAI ĐOẠN 2: Chạy sản phẩm bằng Nginx (Cực nhẹ)
FROM nginx:alpine
# Copy toàn bộ file tĩnh từ giai đoạn build vào thư mục phục vụ của Nginx
COPY --from=build /app/build /usr/share/nginx/html

# COPY CẤU HÌNH: Ghi đè file nginx.conf tổng của container bằng file chúng ta vừa tạo ở trên
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]