from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import time
import random

app = Flask(__name__)
CORS(app) # Cho phép gọi từ nơi khác

#  KIỂM TRA MÔI TRƯỜNG GPU/CPU ---
def get_device_info():
    if torch.cuda.is_available():
        return {"device": "GPU", "name": torch.cuda.get_device_name(0)}
    return {"device": "CPU", "status": "Ready"}

DEVICE_INFO = get_device_info()
# ------------------------------------------------

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy", 
        "service": "AI Core",
        "hardware": DEVICE_INFO
    }), 200

@app.route('/api/ai/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        image_url = data.get('image_url')

        if not image_url:
            return jsonify({"error": "No image_url provided"}), 400

        print(f"🔄 Đang xử lý ảnh: {image_url}...")
        
        # --- KHU VỰC CHẠY MODEL AI (Giả lập) ---
        # Ở đây bạn sẽ load model và predict thật.
        # Hiện tại chúng ta giả vờ sleep 2 giây để giống thật.
        time.sleep(2) 
        
        # Random kết quả để test giao diện
        risk_levels = ["Low", "Medium", "High"]
        result = {
            "riskLevel": random.choice(risk_levels),
            "confidenceScore": round(random.uniform(0.7, 0.99), 2),
            "findings": [
                "Phát hiện điểm xuất huyết nhỏ ở vùng trung tâm",
                "Mạch máu có dấu hiệu co hẹp nhẹ"
            ],
            "recommendation": "Cần theo dõi thêm và tái khám sau 3 tháng.",
            "ai_version": "AURA-v1.0.0" 
        }
        # ---------------------------------------

        print("✅ Xử lý xong!")
        return jsonify(result), 200

    except Exception as e:
        print(f"❌ Lỗi: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Chạy ở cổng 8000
    app.run(host='0.0.0.0', port=8000)