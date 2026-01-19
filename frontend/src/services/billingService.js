import axios from 'axios';

// Địa chỉ của Billing Service (Backend)
const API_URL = 'http://localhost:5004/api/Bills';

export const getBills = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách hóa đơn:", error);
        return [];
    }
};