import axios from 'axios';

// API qua Gateway (Nginx)
const API_URL = 'http://localhost:8000/api/bills';

export interface BillItem {
    serviceName: string;
    price: number;
    quantity: number;
}

export interface CreateBillRequest {
    patientId: string;
    items: BillItem[];
}

// 1. Lấy danh sách hóa đơn
export const getBills = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error getting bills:", error);
        return [];
    }
};

// 2. [MỚI] Mua gói khám (Tạo hóa đơn mới)
export const createBill = async (data: CreateBillRequest) => {
    try {
        const response = await axios.post(API_URL, data);
        return response.data;
    } catch (error) {
        console.error("Error creating bill:", error);
        throw error;
    }
};

// 3. [MỚI] Thanh toán hóa đơn (Giả lập Payment Gateway)
export const payBill = async (billId: string) => {
    try {
        const response = await axios.post(`${API_URL}/pay/${billId}`);
        return response.data;
    } catch (error) {
        console.error("Error paying bill:", error);
        throw error;
    }
};