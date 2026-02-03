import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { getBills, createBill, payBill } from '../../../../services/billingService';
import './PaymentPage.css'; // (Tạo file CSS bên dưới)

// Danh sách gói khám giả lập (Hardcode cho UI)
const SERVICE_PACKAGES = [
    { id: 1, name: "Gói Khám Mắt Cơ Bản", price: 50000, desc: "Sàng lọc DR cơ bản bằng AI" },
    { id: 2, name: "Gói Khám Mắt Chuyên Sâu", price: 150000, desc: "Sàng lọc + Tư vấn bác sĩ + Báo cáo PDF" },
    { id: 3, name: "Gói Theo Dõi 1 Năm", price: 500000, desc: "Không giới hạn số lần upload ảnh" }
];

const PaymentPage: React.FC = () => {
    const { user } = useAuth();
    const [bills, setBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Load danh sách hóa đơn của tôi
    const fetchMyBills = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getBills();
            // Lọc hóa đơn của user hiện tại (Logic lọc nên làm ở Backend, tạm thời filter ở FE)
            const myBills = data.filter((b: any) => b.patientId === user.id);
            setBills(myBills);
        } catch (error) {
            alert("Lỗi tải hóa đơn");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyBills();
    }, [user]);

    // Xử lý: MUA GÓI
    const handleBuyPackage = async (pkg: any) => {
        if (!user) return;
        const confirm = window.confirm(`Bạn muốn mua "${pkg.name}" giá ${pkg.price.toLocaleString()} VNĐ?`);
        if (!confirm) return;

        try {
            await createBill({
                patientId: user.id, // ID lấy từ Token
                items: [{
                    serviceName: pkg.name,
                    price: pkg.price,
                    quantity: 1
                }]
            });
            alert("Đăng ký gói thành công! Vui lòng thanh toán hóa đơn.");
            fetchMyBills(); // Reload lại list bill
        } catch (e) {
            alert("Lỗi khi tạo giao dịch.");
        }
    };

    // Xử lý: THANH TOÁN
    const handlePay = async (billId: string) => {
        const confirm = window.confirm("Xác nhận thanh toán qua ví giả lập?");
        if (!confirm) return;

        try {
            await payBill(billId);
            alert("Thanh toán thành công! Dịch vụ đã được kích hoạt.");
            fetchMyBills();
        } catch (e) {
            alert("Thanh toán thất bại.");
        }
    };

    return (
        <div className="payment-container animate-fade-in">
            <h2 className="page-title">💰 Dịch vụ & Thanh toán</h2>
            
            {/* PHẦN 1: MUA GÓI */}
            <div className="section-block">
                <h3>Chọn gói dịch vụ</h3>
                <div className="package-grid">
                    {SERVICE_PACKAGES.map(pkg => (
                        <div key={pkg.id} className="package-card">
                            <div className="pkg-name">{pkg.name}</div>
                            <div className="pkg-price">{pkg.price.toLocaleString()} đ</div>
                            <div className="pkg-desc">{pkg.desc}</div>
                            <button className="buy-btn" onClick={() => handleBuyPackage(pkg)}>
                                Đăng ký ngay
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* PHẦN 2: HÓA ĐƠN CỦA TÔI */}
            <div className="section-block" style={{marginTop: '30px'}}>
                <h3>Hóa đơn của bạn</h3>
                {loading ? <p>Đang tải...</p> : (
                    <div className="bill-list">
                        {bills.length === 0 && <p className="empty-text">Bạn chưa có hóa đơn nào.</p>}
                        {bills.map((bill: any) => (
                            <div key={bill.id} className={`bill-item ${bill.status}`}>
                                <div className="bill-info">
                                    <div><b>Mã GD:</b> {bill.id.substring(0,8)}...</div>
                                    <div><b>Ngày tạo:</b> {new Date(bill.createdAt).toLocaleDateString()}</div>
                                    <div className="bill-total">{bill.totalAmount?.toLocaleString()} đ</div>
                                </div>
                                <div className="bill-action">
                                    <span className={`status-badge ${bill.status}`}>
                                        {bill.status === 'Paid' ? 'Đã Thanh Toán' : 'Chờ Thanh Toán'}
                                    </span>
                                    {bill.status !== 'Paid' && (
                                        <button className="pay-now-btn" onClick={() => handlePay(bill.id)}>
                                            Thanh toán
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentPage;