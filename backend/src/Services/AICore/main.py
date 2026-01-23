import os
import cv2
import numpy as np
import requests
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
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
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

class ImagePayload(BaseModel):
    file_name: str
    image_url: str = ""

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
    Chỉ cho phép ảnh võng mạc đạt chuẩn y tế đi qua.
    """
    if img is None: return False, "Không đọc được dữ liệu ảnh", None, {}
    
    # 1. Chuẩn hóa để phân tích chuyên sâu
    img_eval = cv2.resize(img, (512, 512))
    # Tăng cường độ tương phản để làm nổi bật mạch máu trước khi check
    lab = cv2.cvtColor(img_eval, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    cl = clahe.apply(l)
    img_contrast = cv2.merge((cl,a,b))
    img_contrast = cv2.cvtColor(img_contrast, cv2.COLOR_LAB2BGR)
    
    gray = cv2.cvtColor(img_contrast, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    # 2. KIỂM TRA CẤU TRÚC HÌNH HỌC (Strict Hough Circle)
    # Tăng param2 lên 45 để yêu cầu vòng tròn phải cực kỳ hoàn hảo
    circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, 1.2, 100, 
                                param1=50, param2=45, minRadius=h//4, maxRadius=h//2)
    
    cx, cy = 0, 0
    if circles is not None:
        circles = np.uint16(np.around(circles))
        cx, cy = int(circles[0, 0][0]), int(circles[0, 0][1])
    else:
        return False, "Hệ thống từ chối: Không phát hiện cấu trúc nhãn cầu chuẩn y tế.", img_eval, {}

    # 3. KIỂM TRA MẬT ĐỘ MẠCH MÁU (High-Sensitivity Vessel Check)
    # Ảnh võng mạc thật phải có hệ thống mạch máu chằng chịt
    vessels = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
    # Loại bỏ nhiễu nhỏ để chỉ giữ lại mạch máu thật
    kernel = np.ones((2,2), np.uint8)
    vessels = cv2.morphologyEx(vessels, cv2.MORPH_OPEN, kernel)
    
    vessel_density = np.count_nonzero(vessels) / (h * w)
    
    # Nâng ngưỡng mật độ lên 0.02 (Khó tính hơn 0.015 cũ)
    if vessel_density < 0.020: 
        return False, "Hệ thống từ chối: Thiếu đặc điểm mạch máu võng mạc (Ảnh rác hoặc sai tiêu cự).", img_eval, {"x": cx, "y": cy}

    # 4. KIỂM TRA PHỔ MÀU SINH HỌC (Biological Red-Orange Ratio)
    # Võng mạc người có màu cam/đỏ đặc trưng. R phải áp đảo G và B một cách tuyệt đối.
    avg_color = np.mean(img_eval, axis=(0, 1))
    # R (index 2) phải lớn hơn G (index 1) ít nhất 35% (1.35)
    if not (avg_color[2] > avg_color[1] * 1.35): 
        return False, "Hệ thống từ chối: Màu sắc không trùng khớp với mô sinh học võng mạc.", img_eval, {"x": cx, "y": cy}

    return True, "Hợp lệ", img_eval, {"x": cx, "y": cy, "vessel_score": round(vessel_density, 4)}

@app.post("/api/ai/auto-diagnosis")
def auto_diagnosis(payload: ImagePayload):
    try:
        img = load_image_from_source(payload)
        if img is None: return {"status": "Failed", "error": "AI could not load image"}

        # THỰC THI KIỂM ĐỊNH ULTRA-STRICT
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

        # NẾU LÀ VÕNG MẠC THẬT -> MỚI CHẠY PHÂN TÍCH CHUYÊN SÂU
        context = AIServiceContext(ResNetStrategy())
        result = context.execute_analysis(img_matrix)
        risk_score = result.get('risk_percentage', 0)
        risk_level = result.get('risk_level')
        
        if not risk_level or risk_level in ["Unknown", "N/A"]:
            if risk_score >= 80: risk_level = "High"
            elif risk_score >= 40: risk_level = "Medium"
            else: risk_level = "Low"

        output_filename = f"heatmap_{payload.file_name}"
        cv2.imwrite(os.path.join(RESULT_DIR, output_filename), result['visualized_overlay'])

        return {
            "status": "Success",
            "diagnosis": result['diagnosis'],
            "risk_score": risk_score,
            "risk_level": risk_level,
            "heatmap_url": f"http://localhost:5006/static/results/{output_filename}",
            "metadata": meta
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))