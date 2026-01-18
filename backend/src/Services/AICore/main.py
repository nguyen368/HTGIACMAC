from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import time
import random

app = Flask(__name__)
CORS(app)

# --- KIỂM TRA HẠ TẦNG AI (Yêu cầu Init) ---
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"--- [INIT] AI Core ready on: {device.upper()} ---")

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "device": device,
        "torch_version": torch.__version__
    }), 200

# ==========================================================
#VALIDATE EYE IMAGE (Dùng cho Imaging Service C#)
# ==========================================================
@app.route('/api/ai/validate-eye', methods=['POST'])
def validate_eye():
    """
    Nhận ảnh từ C#, kiểm tra xem có phải là mắt hay không.
    """
    try:
        data = request.json
        image_name = data.get('file_name', '').lower()
        image_url = data.get('image_url', '')

        print(f"🔍 AI đang kiểm tra file: {image_name}")

        # Giả lập quét ảnh bằng AI (Deep Learning logic)
        time.sleep(0.5) 

        # LOGIC NHẬN DIỆN (Giả lập cho giai đoạn thiết kế)
        # Nếu tên file chứa các từ khóa không phải mắt, AI sẽ từ chối
        invalid_keywords = ["landscape", "dog", "car", "nature", "food"]
        
        is_eye = True
        message = "Xác nhận đây là ảnh mẫu mắt hợp lệ."

        if any(keyword in image_name for keyword in invalid_keywords):
            is_eye = False
            message = f"Cảnh báo: Ảnh '{image_name}' dường như không phải là mắt (Phát hiện vật thể lạ)."

        return jsonify({
            "is_valid": is_eye,
            "message": message,
            "processed_by": "AI-Core-Validator",
            "device": device
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================================
@app.route('/api/ai/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        image_url = data.get('image_url')
        
        print(f"📸 Đang phân tích bệnh lý cho ảnh: {image_url}...")
        time.sleep(2) 
        
        risk_levels = ["Low", "Medium", "High"]
        result = {
            "riskLevel": random.choice(risk_levels),
            "confidenceScore": round(random.uniform(0.7, 0.99), 2),
            "findings": ["Phát hiện điểm xuất huyết nhỏ", "Mạch máu co hẹp nhẹ"],
            "recommendation": "Cần theo dõi thêm và tái khám sau 3 tháng."
        }
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Chạy ở port 8000 (Đảm bảo C# gọi đúng port này)
    app.run(host='0.0.0.0', port=8000)
