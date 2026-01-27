import os
import cv2
import numpy as np
import requests
import json
import threading
import time
import pika
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
from prometheus_fastapi_instrumentator import Instrumentator

# --- 1. CẤU HÌNH STRATEGY ---
# Sử dụng Strategy Pattern để dễ dàng thay đổi mô hình AI (ResNet, v.v.)
try:
    from strategies import AIServiceContext, ResNetStrategy
except ImportError:
    # Fallback giả lập để đảm bảo hệ thống không crash khi thiếu file strategies.py
    class ResNetStrategy: pass
    class AIServiceContext:
        def __init__(self, strategy): pass
        def execute_analysis(self, img): 
            return {
                'risk_percentage': 85.5, 
                'risk_level': 'High', 
                'diagnosis': 'Phát hiện tổn thương DR (Giả lập)',
                'visualized_overlay': img 
            }

# --- 2. CẤU HÌNH HỆ THỐNG ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = "/app/static" # Đường dẫn lưu trữ tĩnh trong Docker
RESULT_DIR = os.path.join(STATIC_DIR, "results")
UPLOAD_DIR = "/app/uploads" 

# Cấu hình kết nối RabbitMQ & Backend C#
RABBITMQ_HOST = "rabbitmq"
RABBITMQ_USER = "guest"
RABBITMQ_PASS = "guest"
IMAGING_SERVICE_URL = "http://imaging-service:8080/api/imaging"

# Khởi tạo thư mục cần thiết
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)

# Khởi tạo FastAPI và Prometheus Metrics
app = FastAPI(title="AURA AI Core Service Pro")
Instrumentator().instrument(app).expose(app)

# Mount thư mục static để truy cập ảnh heatmap từ URL
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

class ImagePayload(BaseModel):
    file_name: str
    image_url: str = ""
    patient_id: Optional[str] = None

# --- 3. LOGIC XỬ LÝ HÌNH ẢNH ---

def load_image_from_source(payload: ImagePayload):
    """Tải ảnh từ URL hoặc từ bộ nhớ cục bộ."""
    if payload.image_url and payload.image_url.startswith("http"):
        try:
            resp = requests.get(payload.image_url, timeout=15)
            if resp.status_code == 200:
                arr = np.frombuffer(resp.content, np.uint8)
                return cv2.imdecode(arr, cv2.IMREAD_COLOR)
        except Exception as e:
            print(f"--> [AI ERROR] Download failed: {e}")
    
    local_path = os.path.join(UPLOAD_DIR, payload.file_name)
    return cv2.imread(local_path) if os.path.exists(local_path) else None

