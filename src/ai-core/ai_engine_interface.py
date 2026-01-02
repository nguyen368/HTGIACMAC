import uuid
from datetime import datetime
from abc import ABC, abstractmethod

class BaseEntity:
    def __init__(self):
        self.id = uuid.uuid4()
        self.created_at = datetime.now()

# Định nghĩa thực thể kết quả để lưu vào Database
class AIResultEntity(BaseEntity):
    def __init__(self, diagnosis: str, risk_level: str, confidence: float):
        super().__init__()
        self.diagnosis = diagnosis
        self.risk_level = risk_level
        self.confidence = confidence 

class IAIEngine(ABC):
    @abstractmethod
    def preprocess_input(self, json_data: str):
        pass

    @abstractmethod
    def predict(self):
        pass

    @abstractmethod
    def evaluate_risk(self):
        pass

    @abstractmethod
    def export_output(self) -> AIResultEntity:
              pass