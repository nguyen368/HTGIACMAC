import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
// @ts-ignore
import billingApi from '../../../../api/billingApi';
import { useAuth } from '../../../../context/AuthContext';

// Định nghĩa kiểu dữ liệu cho Hóa đơn
interface Bill {
    id: string;
    serviceName?: string; 
    amount: number;
    status: string;
    createdAt: string;
    paidAt?: string;
}

const PatientPayment: React.FC = () => {
    const { user } = useAuth();
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    
    // --- STATE CHO MODAL THANH TOÁN ---
    const [showModal, setShowModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('atm'); // atm, visa, momo, vnpay

    // Format tiền tệ VNĐ
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const fetchBills = async () => {
        if (!user?.id) return;
        try {
            const res: any = await billingApi.getBillsByPatient(user.id);
            setBills(res);
        } catch (error) {
            console.error("Lỗi tải hóa đơn:", error);
            // Dữ liệu giả fallback
            setBills([
                { id: '1', serviceName: 'Khám mắt tổng quát', amount: 200000, status: 'Pending', createdAt: '2026-01-26T10:00:00' },
                { id: '2', serviceName: 'Chụp Retina AI', amount: 500000, status: 'Paid', createdAt: '2026-01-20T09:30:00', paidAt: '2026-01-20T10:00:00' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBills();
    }, [user]);

    // 1. Mở Modal khi bấm nút "Thanh toán"
    const openPaymentModal = (bill: Bill) => {
        setSelectedBill(bill);
        setShowModal(true);
    };

    // 2. Xử lý logic xác nhận thanh toán (Có delay giả lập)
    const handleConfirmPayment = async () => {
        if (!selectedBill) return;
        
        setIsProcessing(true); // Hiển thị loading xoay vòng

        try {
            // Giả lập độ trễ xử lý ngân hàng (1.5 giây) để tạo cảm giác thật
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Gọi API thật xuống Backend
            await billingApi.payBill(selectedBill.id);
            
            toast.success(`🎉 Thanh toán thành công qua ${paymentMethod.toUpperCase()}!`);
            setShowModal(false); // Đóng modal
            fetchBills(); // Load lại danh sách mới nhất
        } catch (error) {
            toast.error("❌ Giao dịch thất bại. Vui lòng thử lại.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="payment-container" style={{ padding: '20px' }}>
            <h2 style={{ color: '#0ea5e9', marginBottom: '20px' }}>Lịch sử Thanh toán & Hóa đơn</h2>

            {/* Thẻ tổng quan */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                <div style={{ flex: 1, background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', padding: '25px', borderRadius: '16px', color: 'white', boxShadow: '0 10px 15px -3px rgba(14,165,233,0.3)' }}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>Tổng dư nợ cần thanh toán</p>
                        <i className="fas fa-wallet" style={{fontSize:'24px', opacity:0.8}}></i>
                    </div>
                    <h2 style={{ margin: '15px 0', fontSize: '32px', fontWeight: '700' }}>
                        {formatCurrency(bills.filter(b => b.status === 'Pending').reduce((sum, b) => sum + b.amount, 0))}
                    </h2>
                    <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>Kỳ thanh toán: Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</p>
                </div>
                
                <div style={{ flex: 1, background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h4 style={{marginTop:0, color:'#64748b'}}>Phương thức ưu tiên</h4>
                    <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
                        {/* Nút MOMO */}
                        <div 
                            onClick={() => setPaymentMethod('momo')}
                            style={{
                                flex:1, 
                                border: paymentMethod === 'momo' ? '2px solid #a50064' : '1px solid #e2e8f0', 
                                background: paymentMethod === 'momo' ? '#fdf2f8' : 'white',
                                padding:'10px', borderRadius:'8px', textAlign:'center', cursor:'pointer', transition: 'all 0.2s'
                            }}
                        >
                            <div style={{fontSize:'12px', fontWeight:'bold', marginTop:'5px', color: paymentMethod === 'momo' ? '#a50064' : '#64748b'}}>MoMo</div>
                        </div>

                        {/* Nút VNPAY */}
                        <div 
                            onClick={() => setPaymentMethod('vnpay')}
                            style={{
                                flex:1, 
                                border: paymentMethod === 'vnpay' ? '2px solid #0ea5e9' : '1px solid #e2e8f0', 
                                background: paymentMethod === 'vnpay' ? '#eff6ff' : 'white',
                                padding:'10px', borderRadius:'8px', textAlign:'center', cursor:'pointer', transition: 'all 0.2s'
                            }}
                        >
                            <i className="fas fa-qrcode" style={{fontSize:'24px', color: paymentMethod === 'vnpay' ? '#0ea5e9' : '#64748b'}}></i>
                            <div style={{fontSize:'12px', fontWeight:'bold', marginTop:'5px', color: paymentMethod === 'vnpay' ? '#0ea5e9' : '#64748b'}}>VNPay</div>
                        </div>

                        {/* Nút VISA */}
                        <div 
                            onClick={() => setPaymentMethod('visa')}
                            style={{
                                flex:1, 
                                border: paymentMethod === 'visa' ? '2px solid #1e293b' : '1px solid #e2e8f0', 
                                background: paymentMethod === 'visa' ? '#f1f5f9' : 'white',
                                padding:'10px', borderRadius:'8px', textAlign:'center', cursor:'pointer', transition: 'all 0.2s'
                            }}
                        >
                            <i className="fab fa-cc-visa" style={{fontSize:'24px', color: paymentMethod === 'visa' ? '#1e293b' : '#64748b'}}></i>
                            <div style={{fontSize:'12px', fontWeight:'bold', marginTop:'5px', color: paymentMethod === 'visa' ? '#1e293b' : '#64748b'}}>Visa</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danh sách hóa đơn */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '25px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                {loading ? <p>Đang tải dữ liệu...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                                <th style={{ padding: '15px' }}>Dịch vụ / Mã đơn</th>
                                <th style={{ padding: '15px' }}>Ngày tạo</th>
                                <th style={{ padding: '15px' }}>Số tiền</th>
                                <th style={{ padding: '15px' }}>Trạng thái</th>
                                <th style={{ padding: '15px', textAlign: 'right' }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bills.length > 0 ? bills.map((bill) => (
                                <tr key={bill.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '15px', fontWeight: '600', color: '#334155' }}>
                                        {bill.serviceName || `Hóa đơn #${bill.id.substring(0, 8)}`}
                                    </td>
                                    <td style={{ padding: '15px', color: '#64748b' }}>
                                        {new Date(bill.createdAt).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td style={{ padding: '15px', fontWeight: 'bold', color: '#0f172a' }}>
                                        {formatCurrency(bill.amount)}
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{
                                            padding: '6px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '700',
                                            background: bill.status === 'Paid' ? '#dcfce7' : '#fff7ed',
                                            color: bill.status === 'Paid' ? '#166534' : '#c2410c',
                                            border: `1px solid ${bill.status === 'Paid' ? '#bbf7d0' : '#fed7aa'}`
                                        }}>
                                            {bill.status === 'Paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'right' }}>
                                        {bill.status === 'Pending' ? (
                                            <button 
                                                onClick={() => openPaymentModal(bill)}
                                                style={{
                                                    background: '#0ea5e9', color: 'white', border: 'none',
                                                    padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                                                    fontWeight: '600', boxShadow: '0 2px 4px rgba(14,165,233,0.3)',
                                                    transition: 'transform 0.1s'
                                                }}
                                            >
                                                Thanh toán
                                            </button>
                                        ) : (
                                            <button disabled style={{ background: '#f1f5f9', color: '#94a3b8', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'not-allowed' }}>
                                                Đã xong
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} style={{textAlign:'center', padding:'40px', color:'#94a3b8'}}>Chưa có hóa đơn nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* === PAYMENT MODAL (POPUP THANH TOÁN) === */}
            {showModal && selectedBill && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{ background: 'white', width: '450px', borderRadius: '16px', padding: '30px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                            <h3 style={{margin:0, color:'#0f172a'}}>Cổng thanh toán AURA</h3>
                            <button onClick={() => setShowModal(false)} style={{background:'none', border:'none', fontSize:'24px', cursor:'pointer', color:'#94a3b8'}}>&times;</button>
                        </div>

                        <div style={{background:'#f8fafc', padding:'15px', borderRadius:'8px', marginBottom:'20px', border:'1px solid #e2e8f0'}}>
                            <p style={{margin:'0 0 5px', fontSize:'13px', color:'#64748b'}}>Thanh toán cho dịch vụ:</p>
                            <p style={{margin:0, fontWeight:'bold', color:'#334155'}}>{selectedBill.serviceName}</p>
                            <div style={{marginTop:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px dashed #cbd5e1', paddingTop:'10px'}}>
                                <span>Tổng tiền:</span>
                                <span style={{fontSize:'18px', fontWeight:'bold', color:'#0ea5e9'}}>{formatCurrency(selectedBill.amount)}</span>
                            </div>
                        </div>

                        <div style={{marginBottom:'20px'}}>
                            <label style={{display:'block', marginBottom:'8px', fontWeight:'500', fontSize:'14px'}}>Phương thức thanh toán:</label>
                            <select 
                                value={paymentMethod} 
                                onChange={e => setPaymentMethod(e.target.value)}
                                style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1'}}
                            >
                                <option value="atm">Thẻ ATM nội địa / Internet Banking</option>
                                <option value="visa">Thẻ quốc tế (Visa/Mastercard)</option>
                                <option value="momo">Ví MoMo</option>
                                <option value="vnpay">VNPAY-QR</option>
                            </select>
                        </div>

                        {/* Form giả lập nhập thẻ khi chọn Visa */}
                        {paymentMethod === 'visa' && (
                            <div style={{marginBottom:'20px', animation:'fadeIn 0.3s'}}>
                                <input placeholder="Số thẻ (4xxx xxxx xxxx xxxx)" style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1', marginBottom:'10px'}} />
                                <div style={{display:'flex', gap:'10px'}}>
                                    <input placeholder="MM/YY" style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1'}} />
                                    <input placeholder="CVC" style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1'}} />
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={handleConfirmPayment}
                            disabled={isProcessing}
                            style={{
                                width: '100%', padding: '12px', background: isProcessing ? '#94a3b8' : '#0ea5e9',
                                color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
                            }}
                        >
                            {isProcessing ? (
                                <><i className="fas fa-circle-notch fa-spin"></i> Đang xử lý giao dịch...</>
                            ) : (
                                `Xác nhận thanh toán ${formatCurrency(selectedBill.amount)}`
                            )}
                        </button>
                        
                        <div style={{textAlign:'center', marginTop:'15px', fontSize:'12px', color:'#94a3b8'}}>
                            <i className="fas fa-lock"></i> Giao dịch được bảo mật bởi AURA Secure Payment
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientPayment;