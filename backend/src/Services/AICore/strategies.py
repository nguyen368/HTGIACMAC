import torch
import torch.nn as nn
from torchvision import models, transforms
import cv2
import numpy as np
import matplotlib.pyplot as plt

class AIServiceContext:
    def __init__(self, strategy):
        self._strategy = strategy

    def execute_analysis(self, image_matrix):
        return self._strategy.analyze(image_matrix)

class ResNetStrategy:
    def __init__(self):
        # 1. Tải mô hình ResNet50 (Pre-trained)
        # Lưu ý: Lần đầu chạy sẽ cần tải weights (~100MB)
        self.model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
        
        # 2. Chỉnh sửa lớp cuối cùng để phù hợp với y tế (3 lớp: Bình thường, Tiểu đường, Tăng huyết áp)
        # Vì chưa train thật, đây là bước giả lập cấu trúc
        num_ftrs = self.model.fc.in_features
        self.model.fc = nn.Linear(num_ftrs, 3) 
        
        self.model.eval() # Chế độ dự đoán (không train)

        # 3. Chuẩn hóa ảnh theo chuẩn ImageNet
        self.preprocess = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    def generate_heatmap(self, image_matrix):
        """
        Tạo bản đồ nhiệt (Heatmap) sử dụng kỹ thuật Grad-CAM giả lập
        (Dựa trên độ tương phản mạch máu để vẽ vùng chú ý)
        """
        # Resize ảnh về kích thước chuẩn
        img = cv2.resize(image_matrix, (224, 224))
        
        # Chuyển sang thang xám để tìm mạch máu
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Tăng độ tương phản (CLAHE) để làm nổi mạch máu
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # Tạo heatmap giả lập dựa trên các vùng mạch máu đậm (nơi thường có tổn thương)
        heatmap = cv2.applyColorMap(enhanced, cv2.COLORMAP_JET)
        
        # Trộn ảnh gốc và heatmap (chồng lớp)
        # alpha=0.6 (ảnh gốc), beta=0.4 (heatmap)
        overlay = cv2.addWeighted(img, 0.6, heatmap, 0.4, 0)
        
        return overlay

    def analyze(self, image_matrix):
        # 1. Xử lý ảnh đầu vào
        input_tensor = self.preprocess(image_matrix)
        input_batch = input_tensor.unsqueeze(0) # Tạo batch

        # 2. Chạy mô hình (Forward pass)
        with torch.no_grad():
            output = self.model(input_batch)
            probabilities = torch.nn.functional.softmax(output[0], dim=0)

        # 3. Giả lập kết quả chẩn đoán (Mockup logic)
        # Trong thực tế, bạn sẽ dùng probabilities thật. 
        # Ở đây ta dùng hàm băm (hash) của ảnh để kết quả luôn cố định với cùng 1 ảnh (nhưng khác nhau giữa các ảnh)
        img_hash = int(np.mean(image_matrix)) 
        
        risk_score = img_hash % 100 # Random từ 0-99 dựa trên độ sáng ảnh
        
        if risk_score < 30:
            diagnosis = "Bình thường (Normal)"
            risk_level = "Low"
        elif risk_score < 70:
            diagnosis = "Nguy cơ: Bệnh võng mạc tiểu đường (DR)"
            risk_level = "Medium"
        else:
            diagnosis = "Nguy cơ cao: Tăng huyết áp võng mạc"
            risk_level = "High"

        # 4. Tạo Heatmap
        visualized_img = self.generate_heatmap(image_matrix)

        return {
            "diagnosis": diagnosis,
            "risk_percentage": risk_score,
            "risk_level": risk_level,
            "visualized_overlay": visualized_img, # Ảnh kết quả để lưu
            "coordinates": [(50, 50), (100, 100)] # Tọa độ giả lập vùng bệnh
        }