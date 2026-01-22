-- 1. Database cho Medical Record Service (Hồ sơ bệnh án)
CREATE DATABASE aura_medical_db;

-- 2. Database cho Imaging Service (Lưu trữ thông tin ảnh)
CREATE DATABASE aura_imaging_db;

-- 3. Database cho Billing Service (Thanh toán & Hóa đơn)
CREATE DATABASE aura_billing_db;

-- 4. CẤP QUYỀN CHO USER ADMIN (QUAN TRỌNG)
-- Giúp các Service C# có quyền tạo bảng (Migration)
ALTER DATABASE aura_medical_db OWNER TO admin;
ALTER DATABASE aura_imaging_db OWNER TO admin;
ALTER DATABASE aura_billing_db OWNER TO admin;

-- Ghi chú: 
-- Database "aura_identity_db" (Identity Service) không cần dòng lệnh tạo ở đây
-- vì nó đã được tạo tự động bởi dòng "POSTGRES_DB=aura_identity_db" trong file docker-compose.yml.
-- Notification Service và AI Core hiện tại không dùng Database riêng.