# --- GIAI ĐOẠN 1: BUILD ---
# Sử dụng Node.js để biên dịch mã nguồn React
FROM node:18-alpine AS build

WORKDIR /app

# Sao chép tệp quản lý thư viện trước để tối ưu Docker Layer Caching
COPY package.json yarn.lock* package-lock.json* ./

# Cài đặt thư viện (Tăng timeout để tránh lỗi mạng khi cài đặt)
RUN yarn install --network-timeout 100000 || npm install

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Biên dịch ứng dụng sang các tệp tĩnh (HTML/JS/CSS)
# Lệnh này sẽ kiểm tra lỗi đường dẫn (như lỗi Dashboard/PatientHome.css bạn gặp)
RUN yarn build || npm run build

# --- GIAI ĐOẠN 2: PRODUCTION ---
# Sử dụng Nginx Alpine để phục vụ các tệp đã build với dung lượng siêu nhẹ
FROM nginx:alpine

# Xóa các tệp cấu hình mặc định của Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Sao chép tệp cấu hình Nginx tối ưu (đã sửa hết lag) của bạn vào container
# Vì file nginx.conf của bạn là bản Standalone (có khối http), ta sẽ ghi đè file gốc

COPY nginx.conf /etc/nginx/conf.d/default.conf
# Sao chép kết quả build từ Giai đoạn 1 vào thư mục phục vụ web của Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Mở cổng 80
EXPOSE 80

# Chạy Nginx
CMD ["nginx", "-g", "daemon off;"]