import axios from "axios";

// Instance gọi sang Medical Record Service (Port 5002)
const medicalClient = axios.create({
  baseURL: "http://localhost:5002/api", 
  headers: {
    "Content-Type": "application/json",
  },
});

medicalClient.interceptors.response.use(
  (response) => response.data,
  (error) => { throw error; }
);

const medicalApi = {
  // Lấy danh sách tất cả bệnh nhân
  getAllPatients: () => {
    return medicalClient.get("/patients");
  },
  
  // Lấy chi tiết 1 bệnh nhân
  getPatientById: (id) => {
    return medicalClient.get(`/patients/${id}`);
  }
};

export default medicalApi;