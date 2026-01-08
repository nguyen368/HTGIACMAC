namespace AURA.Services.MedicalRecord.Application.DTOs;

public record AnalysisResultDto(
    Guid Id,
    string DetectedRisk,
    string AnnotatedImageUrl,
    string HeatmapUrl,
    string VascularAbnormalities,
    DateTime AnalyzedAt);

public record MedicalRecordDto(
    Guid Id,
    Guid PatientId,
    string DoctorNotes,
    string FinalDiagnosis,
    bool IsValidatedByDoctor,
    List<AnalysisResultDto> AnalysisHistory);