// @ts-ignore
import axiosClient from "./axiosClient";

const billingApi = {
    // Cho Bệnh nhân: Lấy danh sách hóa đơn
    getBillsByPatient: (patientId: string) => {
        return axiosClient.get(`/billing/patient/${patientId}`);
    },

    // Cho Bệnh nhân: Thanh toán
    payBill: (billId: string) => {
        return axiosClient.post(`/billing/pay/${billId}`);
    },

    // --- MỚI: Cho Bác sĩ/Clinic: Tạo hóa đơn ---
    createBill: (data: { patientId: string; items: { serviceName: string; price: number; quantity: number }[] }) => {
        return axiosClient.post('/billing', data);
    }
};

export default billingApi;