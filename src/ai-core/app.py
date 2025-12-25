from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import random

app = Flask(__name__)
CORS(app) # Cho phép mọi nơi gọi vào (để .NET gọi sang không bị chặn)

# Hàm giả lập AI (Sau này sẽ thay bằng Model thật)
def mock_ai_predict(image_url):
    print(f"--> Đang tải ảnh từ: {image_url}")
    time.sleep(2) # Giả vờ suy nghĩ mất 2 giây
    
    # Giả vờ trả về kết quả ngẫu nhiên
    risk_score = round(random.uniform(0.1, 0.9), 2)
    diagnosis = "Nguy cơ cao" if risk_score > 0.5 else "Bình thường"
    
    return {
        "risk_score": risk_score,
        "diagnosis": diagnosis,
        "metadata": {
            "vessels_count": random.randint(10, 50),
            "anomalies_detected": ["microaneurysm"] if risk_score > 0.5 else []
        }
    }

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        image_url = data.get('image_url')
        
        if not image_url:
            return jsonify({"error": "No image_url provided"}), 400
            
        # Gọi AI xử lý
        result = mock_ai_predict(image_url)
        
        return jsonify({
            "status": "success",
            "data": result
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Chạy ở Port 5001 để không đụng hàng với .NET (Port 5xxx)
    print("AI Core is running on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=True)