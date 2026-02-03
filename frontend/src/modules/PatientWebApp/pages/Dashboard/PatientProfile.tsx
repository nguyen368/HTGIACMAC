import React, { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { toast } from 'react-toastify'; // Import toast để thông báo
// @ts-ignore
import medicalApi from '../../../../api/medicalApi';
// @ts-ignore
import imagingApi from '../../../../api/imagingApi'; // Import imagingApi để upload ảnh
// @ts-ignore
import { PatientProfile as IPatientProfile, Clinic } from '../../../../types/medical';
// @ts-ignore
import { useAuth } from '../../../../context/AuthContext';
// Import CSS mới
import './PatientProfile.css';

const PatientProfile: React.FC = () => {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    
    // --- GIỮ NGUYÊN STATE VÀ LOGIC CŨ ---
    const [profile, setProfile] = useState<IPatientProfile & { avatarUrl?: string }>({
        fullName: '',
        dateOfBirth: '',
        gender: '',
        phoneNumber: '',
        address: '',
        clinicId: '',
        avatarUrl: '', // Thêm trường này để lưu URL ảnh (tạm thời ở Frontend)
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

    // --- LOGIC LOAD DATA (GIỮ NGUYÊN) ---
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const clinicData = await medicalApi.getClinics();
                setClinics(clinicData || []);

                const data = await medicalApi.getPatientProfile();
                if (data) {
                    // Xử lý ngày tháng: Cắt bỏ phần giờ phút
                    const formattedDate = data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '';
                    
                    setProfile({
                        fullName: data.fullName || '',
                        dateOfBirth: formattedDate,
                        gender: data.gender || 'Male',
                        phoneNumber: data.phoneNumber || '',
                        address: data.address || '',
                        clinicId: data.clinicId || '',
                        avatarUrl: (data as any).avatarUrl || (data as any).AvatarUrl || '', // Map nếu backend trả về (hoặc để trống)
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

    // --- LOGIC MỚI: XỬ LÝ AVATAR ---
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Preview ảnh ngay lập tức
        const objectUrl = URL.createObjectURL(file);
        setProfile(prev => ({ ...prev, avatarUrl: objectUrl }));

        const userId = (user as any)?.id || (user as any)?.sub;
        
        if (profile.clinicId && userId) {
            try {
                setUploading(true);
                
                // [FIX] Ép kiểu any cho response để tránh lỗi TS2339
                const response: any = await imagingApi.uploadSingle(file, profile.clinicId, userId);
                
                // [FIX] Kiểm tra null an toàn hơn
                // Ưu tiên lấy URL từ các cấu trúc phổ biến
                let realAvatarUrl = "";
                
                if (response?.url) {
                    realAvatarUrl = response.url;
                } else if (response?.data?.url) {
                    realAvatarUrl = response.data.url;
                } else if (response?.imageUrl) {
                    realAvatarUrl = response.imageUrl;
                } else if (typeof response === 'string') {
                    realAvatarUrl = response;
                }

                console.log("🔥 Ảnh đã upload lên Cloud:", realAvatarUrl);

                if (realAvatarUrl) {
                    // Cập nhật state với URL thật
                    setProfile(prev => ({ ...prev, avatarUrl: realAvatarUrl }));

                    // [FIX QUAN TRỌNG] GỌI API LƯU URL VÀO DB NGAY LẬP TỨC
                    const updatePayload = {
                        ...profile,
                        avatarUrl: realAvatarUrl, // Gửi URL mới này xuống Backend
                        dateOfBirth: profile.dateOfBirth,
                        medicalHistory: {
                            hasDiabetes: Boolean(profile.medicalHistory?.hasDiabetes),
                            hasHypertension: Boolean(profile.medicalHistory?.hasHypertension),
                            yearsOfDiabetes: profile.medicalHistory?.hasDiabetes ? Number(profile.medicalHistory.yearsOfDiabetes) : 0,
                            smokingStatus: profile.medicalHistory?.smokingStatus || 'never'
                        }
                    };

                    await medicalApi.updateProfile(updatePayload);
                    toast.success("📸 Đã cập nhật ảnh đại diện thành công!");
                } else {
                    console.warn("Upload thành công nhưng không lấy được URL ảnh", response);
                    toast.warning("Ảnh đã tải lên nhưng chưa lấy được đường dẫn hiển thị.");
                }

            } catch (error) {
                console.error("Lỗi upload/lưu ảnh:", error);
                toast.error("Không thể lưu ảnh đại diện. Vui lòng thử lại.");
            } finally {
                setUploading(false);
            }
        } else {
            toast.warning("Vui lòng cập nhật và lưu thông tin Phòng khám trước khi đổi ảnh.");
        }
    };

    // --- LOGIC SAVE DATA (GIỮ NGUYÊN) ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!profile.clinicId) {
            setMessage({ type: 'error', text: 'Vui lòng chọn phòng khám đăng ký.' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        // Payload clean data
        const payload = {
            ...profile,
            // Gửi kèm avatarUrl hiện tại
            avatarUrl: profile.avatarUrl,
            dateOfBirth: profile.dateOfBirth, 
            medicalHistory: {
                hasDiabetes: Boolean(profile.medicalHistory?.hasDiabetes),
                hasHypertension: Boolean(profile.medicalHistory?.hasHypertension),
                // Logic nghiệp vụ: Không tiểu đường -> số năm = 0
                yearsOfDiabetes: profile.medicalHistory?.hasDiabetes 
                    ? Number(profile.medicalHistory.yearsOfDiabetes) 
                    : 0, 
                smokingStatus: profile.medicalHistory?.smokingStatus || 'never'
            }
        };

        console.log("DATA GỬI ĐI:", payload);

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

    // --- RENDER UI MỚI (DÙNG CẤU TRÚC LAYOUT CỦA CSS MỚI) ---
    
    if (loading && !profile.fullName && clinics.length === 0) {
        return <div className="loading-overlay"><div className="spinner"></div></div>;
    }

    return (
        <div className="profile-layout animate-fade-in">
            <div className="profile-container">
                
                {/* --- CỘT TRÁI: THẺ THÀNH VIÊN (CARD) --- */}
                <div className="profile-sidebar">
                    <div className="profile-card">
                        <div className="card-header-bg"></div>
                        
                        {/* --- AVATAR INTERACTIVE --- */}
                        <div className="avatar-wrapper" onClick={handleAvatarClick} title="Nhấn để đổi ảnh đại diện">
                            {uploading ? (
                                <div className="spinner-sm" style={{borderWidth: '3px'}}></div>
                            ) : profile.avatarUrl ? (
                                <>
                                    <img src={profile.avatarUrl} alt="Avatar" className="avatar-img" />
                                    <div className="avatar-overlay">
                                        <i className="fas fa-camera"></i>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-user avatar-placeholder"></i>
                                    <div className="avatar-overlay">
                                        <i className="fas fa-camera"></i>
                                    </div>
                                </>
                            )}
                            {/* Input ẩn để chọn file */}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{display: 'none'}} 
                                accept="image/*"
                                onChange={handleAvatarChange}
                            />
                        </div>
                        
                        <div style={{padding: '0 20px 20px'}}>
                            <h2 className="profile-name">{profile.fullName || 'Chưa cập nhật tên'}</h2>
                            <span className="profile-role">Bệnh nhân</span>
                            
                            <div style={{marginTop: '15px', color: '#64748b', fontSize: '14px'}}>
                                <p><i className="fas fa-phone"></i> {profile.phoneNumber || '---'}</p>
                                <p style={{marginTop:'5px'}}><i className="fas fa-map-marker-alt"></i> {profile.address || '---'}</p>
                            </div>
                        </div>

                        <div className="profile-stats">
                            <div className="stat-item">
                                <span className="stat-value">
                                    {profile.medicalHistory?.hasDiabetes ? 'Có' : 'Không'}
                                </span>
                                <span className="stat-label">Tiểu đường</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">
                                    {profile.medicalHistory?.hasHypertension ? 'Có' : 'Không'}
                                </span>
                                <span className="stat-label">Huyết áp</span>
                            </div>
                        </div>
                    </div>

                    {/* Thông báo lỗi/thành công hiển thị ở cột trái cho dễ thấy */}
                    {message.text && (
                        <div className={`alert-banner ${message.type}`} style={{marginTop: '20px', padding: '15px', borderRadius: '10px', background: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b', border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`}}>
                            <i className={message.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'}></i> &nbsp;
                            {message.text}
                        </div>
                    )}
                </div>

                {/* --- CỘT PHẢI: FORM CHỈNH SỬA (MAIN CONTENT) --- */}
                <div className="profile-content">
                    <form onSubmit={handleSubmit}>
                        
                        {/* PHẦN 1: THÔNG TIN CÁ NHÂN */}
                        <h3 className="section-title">
                            <i className="fas fa-user-circle" style={{color: '#2563eb'}}></i>
                            Thông tin cá nhân
                        </h3>
                        
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="form-label">Họ và tên</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    value={profile.fullName} 
                                    onChange={(e) => setProfile({...profile, fullName: e.target.value})} 
                                    required 
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Ngày sinh</label>
                                <input 
                                    type="date" 
                                    className="form-input"
                                    value={profile.dateOfBirth} 
                                    onChange={(e) => setProfile({...profile, dateOfBirth: e.target.value})} 
                                    required 
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Giới tính</label>
                                <select 
                                    className="form-input"
                                    value={profile.gender} 
                                    onChange={(e) => setProfile({...profile, gender: e.target.value})} 
                                    required
                                >
                                    <option value="">-- Chọn --</option>
                                    <option value="Male">Nam</option>
                                    <option value="Female">Nữ</option>
                                    <option value="Other">Khác</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Số điện thoại</label>
                                <input 
                                    type="tel" 
                                    className="form-input"
                                    value={profile.phoneNumber} 
                                    onChange={(e) => setProfile({...profile, phoneNumber: e.target.value})} 
                                    required 
                                    placeholder="09xxxxxxx"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phòng khám đăng ký</label>
                                <select 
                                    className="form-input"
                                    value={profile.clinicId} 
                                    onChange={(e) => setProfile({...profile, clinicId: e.target.value})} 
                                    required
                                >
                                    <option value="">-- Chọn phòng khám --</option>
                                    {clinics.map((clinic) => (
                                        <option key={clinic.id} value={clinic.id}>🏥 {clinic.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group full-width">
                                <label className="form-label">Địa chỉ</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    value={profile.address} 
                                    onChange={(e) => setProfile({...profile, address: e.target.value})} 
                                    required 
                                    placeholder="Số nhà, Tên đường, Quận/Huyện..."
                                />
                            </div>
                        </div>

                        {/* PHẦN 2: TIỀN SỬ BỆNH (HIGHLIGHT) */}
                        <h3 className="section-title" style={{marginTop: '30px'}}>
                            <i className="fas fa-heartbeat" style={{color: '#ef4444'}}></i>
                            Tiền sử bệnh lý (Quan trọng)
                        </h3>

                        <div className="form-grid" style={{background: '#fff1f2', padding: '20px', borderRadius: '12px', border: '1px solid #fda4af'}}>
                            
                            {/* Checkbox Tiểu đường */}
                            <div className="form-group full-width">
                                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                    <input 
                                        type="checkbox" 
                                        id="diabetes"
                                        style={{width:'20px', height:'20px'}}
                                        checked={profile.medicalHistory?.hasDiabetes}
                                        onChange={(e) => setProfile({
                                            ...profile, 
                                            medicalHistory: {...profile.medicalHistory!, hasDiabetes: e.target.checked}
                                        })} 
                                    />
                                    <label htmlFor="diabetes" className="form-label" style={{margin:0, fontSize:'15px'}}>Tôi có bệnh lý Tiểu đường</label>
                                </div>
                            </div>

                            {/* Input số năm (Chỉ hiện khi tick tiểu đường) */}
                            {profile.medicalHistory?.hasDiabetes && (
                                <div className="form-group animate-slide-down">
                                    <label className="form-label">Số năm mắc bệnh</label>
                                    <input 
                                        type="number" 
                                        className="form-input"
                                        min="0"
                                        value={profile.medicalHistory.yearsOfDiabetes}
                                        onChange={(e) => setProfile({
                                            ...profile, 
                                            medicalHistory: {...profile.medicalHistory!, yearsOfDiabetes: parseInt(e.target.value) || 0}
                                        })}
                                    />
                                </div>
                            )}

                            {/* Checkbox Huyết áp */}
                            <div className="form-group full-width">
                                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                    <input 
                                        type="checkbox" 
                                        id="hypertension"
                                        style={{width:'20px', height:'20px'}}
                                        checked={profile.medicalHistory?.hasHypertension}
                                        onChange={(e) => setProfile({
                                            ...profile, 
                                            medicalHistory: {...profile.medicalHistory!, hasHypertension: e.target.checked}
                                        })} 
                                    />
                                    <label htmlFor="hypertension" className="form-label" style={{margin:0, fontSize:'15px'}}>Tôi bị Cao huyết áp</label>
                                </div>
                            </div>

                            {/* Select Hút thuốc */}
                            <div className="form-group full-width">
                                <label className="form-label">Thói quen hút thuốc</label>
                                <select 
                                    className="form-input"
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
                        </div>

                        {/* NÚT LƯU */}
                        <div className="action-buttons">
                            <button type="submit" className="btn-save" disabled={loading}>
                                {loading ? (
                                    <><div className="spinner-sm"></div> Đang lưu...</>
                                ) : (
                                    <><i className="fas fa-save"></i> Cập nhật hồ sơ</>
                                )}
                            </button>
                        </div>

                    </form>
                </div>

            </div>
        </div>
    );
};

export default PatientProfile;