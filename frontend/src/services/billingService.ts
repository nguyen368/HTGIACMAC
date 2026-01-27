import axios from 'axios';

// ĐÃ SỬA: Trỏ về Gateway (cổng 80 mặc định) thay vì cổng 5004
// Nginx sẽ tự động chuyển tiếp request này đến Billing Service
const API_URL = 'http://localhost/api/bills';

export const getBills = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách hóa đơn:", error);
        return [];
    }
};