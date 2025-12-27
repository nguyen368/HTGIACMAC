# Sử dụng Node 18 Alpine
FROM node:18-alpine

WORKDIR /app

# Copy cả package.json VÀ package-lock.json (nếu có)
COPY package*.json ./

# Cài đặt thư viện
RUN npm install

# Copy toàn bộ code còn lại
COPY . .

# Mở cổng
EXPOSE 5173

# Chạy server
CMD ["npm", "run", "dev", "--", "--host"]