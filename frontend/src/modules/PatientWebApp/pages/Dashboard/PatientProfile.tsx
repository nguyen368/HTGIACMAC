import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import medicalApi from '../../../../api/medicalApi';
import { PatientProfile as IPatientProfile, Clinic } from '../../../../types/medical';
import './PatientProfile.css';

const PatientProfile: React.FC = () => {
    // 1. Khai báo state cho hồ sơ (Sử dụng Interface IPatientProfile để kiểm soát kiểu dữ liệu)
    const [profile, setProfile] = useState<IPatientProfile>({
        fullName: '',
        dateOfBirth: '',
        gender: '',
        phoneNumber: '',
        address: '',
        clinicId: '', // Liên kết với phòng khám
        medicalHistory: {
            hasDiabetes: false,
            hasHypertension: false,
            smokingStatus: 'never',
            yearsOfDiabetes: 0
        }
    });

    // State lưu danh sách phòng khám từ Identity Service
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });

    // 2. Tải dữ liệu ban đầu khi mở trang
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                
                // Bước A: Tải danh sách phòng khám để người dùng chọn
                const clinicData = await medicalApi.getClinics();
                setClinics(clinicData || []);

                // Bước B: Tải hồ sơ hiện tại của bệnh nhân
                const data = await medicalApi.getPatientProfile();
                if (data) {
                    const formattedDate = data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : '';
                    setProfile({
                        fullName: data.fullName || '',
                        dateOfBirth: formattedDate,
                        gender: data.gender || '',
                        phoneNumber: data.phoneNumber || '',
                        address: data.address || '',
                        clinicId: data.clinicId || '',
                        // Cập nhật thêm phần tiền sử bệnh lý nếu đã có trong DB
                        medicalHistory: data.medicalHistory || {
                            hasDiabetes: false,
                            hasHypertension: false,
                            smokingStatus: 'never',
                            yearsOfDiabetes: 0
                        }
                    });
                }
            } catch (error: any) {
                // Nếu lỗi 404 (Chưa có hồ sơ) thì bỏ qua, người dùng sẽ tạo mới
                if (error.response && error.response.status === 404) {
                    console.log("Thông báo: Bạn chưa có hồ sơ y tế. Vui lòng điền thông tin để tạo mới.");
                } else {
                    setMessage({ 
                        type: 'error', 
                        text: 'Lỗi kết nối hệ thống. Vui lòng kiểm tra lại Gateway và các dịch vụ.' 
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // 3. Xử lý lưu/cập nhật hồ sơ
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        // Kiểm tra logic: Phải chọn phòng khám mới cho lưu
        if (!profile.clinicId) {
            setMessage({ type: 'error', text: 'Vui lòng chọn phòng khám đăng ký.' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Gọi API UpdateProfile (Gửi toàn bộ object bao gồm medicalHistory)
            await medicalApi.updateProfile(profile);
            
            setMessage({ type: 'success', text: 'Hồ sơ sức khỏe đã được cập nhật thành công!' });
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Tự động ẩn thông báo sau 5 giây
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        } catch (error: any) {
            const errorResponse = error.response?.data;
            let errorMsg = 'Không thể lưu hồ sơ. Vui lòng kiểm tra lại dữ liệu.';

            if (errorResponse?.errors) {
                errorMsg = Array.isArray(errorResponse.errors) 
                    ? errorResponse.errors[0] 
                    : Object.values(errorResponse.errors)[0];
            }
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    // Giao diện khi đang tải dữ liệu
    if (loading && !profile.fullName && clinics.length === 0) {
        return (
            <div className="profile-loading-box">
                <div className="loader"></div>
                <p>Đang đồng bộ dữ liệu với hệ thống AURA...</p>
            </div>
        );
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
                    {/* PHẦN 1: THÔNG TIN HÀNH CHÍNH */}
                    <div className="form-section">
                        <h4 className="section-title"><i className="fas fa-id-card"></i> Thông tin cơ bản</h4>
                        
                        <div className="form-group">
                            <label>Họ và tên</label>
                            <input 
                                type="text" 
                                placeholder="Nhập họ và tên đầy đủ"
                                value={profile.fullName} 
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setProfile({...profile, fullName: e.target.value})} 
                                required 
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Ngày sinh</label>
                                <input 
                                    type="date" 
                                    value={profile.dateOfBirth} 
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setProfile({...profile, dateOfBirth: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Giới tính</label>
                                <select 
                                    value={profile.gender} 
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setProfile({...profile, gender: e.target.value})} 
                                    required
                                >
                                    <option value="">-- Chọn --</option>
                                    <option value="Male">Nam</option>
                                    <option value="Female">Nữ</option>
                                    <option value="Other">Khác</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Số điện thoại</label>
                            <input 
                                type="tel" 
                                value={profile.phoneNumber} 
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setProfile({...profile, phoneNumber: e.target.value})} 
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label>Phòng khám theo dõi</label>
                            <select 
                                value={profile.clinicId} 
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setProfile({...profile, clinicId: e.target.value})} 
                                required
                                className="clinic-select-highlight"
                            >
                                <option value="">-- Chọn phòng khám để đăng ký khám --</option>
                                {clinics.map((clinic) => (
                                    <option key={clinic.id} value={clinic.id}>
                                        🏥 {clinic.name} - {clinic.address}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* PHẦN 2: TIỀN SỬ BỆNH LÝ (BỔ SUNG MỚI CHO AI) */}
                    <div className="form-section highlight-section">
                        <h4 className="section-title"><i className="fas fa-stethoscope"></i> Tiền sử lâm sàng</h4>
                        
                        <div className="medical-checkbox-group">
                            <div className="custom-check">
                                <input 
                                    type="checkbox" 
                                    id="diabetes"
                                    checked={profile.medicalHistory?.hasDiabetes}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setProfile({
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
                                        value={profile.medicalHistory.yearsOfDiabetes}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setProfile({
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
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setProfile({
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
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setProfile({
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
                            <textarea 
                                rows={2}
                                value={profile.address} 
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setProfile({...profile, address: e.target.value})} 
                                required 
                            />
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