# 👁️ AURA - System for Retinal Vascular Health Screening
> **Hệ Thống Sàng Lọc Sức Khỏe Mạch Máu Võng Mạc**

![License](https://img.shields.io/badge/License-MIT-green)
![Backend](https://img.shields.io/badge/.NET-8.0-purple)
![AI Core](https://img.shields.io/badge/Python-Flask-yellow)
![Database](https://img.shields.io/badge/PostgreSQL-16-blue)

## 📖 Giới thiệu (Introduction)
AURA (Comprehensive AI Understanding Retinal Analysis) là hệ thống hỗ trợ ra quyết định lâm sàng (CDSS), sử dụng trí tuệ nhân tạo để phân tích hình ảnh võng mạc. Hệ thống giúp phát hiện sớm các dấu hiệu bất thường về mạch máu, từ đó cảnh báo nguy cơ các bệnh lý toàn thân như cao huyết áp, tiểu đường và đột quỵ.

## 🚀 Công nghệ sử dụng (Tech Stack)

### 1. Backend Service (.NET Core)
Được xây dựng theo kiến trúc **Clean Architecture (Onion Architecture)**:
-   **Framework:** ASP.NET Core 8.0 Web API
-   **ORM:** Entity Framework Core (PostgreSQL)
-   **Authentication:** JWT (Json Web Token)
-   **Cloud Storage:** Cloudinary (Lưu trữ ảnh y tế)
-   **Documentation:** Swagger / OpenAPI

### 2. AI Microservice (Python)
-   **Framework:** Flask
-   **Libraries:** NumPy, Pillow, Requests
-   **Model:** (Đang phát triển) Tích hợp Deep Learning để phân vùng và chẩn đoán bệnh.

### 3. Database & DevOps
-   **Database:** PostgreSQL
-   **Container:** Docker (Optional)
-   **Version Control:** Git & GitHub

---

## 📂 Cấu trúc dự án (Project Structure)

```bash
AURA-System/
├── src/
│   ├── backend/                # ASP.NET Core Solution
│   │   ├── Aura.API/           # Main Entry Point & Controllers
│   │   ├── Aura.Application/   # Business Logic, DTOs
│   │   ├── Aura.Domain/        # Entities, Core Interfaces
│   │   └── Aura.Infrastructure/# DbContext, Cloudinary Service
│   │
│   └── ai-core/                # Python AI Service
│       ├── app.py              # Flask API Entry
│       ├── requirements.txt    # Python dependencies
│       └── venv/               # Virtual Environment
│
├── docs/                       # Tài liệu thiết kế
└── README.md