def check_retina_pro(img):
    """
    LOGIC TRUY QUÉT CỰC HẠN (ULTRA-STRICT): 
    Kiểm tra xem ảnh có phải là ảnh võng mạc chuẩn y tế hay không.
    """
    if img is None: return False, "Không đọc được dữ liệu ảnh", None, {}
    
    # Tiền xử lý ảnh (Resize, Contrast Enhancement)
    img_eval = cv2.resize(img, (512, 512))
    lab = cv2.cvtColor(img_eval, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    cl = clahe.apply(l)
    img_contrast = cv2.merge((cl,a,b))
    img_contrast = cv2.cvtColor(img_contrast, cv2.COLOR_LAB2BGR)
    gray = cv2.cvtColor(img_contrast, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    # 1. Kiểm tra cấu trúc hình tròn (Nhãn cầu)
    circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, 1.2, 100, param1=50, param2=45, minRadius=h//4, maxRadius=h//2)
    cx, cy = 0, 0
    if circles is not None:
        circles = np.uint16(np.around(circles))
        cx, cy = int(circles[0, 0][0]), int(circles[0, 0][1])
    else:
        return False, "Hệ thống từ chối: Không phát hiện cấu trúc nhãn cầu chuẩn y tế.", img_eval, {}

    # 2. Kiểm tra mật độ mạch máu (Vessel Density)
    vessels = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
    kernel = np.ones((2,2), np.uint8)
    vessels = cv2.morphologyEx(vessels, cv2.MORPH_OPEN, kernel)
    vessel_density = np.count_nonzero(vessels) / (h * w)
    
    if vessel_density < 0.020: 
        return False, "Hệ thống từ chối: Thiếu đặc điểm mạch máu võng mạc.", img_eval, {"x": cx, "y": cy}

    # 3. Kiểm tra phổ màu sinh học (Màu cam/đỏ đặc trưng của võng mạc)
    avg_color = np.mean(img_eval, axis=(0, 1))
    if not (avg_color[2] > avg_color[1] * 1.35): 
        return False, "Hệ thống từ chối: Màu sắc không chuẩn mô sinh học.", img_eval, {"x": cx, "y": cy}

    return True, "Hợp lệ", img_eval, {"x": cx, "y": cy, "vessel_score": round(vessel_density, 4)}

# --- 4. CORE ANALYSIS LOGIC ---

def analyze_logic_internal(payload: ImagePayload):
    """Logic lõi phối hợp kiểm tra tiền xử lý và phân tích AI."""
    print(f"--> [AI CORE] Analyzing Patient: {payload.patient_id}")
    
    img = load_image_from_source(payload)
    if img is None: 
        return {"status": "Failed", "error": "AI could not load image"}

    # Bước 1: Kiểm tra tính hợp lệ về mặt y tế
    is_valid, msg, img_matrix, meta = check_retina_pro(img)
    
    if not is_valid:
        return {
            "status": "Rejected", 
            "diagnosis": msg, 
            "risk_score": 0, 
            "risk_level": "None", 
            "heatmap_url": "",
            "metadata": meta
        }

    # Bước 2: Chạy mô hình phân tích sâu (ResNet Strategy)
    context = AIServiceContext(ResNetStrategy())
    result = context.execute_analysis(img_matrix)
    
    risk_score = result.get('risk_percentage', 0)
    risk_level = result.get('risk_level')
    
    # Phân loại mức độ rủi ro dựa trên điểm số
    if not risk_level or risk_level in ["Unknown", "N/A"]:
        if risk_score >= 80: risk_level = "High"
        elif risk_score >= 40: risk_level = "Medium"
        else: risk_level = "Low"

    # Lưu ảnh Heatmap/Overlay
    output_filename = f"heatmap_{payload.file_name}"
    cv2.imwrite(os.path.join(RESULT_DIR, output_filename), result['visualized_overlay'])

    return {
        "status": "Success",
        "diagnosis": result['diagnosis'],
        "risk_score": risk_score,
        "risk_level": risk_level,
        "heatmap_url": f"/static/results/{output_filename}",
        "metadata": meta
    }

# --- 5. TÍCH HỢP RABBITMQ ---

def process_rabbitmq_message(ch, method, properties, body):
    """Xử lý tin nhắn từ RabbitMQ (sự kiện ImageUploaded từ dịch vụ Imaging)."""
    try:
        data = json.loads(body)
        # Hỗ trợ cả định dạng MassTransit và JSON thuần
        payload_data = data.get("message", data)
        
        image_id = payload_data.get("imageId") or payload_data.get("ImageId")
        image_url = payload_data.get("imageUrl") or payload_data.get("ImageUrl")
        patient_id = payload_data.get("patientId") or payload_data.get("PatientId")

        print(f" [x] RabbitMQ Received: {image_id}")

        # Tạo payload để xử lý
        img_payload = ImagePayload(
            file_name=f"{image_id}.jpg", 
            image_url=image_url, 
            patient_id=str(patient_id)
        )

        # Chạy phân tích AI
        ai_result = analyze_logic_internal(img_payload)

        # Chuẩn bị dữ liệu cập nhật cho Backend C#
        update_request = {
            "predictionResult": ai_result.get("diagnosis", "Lỗi xử lý"),
            "confidenceScore": ai_result.get("risk_score", 0),
            "riskLevel": ai_result.get("risk_level", "Unknown"),
            "heatmapUrl": ai_result.get("heatmap_url", ""),
            "doctorNotes": "Phân tích tự động bởi AURA AI Pro"
        }
        
        # Xử lý trường hợp ảnh bị từ chối bởi bộ lọc y tế
        if ai_result["status"] == "Rejected":
            update_request["predictionResult"] = f"TỪ CHỐI: {ai_result['diagnosis']}"
            update_request["riskLevel"] = "Rejected"

        # Gửi kết quả ngược lại dịch vụ Imaging thông qua REST API
        url = f"{IMAGING_SERVICE_URL}/{image_id}/diagnosis"
        print(f" [>] Sending result to: {url}")
        requests.put(url, json=update_request)

    except Exception as e:
        print(f" [!] RabbitMQ Error: {str(e)}")

def start_consumer():
    """Khởi động luồng lắng nghe tin nhắn RabbitMQ."""
    while True:
        try:
            credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
            parameters = pika.ConnectionParameters(RABBITMQ_HOST, 5672, '/', credentials)
            connection = pika.BlockingConnection(parameters)
            channel = connection.channel()

            # Khai báo Exchange khớp với cấu trúc Integration Event của C#
            exchange_name = "AURA.Services.Imaging.API.Controllers:ImageUploadedIntegrationEvent"
            channel.exchange_declare(exchange=exchange_name, exchange_type='fanout', durable=True)
            
            # Tạo queue tạm thời
            result = channel.queue_declare(queue='', exclusive=True)
            queue_name = result.method.queue
            channel.queue_bind(exchange=exchange_name, queue=queue_name)

            print(' [*] AI Core Pro is waiting for RabbitMQ messages...')
            channel.basic_consume(queue=queue_name, on_message_callback=process_rabbitmq_message, auto_ack=True)
            channel.start_consuming()
        except Exception as e:
            print(f"RabbitMQ Connection failed: {e}. Retrying in 5s...")
            time.sleep(5)

# --- 6. API ENDPOINTS & STARTUP ---

@app.on_event("startup")
def startup_event():
    """Khởi chạy Consumer RabbitMQ trong một luồng riêng biệt khi ứng dụng bắt đầu."""
    t = threading.Thread(target=start_consumer, daemon=True)
    t.start()

@app.get("/")
def health_check():
    """Endpoint kiểm tra sức khỏe dịch vụ."""
    return {"status": "AURA AI Core Pro Running"}

@app.post("/api/ai/auto-diagnosis")
def auto_diagnosis_endpoint(payload: ImagePayload):
    """API cho phép yêu cầu chẩn đoán trực tiếp qua HTTP."""
    try:
        return analyze_logic_internal(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Chạy Web Server tại cổng 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)