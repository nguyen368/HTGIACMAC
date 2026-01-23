import React, { useState } from 'react';
import medicalApi from '../../../../api/medicalApi';

const HardwareSimulator = () => {
  const [deviceId, setDeviceId] = useState("AURA-CAM-01");
  const [patientId, setPatientId] = useState("");
  const [file, setFile] = useState(null);
  const [log, setLog] = useState("");

  const handleCapture = async () => {
    if (!file || !patientId) return alert("Thiếu thông tin");

    const formData = new FormData();
    formData.append("imageFile", file);
    formData.append("deviceId", deviceId);
    formData.append("patientId", patientId);

    try {
      setLog("⏳ Sending data to Server via IoT Protocol...");
      const res = await medicalApi.hardwareCapture(formData);
      setLog(prev => prev + `\n✅ Upload Success! ImageID: ${res.imageId}\n🚀 Triggered AI Analysis.`);
    } catch (err) {
      setLog(prev => prev + `\n❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="container mt-5" style={{maxWidth: '600px'}}>
      <div className="card border-danger">
        <div className="card-header bg-danger text-white">
          🔧 Hardware Simulator (Fundus Camera)
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label>Device ID (Serial):</label>
            <input className="form-control" value={deviceId} onChange={e => setDeviceId(e.target.value)} />
          </div>
          <div className="mb-3">
            <label>Target Patient ID (UUID):</label>
            <input className="form-control" value={patientId} onChange={e => setPatientId(e.target.value)} placeholder="Copy UUID from DB..." />
          </div>
          <div className="mb-3">
            <label>Captured Image (Simulated):</label>
            <input type="file" className="form-control" onChange={e => setFile(e.target.files[0])} />
          </div>
          <button className="btn btn-danger w-100" onClick={handleCapture}>
            📸 SIMULATE CAPTURE & SEND
          </button>
          
          <div className="mt-3 bg-black text-success p-3 font-monospace rounded">
            <pre>{log || "Waiting for command..."}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HardwareSimulator;