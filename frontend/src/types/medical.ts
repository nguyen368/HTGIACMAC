export interface MedicalHistory {
    hasDiabetes: boolean;
    hasHypertension: boolean;
    smokingStatus: 'never' | 'former' | 'current';
    yearsOfDiabetes: number;
}

export interface PatientProfile {
    id?: string;
    fullName: string;
    dateOfBirth: string;
    gender: string;
    phoneNumber: string;
    address: string;
    clinicId: string;
    medicalHistory?: MedicalHistory;
}

export interface Clinic {
    id: string;
    name: string;
    address: string;
}

export interface Examination {
    id: string;
    patientId: string;
    patientName?: string;
    examDate: string;
    imageUrl: string;
    heatmapUrl?: string;
    aiDiagnosis?: string;
    aiRiskLevel: 'Low' | 'Medium' | 'High' | 'Invalid';
    aiRiskScore: number;
    status: 'Pending' | 'Analyzed' | 'Verified' | 'Rejected';
    doctorNotes?: string;
    diagnosisResult?: string;
    result?: string; // Trường này dùng cho kết luận hiển thị
}

export interface ClinicStats {
    summary: {
        totalPatients: number;
        totalScans: number;
        pendingExams: number;
        highRiskCases: number;
    };
    recentActivity: Examination[];
}