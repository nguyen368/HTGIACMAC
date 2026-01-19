import torch
import cv2
import numpy as np
import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.staticfiles import StaticFiles
from strategies import AIServiceContext, ResNetStrategy

app = FastAPI(title="HTGIACMAC AI Professional - GPU/CPU Verified")

# --- BƯỚC 1: KIỂM TRA PHẦN CỨNG KHI KHỞI ĐỘNG ---
# Kiểm tra xem có card đồ họa Nvidia (CUDA) không
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "None"

print("="*50)
print(f"HỆ THỐNG AI ĐANG CHẠY TRÊN: {device.type.upper()}")
print(f"CHI TIẾT THIẾT BỊ: {gpu_name}")
print("="*50)

# Cấu hình lưu trữ ảnh kết quả
RESULT_DIR = "static/results"
os.makedirs(RESULT_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- BƯỚC 2: LOGIC XÁC THỰC ẢNH MẮT ---
def validate_eye_image(img_matrix):
    if img_matrix is None:
        return False, "Không thể đọc dữ liệu ảnh."
    
    # 1. KIỂM TRA MÀU SẮC CHI TIẾT (Võng mạc phải có màu Red/Orange trội)
    # Chúng ta tính độ lệch màu giữa kênh Red và kênh Blue
    avg_color = np.mean(img_matrix, axis=(0, 1))
    red_dominance = avg_color[2] - avg_color[0] 
    
    # 2. KIỂM TRA CẤU TRÚC HÌNH TRÒN (Đặc điểm của nhãn cầu/ảnh soi đáy mắt)
    gray = cv2.cvtColor(img_matrix, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (7, 7), 0)
    # Tìm các vòng tròn có bán kính lớn
    circles = cv2.HoughCircles(blurred, cv2.HOUGH_GRADIENT, 1, 200, 
                               param1=50, param2=35, minRadius=50, maxRadius=1000)

    # ĐIỀU KIỆN NGHIÊM NGẶT: Phải có màu đỏ đặc trưng VÀ cấu trúc hình tròn
    if red_dominance > 45 and circles is not None:
        return True, "Xác thực ảnh mắt thành công."
    
    # Trả về lý do cụ thể để dễ debug trên Swagger
    if red_dominance <= 45:
        return False, f"Lỗi: Màu sắc không giống võng mạc (Red diff: {red_dominance:.1f})."
        
    return False, "Lỗi: Không tìm thấy cấu trúc hình tròn đặc trưng của mắt."
# --- BƯỚC 3: CÁC ENDPOINT ---

@app.get("/ai-status")
async def get_status():
    """Kiểm tra xem hệ thống đang dùng GPU hay CPU thực tế"""
    return {
        "processor": device.type,
        "gpu_model": gpu_name,
        "is_cuda_ready": torch.cuda.is_available(),
        "status": "Online"
    }

@app.post("/api/v1/ai-core/validate-eye")
async def validate_eye(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    is_valid, msg = validate_eye_image(img)
    return {"is_valid": is_valid, "message": msg, "checked_by": device.type}

@app.post("/api/v1/ai-core/auto-diagnosis")
async def auto_diagnosis(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Kiểm tra trước khi chẩn đoán
        valid, _ = validate_eye_image(img)
        if not valid: 
            raise HTTPException(status_code=422, detail="Ảnh không hợp lệ")

        # Chạy phân tích AI
        context = AIServiceContext(ResNetStrategy())
        result = context.execute_analysis(img)

        # Lưu ảnh Heatmap
        output_filename = f"heatmap_{file.filename}"
        output_path = os.path.join(RESULT_DIR, output_filename)
        cv2.imwrite(output_path, result['visualized_overlay'])

        return {
            "status": "Phân tích hoàn tất",
            "metadata": {
                "hardware_acceleration": device.type,
                "gpu_info": gpu_name
            },
            "diagnosis_report": {
                "risk_score": result['risk_percentage'],
                "diagnosis": result['diagnosis'],
                "heatmap_url": f"http://localhost:8000/static/results/{output_filename}",
                "coordinates": result['coordinates'][:5]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
