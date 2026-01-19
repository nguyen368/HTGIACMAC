import React from 'react';

const PatientHome = ({ user, setTab }) => {
    return (
        <div className="dashboard-home">
            {/* Banner Chào Mừng */}
            <div className="welcome-banner" style={{marginBottom: '32px'}}>
                <div className="welcome-content">
                    <h2>Xin chào, {user?.fullName || 'Quý khách'}!</h2>
                    <p style={{opacity: 0.9, marginTop: '8px'}}>
                        Hệ thống AURA MED sử dụng trí tuệ nhân tạo để hỗ trợ sàng lọc sớm các bệnh lý đáy mắt.
                        Vui lòng cập nhật hồ sơ đầy đủ trước khi thực hiện chẩn đoán.
                    </p>
                    {/* Thêm nút tắt để chuyển nhanh sang Upload */}
                    {setTab && (
                        <button 
                            className="btn-save" 
                            style={{marginTop: '20px', background: 'white', color: '#1e293b', border: 'none'}}
                            onClick={() => setTab('upload')}
                        >
                            <i className="fas fa-camera" style={{marginRight: '8px'}}></i> Sàng lọc ngay
                        </button>
                    )}
                </div>
                <i className="fas fa-user-md welcome-decor"></i>
            </div>

            {/* Grid Thông Tin Tham Khảo (Kiến thức thật) */}
            <h3 style={{marginBottom: '20px', color: 'var(--primary-700)'}}>Thông tin y khoa tham khảo</h3>
            
            <div className="input-grid">
                
                {/* Card 1: Bệnh Võng mạc tiểu đường */}
                <div className="pro-card">
                    <div className="card-header" style={{background: '#fff7ed'}}>
                        <h3 style={{color: '#c2410c'}}><i className="fas fa-eye"></i> Bệnh Võng mạc tiểu đường</h3>
                    </div>
                    <div className="form-body">
                        <p style={{marginBottom: '15px', color: 'var(--primary-600)', fontSize: '14px', textAlign: 'justify'}}>
                            Là biến chứng của bệnh tiểu đường gây tổn thương các mạch máu trong võng mạc. 
                            Đây là nguyên nhân hàng đầu gây mù lòa ở người trưởng thành.
                        </p>
                        <div style={{background: '#f8fafc', padding: '12px', borderRadius: '8px'}}>
                            <strong>Triệu chứng nhận biết:</strong>
                            <ul style={{paddingLeft: '20px', marginTop: '5px', fontSize: '13px', color: 'var(--primary-500)'}}>
                                <li>Nhìn mờ, dao động thị lực.</li>
                                <li>Thấy đốm đen hoặc "ruồi bay" trước mắt.</li>
                                <li>Khó phân biệt màu sắc.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Card 2: Quy trình sàng lọc */}
                <div className="pro-card">
                    <div className="card-header" style={{background: '#f0f9ff'}}>
                        <h3 style={{color: '#0369a1'}}><i className="fas fa-robot"></i> Quy trình AI Sàng lọc</h3>
                    </div>
                    <div className="form-body">
                        <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                            <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                                <div style={{width: '30px', height: '30px', borderRadius: '50%', background: '#0ea5e9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>1</div>
                                <div>
                                    <h4 style={{fontSize: '14px'}}>Tải ảnh lên</h4>
                                    <p style={{fontSize: '12px', color: '#64748b'}}>Ảnh chụp đáy mắt chuẩn định dạng JPG/PNG.</p>
                                </div>
                            </div>
                            <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                                <div style={{width: '30px', height: '30px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>2</div>
                                <div>
                                    <h4 style={{fontSize: '14px'}}>Phân tích Deep Learning</h4>
                                    <p style={{fontSize: '12px', color: '#64748b'}}>AI quét tìm tổn thương vi mạch và xuất huyết.</p>
                                </div>
                            </div>
                            <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                                <div style={{width: '30px', height: '30px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>3</div>
                                <div>
                                    <h4 style={{fontSize: '14px'}}>Nhận kết quả</h4>
                                    <p style={{fontSize: '12px', color: '#64748b'}}>Đánh giá mức độ nguy cơ (Bình thường / Cao).</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Lời khuyên */}
                <div className="pro-card full-width">
                    <div className="card-header">
                        <h3><i className="fas fa-heart" style={{color: '#ef4444'}}></i> Lời khuyên bác sĩ</h3>
                    </div>
                    <div className="form-body" style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                        <div style={{flex: 1, minWidth: '250px', background: '#f1f5f9', padding: '16px', borderRadius: '12px'}}>
                            <h4 style={{marginBottom: '8px', color: '#334155'}}>Kiểm soát đường huyết</h4>
                            {/* ĐÃ SỬA LỖI TẠI DÒNG DƯỚI ĐÂY: thay < 7% bằng &lt; 7% */}
                            <p style={{fontSize: '13px', color: '#64748b'}}>
                                Giữ chỉ số HbA1c ở mức an toàn (&lt; 7%) để giảm nguy cơ biến chứng võng mạc.
                            </p>
                        </div>
                        <div style={{flex: 1, minWidth: '250px', background: '#f1f5f9', padding: '16px', borderRadius: '12px'}}>
                            <h4 style={{marginBottom: '8px', color: '#334155'}}>Khám mắt định kỳ</h4>
                            <p style={{fontSize: '13px', color: '#64748b'}}>Bệnh nhân tiểu đường nên soi đáy mắt ít nhất 1 lần/năm ngay cả khi chưa mờ mắt.</p>
                        </div>
                        <div style={{flex: 1, minWidth: '250px', background: '#f1f5f9', padding: '16px', borderRadius: '12px'}}>
                            <h4 style={{marginBottom: '8px', color: '#334155'}}>Lối sống lành mạnh</h4>
                            <p style={{fontSize: '13px', color: '#64748b'}}>Không hút thuốc lá, tập thể dục 30 phút mỗi ngày và ăn nhiều rau xanh.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PatientHome;