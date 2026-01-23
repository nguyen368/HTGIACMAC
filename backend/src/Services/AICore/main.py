import os
import cv2
import numpy as np
import requests
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
from prometheus_fastapi_instrumentator import Instrumentator
from strategies import AIServiceContext, ResNetStrategy

# --- CẤU HÌNH ĐƯỜNG DẪN ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = "/app/static"
RESULT_DIR = os.path.join(STATIC_DIR, "results")
UPLOAD_DIR = "/app/uploads" 

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)

app = FastAPI(title="AURA AI Core Service Pro")
Instrumentator().instrument(app).expose(app)
# Mount thư mục static để bên ngoài có thể truy cập ảnh kết quả
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

class ImagePayload(BaseModel):
    file_name: str
    image_url: str = ""
    patient_id: Optional[str] = None # Thêm field này để log ngữ cảnh

def load_image_from_source(payload: ImagePayload):
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
    Giữ nguyên logic kiểm tra y tế của bạn.
    """
    if img is None: return False, "Không đọc được dữ liệu ảnh", None, {}
    
    img_eval = cv2.resize(img, (512, 512))
    lab = cv2.cvtColor(img_eval, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    cl = clahe.apply(l)
    img_contrast = cv2.merge((cl,a,b))
    img_contrast = cv2.cvtColor(img_contrast, cv2.COLOR_LAB2BGR)
    gray = cv2.cvtColor(img_contrast, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, 1.2, 100, param1=50, param2=45, minRadius=h//4, maxRadius=h//2)
    cx, cy = 0, 0
    if circles is not None:
        circles = np.uint16(np.around(circles))
        cx, cy = int(circles[0, 0][0]), int(circles[0, 0][1])
    else:
        return False, "Hệ thống từ chối: Không phát hiện cấu trúc nhãn cầu chuẩn y tế.", img_eval, {}

    vessels = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
    kernel = np.ones((2,2), np.uint8)
    vessels = cv2.morphologyEx(vessels, cv2.MORPH_OPEN, kernel)
    vessel_density = np.count_nonzero(vessels) / (h * w)
    
    if vessel_density < 0.020: 
        return False, "Hệ thống từ chối: Thiếu đặc điểm mạch máu võng mạc.", img_eval, {"x": cx, "y": cy}

    avg_color = np.mean(img_eval, axis=(0, 1))
    if not (avg_color[2] > avg_color[1] * 1.35): 
        return False, "Hệ thống từ chối: Màu sắc không chuẩn mô sinh học.", img_eval, {"x": cx, "y": cy}

    return True, "Hợp lệ", img_eval, {"x": cx, "y": cy, "vessel_score": round(vessel_density, 4)}

@app.post("/api/ai/auto-diagnosis")
def auto_diagnosis(payload: ImagePayload):
    print(f"--> [AI START] Analyzing for Patient: {payload.patient_id}")
    try:
        img = load_image_from_source(payload)
        if img is None: return {"status": "Failed", "error": "AI could not load image"}

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

        context = AIServiceContext(ResNetStrategy())
        result = context.execute_analysis(img_matrix)
        risk_score = result.get('risk_percentage', 0)
        risk_level = result.get('risk_level')
        
        if not risk_level or risk_level in ["Unknown", "N/A"]:
            if risk_score >= 80: risk_level = "High"
            elif risk_score >= 40: risk_level = "Medium"
            else: risk_level = "Low"

        # Save Heatmap
        output_filename = f"heatmap_{payload.file_name}"
        cv2.imwrite(os.path.join(RESULT_DIR, output_filename), result['visualized_overlay'])

        # CẬP NHẬT: Trả về đường dẫn heatmap để Frontend hiển thị
        return {
            "status": "Success",
            "diagnosis": result['diagnosis'],
            "risk_score": risk_score,
            "risk_level": risk_level,
            "heatmap_url": f"/static/results/{output_filename}",
            "metadata": meta
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))