import React, { useState, useEffect } from "react";
import imagingApi from "../../../../api/imagingApi"; // Chỉnh lại đường dẫn import cho đúng với folder của bạn

const ClinicUploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);

  // ID GIẢ LẬP (Để test trước khi ghép với code Login của TV1)
  const TEST_CLINIC_ID = "d2b51336-6c1c-426d-881e-45051666617a"; // Thay bằng ID thật trong DB của bạn nếu muốn
  const TEST_PATIENT_ID = "a3b51336-6c1c-426d-881e-45051666617b";

  // Xử lý chọn file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith(".zip")) {
      setSelectedFile(file);
    } else {
      alert("Chỉ nhận file .zip!");
    }
  };

  // Xử lý Upload
  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const res = await imagingApi.batchUpload(selectedFile, TEST_CLINIC_ID, TEST_PATIENT_ID);
      alert(res.message || "Thành công!");
      setResults(res.details || []);
      fetchStats(); // Tải lại thống kê
    } catch (err) {
      alert("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Lấy thống kê
  const fetchStats = async () => {
    try {
      const data = await imagingApi.getStats(TEST_CLINIC_ID);
      setStats(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>🏥 Quản Lý Hình Ảnh (Clinic Manager)</h2>

      {/* Phần Thống kê */}
      <div style={{ marginBottom: "20px", padding: "15px", background: "#f0f8ff", borderRadius: "8px" }}>
        <h3>Tổng số ảnh đã xử lý: {stats?.summary?.totalScans || 0}</h3>
      </div>

      {/* Phần Upload */}
      <div style={{ border: "2px dashed #ccc", padding: "20px", textAlign: "center" }}>
        <input type="file" accept=".zip" onChange={handleFileChange} />
        <br /><br />
        <button onClick={handleUpload} disabled={loading || !selectedFile} 
          style={{ padding: "10px 20px", background: loading ? "gray" : "blue", color: "white" }}>
          {loading ? "Đang xử lý..." : "Upload File Zip"}
        </button>
      </div>

      {/* Kết quả */}
      {results.length > 0 && (
        <ul>
          {results.map((r, i) => (
            <li key={i}>{r.fileName} - <a href={r.url} target="_blank">Xem ảnh</a></li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClinicUploadPage;