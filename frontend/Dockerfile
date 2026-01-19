# Sử dụng Node.js image nhẹ (Alpine)
FROM node:18-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Copy file package để cài thư viện trước (Tận dụng Docker cache)
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ code frontend vào container
COPY . .

# Mở port 3000
EXPOSE 3000

# Lệnh chạy server dev
CMD ["npm", "start"]