# GIAI ĐOẠN 1: Build React App
FROM node:18-alpine as build

WORKDIR /app

# Copy file package
COPY package*.json ./

# Xóa file lock cũ và cài đặt lại sạch sẽ (QUAN TRỌNG)
RUN rm -rf package-lock.json node_modules
RUN npm install --legacy-peer-deps

# Copy toàn bộ code
COPY . .

# Bỏ qua lỗi cảnh báo (Warning) từ ESLint để đảm bảo build thành công
ENV CI=false

RUN npm run build

# GIAI ĐOẠN 2: Chạy sản phẩm bằng Nginx (Cực nhẹ)
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]