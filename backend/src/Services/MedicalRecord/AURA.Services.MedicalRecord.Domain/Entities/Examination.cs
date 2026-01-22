using AURA.Services.MedicalRecord.Domain.States;
using AURA.Shared.Kernel.Primitives;
using System.ComponentModel.DataAnnotations.Schema;

namespace AURA.Services.MedicalRecord.Domain.Entities;

public class Examination : Entity
{
    // --- 1. Properties ---
    public Guid PatientId { get; private set; }
    public Guid DoctorId { get; set; }
    public Guid ImageId { get; set; }
    public DateTime ExamDate { get; private set; }
    public string Diagnosis { get; set; } = string.Empty;
    public string DoctorNotes { get; set; } = string.Empty;
    public string ImageUrl { get; private set; } = string.Empty;
    public string Status { get; private set; } = "Pending"; 

    public virtual Patient? Patient { get; set; }

    [NotMapped]
    private ExaminationState _state = new PendingState();

    // --- 2. Constructors ---
    public Examination() { }

    public Examination(Guid patientId, Guid imageId, string diagnosis, string notes, Guid doctorId)
    {
        Id = Guid.NewGuid();
        PatientId = patientId;
        ImageId = imageId;
        Diagnosis = diagnosis ?? string.Empty;
        DoctorNotes = notes ?? string.Empty;
        DoctorId = doctorId;
        ExamDate = DateTime.UtcNow;
        ImageUrl = ""; 
        TransitionTo(new VerifiedState()); 
    }

    public Examination(Guid patientId, string imageUrl)
    {
        Id = Guid.NewGuid();
        PatientId = patientId;
        ImageUrl = imageUrl ?? string.Empty;
        ExamDate = DateTime.UtcNow;
        Diagnosis = string.Empty;
        DoctorNotes = string.Empty;
        TransitionTo(new PendingState());
    }

    // --- 3. State Methods ---
    public void TransitionTo(ExaminationState newState)
    {
        _state = newState;
        if (newState is PendingState) Status = "Pending";
        else if (newState is AnalyzedState) Status = "Analyzed";
        else if (newState is VerifiedState) Status = "Verified";
        else if (Status != "Rejected") Status = "Unknown";
    }

    public void LoadState()
    {
        switch (Status)
        {
            case "Pending": _state = new PendingState(); break;
            case "Analyzed": _state = new AnalyzedState(); break;
            case "Verified": _state = new VerifiedState(); break;
            default: _state = new PendingState(); break;
        }
    }

    // --- 4. Business Logic ---
    public void UpdateAiResult(string status, string aiResult)
    {
        if (status == "Rejected")
        {
            this.Status = "Rejected";
            this.Diagnosis = aiResult;
        }
        else
        {
            _state.ProcessAiResult(this, aiResult);
        }
    }

    public void UpdateAiResult(string aiResult)
    {
        _state.ProcessAiResult(this, aiResult);
    }

    public void ConfirmDiagnosis(string doctorNotes, string finalResult)
    {
        _state.VerifyByDoctor(this, doctorNotes, finalResult);
    }
}