import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // Cho phép truy cập từ bên ngoài container (quan trọng nhất)
    port: 5173,       // Cố định cổng 5173
    strictPort: true, // Nếu cổng 5173 bận thì báo lỗi chứ không tự đổi sang cổng khác
    watch: {
      usePolling: true // Bắt buộc khi chạy trên Docker (Windows/Mac) để file tự cập nhật khi sửa code
    }
  }
})