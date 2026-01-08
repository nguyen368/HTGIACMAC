import time
import random
from ai_engine_interface import IAIEngine, AIResultEntity

class AIAdapter(IAIEngine):
    def __init__(self):
        # Danh sách kết quả ngẫu nhiên để TV2 và TV3 test giao diện
        self.diagnoses = ["Bình thường", "Loét giác mạc", "Viêm kết mạc", "Rách giác mạc"]
        self.risk_levels = ["Low", "Medium", "High"]

    def preprocess_input(self, json_data):
        print("[AIAdapter] Đã nhận dữ liệu JSON. Đang kiểm tra file ảnh...")

    def predict(self):
        print("[AIAdapter] AI đang phân tích dữ liệu chuyên sâu...")
        # GIẢ LẬP CHỜ 2 GIÂY (Tuần 3)
        time.sleep(2) 

    def evaluate_risk(self):
        print("[AIAdapter] Đang đánh giá mức độ rủi ro...")

    def export_output(self) -> AIResultEntity:
        # TRẢ VỀ TEXT NGẪU NHIÊN
        diag = random.choice(self.diagnoses)
        risk = random.choice(self.risk_levels)
        conf = round(random.uniform(0.75, 0.98), 2)
        
        return AIResultEntity(
            diagnosis=diag,
            risk_level=risk,
            confidence=conf
        )
