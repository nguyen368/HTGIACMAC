import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import medicalApi from '../../../../api/medicalApi';
import { PatientProfile as IPatientProfile, Clinic } from '../../../../types/medical';
import './PatientProfile.css';

const PatientProfile: React.FC = () => {
    const [profile, setProfile] = useState<IPatientProfile>({
        fullName: '',
        dateOfBirth: '',
        gender: '',
        phoneNumber: '',
        address: '',
        clinicId: '',
        medicalHistory: {
            hasDiabetes: false,
            hasHypertension: false,
            smokingStatus: 'never',
            yearsOfDiabetes: 0
        }
    });

    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const clinicData = await medicalApi.getClinics();
                setClinics(clinicData || []);

                const data = await medicalApi.getPatientProfile();
                if (data) {
                    // Xử lý ngày tháng: Cắt bỏ phần giờ phút để hiện đúng trên input type="date"
                    const formattedDate = data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '';
                    
                    setProfile({
                        fullName: data.fullName || '',
                        dateOfBirth: formattedDate,
                        gender: data.gender || '',
                        phoneNumber: data.phoneNumber || '',
                        address: data.address || '',
                        clinicId: data.clinicId || '',
                        medicalHistory: data.medicalHistory || {
                            hasDiabetes: false,
                            hasHypertension: false,
                            smokingStatus: 'never',
                            yearsOfDiabetes: 0
                        }
                    });
                }
            } catch (error: any) {
                if (error.response && error.response.status === 404) {
                    console.log("Chưa có hồ sơ, tạo mới.");
                } else {
                    setMessage({ type: 'error', text: 'Lỗi kết nối. Vui lòng thử lại sau.' });
                }
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!profile.clinicId) {
            setMessage({ type: 'error', text: 'Vui lòng chọn phòng khám đăng ký.' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        // [FIX QUAN TRỌNG] Tạo payload sạch sẽ trước khi gửi
        const payload = {
            ...profile,
            // Đảm bảo ngày sinh đúng chuẩn YYYY-MM-DD
            dateOfBirth: profile.dateOfBirth, 
            
            medicalHistory: {
                // 1. Logic ép kiểu an toàn
                hasDiabetes: Boolean(profile.medicalHistory?.hasDiabetes),
                hasHypertension: Boolean(profile.medicalHistory?.hasHypertension),
                
                // 2. Logic nghiệp vụ: Nếu không bị tiểu đường thì số năm BẮT BUỘC phải là 0
                // (Tránh trường hợp người dùng nhập số năm rồi bỏ tick tiểu đường)
                yearsOfDiabetes: profile.medicalHistory?.hasDiabetes 
                    ? Number(profile.medicalHistory.yearsOfDiabetes) 
                    : 0, 
                
                // 3. Đảm bảo string hợp lệ
                smokingStatus: profile.medicalHistory?.smokingStatus || 'never'
            }
        };

        console.log("DATA GỬI ĐI (Đã làm sạch):", payload); // [DEBUG] Xem trong F12 Console

        try {
            await medicalApi.updateProfile(payload);
            setMessage({ type: 'success', text: '✅ Hồ sơ sức khỏe đã được cập nhật thành công!' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        } catch (error: any) {
            console.error("LỖI API:", error.response); 
            const errorResponse = error.response?.data;
            let errorMsg = 'Không thể lưu hồ sơ. Vui lòng kiểm tra lại dữ liệu.';

            if (errorResponse?.errors) {
                // Lấy thông báo lỗi chi tiết từ Backend
                errorMsg = Array.isArray(errorResponse.errors) 
                    ? errorResponse.errors[0] 
                    : Object.values(errorResponse.errors)[0] as string;
            } else if (errorResponse?.detail) {
                errorMsg = errorResponse.detail;
            }
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    if (loading && !profile.fullName && clinics.length === 0) {
        return <div className="profile-loading-box"><div className="loader"></div><p>Đang tải dữ liệu...</p></div>;
    }

    return (
        <div className="profile-container animate-fade-in">
            <div className="profile-header">
                <h3>Hồ sơ sức khỏe cá nhân</h3>
                <p className="subtitle">Thông tin cung cấp dữ liệu lâm sàng cho AI phân tích võng mạc</p>
            </div>
            
            {message.text && (
                <div className={`alert-banner ${message.type}`}>
                    <i className={message.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'}></i>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-grid">
                    <div className="form-section">
                        <h4 className="section-title"><i className="fas fa-id-card"></i> Thông tin cơ bản</h4>
                        
                        <div className="form-group">
                            <label>Họ và tên</label>
                            <input type="text" value={profile.fullName} onChange={(e) => setProfile({...profile, fullName: e.target.value})} required />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Ngày sinh</label>
                                <input type="date" value={profile.dateOfBirth} onChange={(e) => setProfile({...profile, dateOfBirth: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Giới tính</label>
                                <select value={profile.gender} onChange={(e) => setProfile({...profile, gender: e.target.value})} required>
                                    <option value="">-- Chọn --</option>
                                    <option value="Male">Nam</option>
                                    <option value="Female">Nữ</option>
                                    <option value="Other">Khác</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Số điện thoại</label>
                            <input type="tel" value={profile.phoneNumber} onChange={(e) => setProfile({...profile, phoneNumber: e.target.value})} required />
                        </div>

                        <div className="form-group">
                            <label>Phòng khám theo dõi</label>
                            <select value={profile.clinicId} onChange={(e) => setProfile({...profile, clinicId: e.target.value})} required className="clinic-select-highlight">
                                <option value="">-- Chọn phòng khám --</option>
                                {clinics.map((clinic) => (
                                    <option key={clinic.id} value={clinic.id}>🏥 {clinic.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-section highlight-section">
                        <h4 className="section-title"><i className="fas fa-stethoscope"></i> Tiền sử lâm sàng</h4>
                        
                        <div className="medical-checkbox-group">
                            <div className="custom-check">
                                <input 
                                    type="checkbox" 
                                    id="diabetes"
                                    checked={profile.medicalHistory?.hasDiabetes}
                                    onChange={(e) => setProfile({
                                        ...profile, 
                                        medicalHistory: {...profile.medicalHistory!, hasDiabetes: e.target.checked}
                                    })} 
                                />
                                <label htmlFor="diabetes">Có bệnh lý Tiểu đường</label>
                            </div>

                            {profile.medicalHistory?.hasDiabetes && (
                                <div className="sub-input animate-slide-down">
                                    <label>Số năm đã mắc bệnh:</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        placeholder="Nhập số năm..."
                                        value={profile.medicalHistory.yearsOfDiabetes}
                                        onChange={(e) => setProfile({
                                            ...profile, 
                                            medicalHistory: {...profile.medicalHistory!, yearsOfDiabetes: parseInt(e.target.value) || 0}
                                        })}
                                    />
                                </div>
                            )}

                            <div className="custom-check mt-3">
                                <input 
                                    type="checkbox" 
                                    id="hypertension"
                                    checked={profile.medicalHistory?.hasHypertension}
                                    onChange={(e) => setProfile({
                                        ...profile, 
                                        medicalHistory: {...profile.medicalHistory!, hasHypertension: e.target.checked}
                                    })} 
                                />
                                <label htmlFor="hypertension">Cao huyết áp</label>
                            </div>
                        </div>

                        <div className="form-group mt-3">
                            <label>Thói quen hút thuốc</label>
                            <select 
                                value={profile.medicalHistory?.smokingStatus}
                                onChange={(e) => setProfile({
                                    ...profile, 
                                    medicalHistory: {...profile.medicalHistory!, smokingStatus: e.target.value as any}
                                })}
                            >
                                <option value="never">Không bao giờ</option>
                                <option value="former">Đã từng (Hiện đã bỏ)</option>
                                <option value="current">Đang hút thuốc</option>
                            </select>
                        </div>

                        <div className="form-group mt-3">
                            <label>Địa chỉ thường trú</label>
                            <textarea rows={2} value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} required />
                        </div>
                    </div>
                </div>

                <div className="form-actions-fixed">
                    <button type="submit" className="save-btn-large" disabled={loading}>
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
                        {loading ? ' ĐANG LƯU HỒ SƠ...' : ' CẬP NHẬT DỮ LIỆU SỨC KHỎE'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PatientProfile;