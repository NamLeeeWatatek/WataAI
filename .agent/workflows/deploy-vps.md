---
description: Deployment guide for VPS
---
# Hướng Dẫn Deploy lên VPS

Workflow này hướng dẫn bạn cách deploy ứng dụng WataOmni lên một VPS mới (Linux/Ubuntu).

## 1. Chuẩn bị VPS
Đảm bảo VPS đã cài đặt:
- **Git**
- **Docker** & **Docker Compose**

## 2. Kéo Source Code
Clone code về VPS:
```bash
git clone https://github.com/NamLeeeWatatek/omni-ai-source.git wataomi
cd wataomi
```

## 3. Cấu hình Biến Môi trường (.env)
Bạn cần tạo các file `.env` giống như ở local.

### 3.1 Infra Shared
```bash
cp infra-shared/.env.example infra-shared/.env
nano infra-shared/.env
# Điền các password (MYSQL_ROOT_PASSWORD, POSTGRES_PASSWORD, v.v...)
```

### 3.2 Backend
```bash
cp apps/backend/env-example-relational apps/backend/.env
nano apps/backend/.env
```
**Lưu ý quan trọng về Database:**
- **Nếu chạy DB bằng Docker (khuyên dùng):**
  - Sửa `DATABASE_HOST=postgres`
  - Đảm bảo service `postgres` có trong file `infra-shared/docker-compose.yml`.
- **Nếu chạy DB có sẵn trên VPS:**
  - Sửa `DATABASE_HOST=host.docker.internal` (hoặc IP Private của VPS)
  - Đảm bảo config như local.

### 3.3 Frontend
```bash
cp apps/web/.env.example apps/web/.env
nano apps/web/.env
# Cập nhật:
# NEXT_PUBLIC_API_URL=http://<IP-VPS>:8000/api/v1
# NEXT_PUBLIC_FRONTEND_URL=http://<IP-VPS>:3000
```

## 4. Khởi động Infrastructure (Database, Redis, MinIO)
Kiểm tra file `infra-shared/docker-compose.yml`. Nếu bạn muốn chạy Postgres/MySQL bằng Docker, hãy **uncomment** các service đó (vì chúng ta đã comment chúng ở bước dev local).

```bash
docker network create wata-network || true
docker-compose -f infra-shared/docker-compose.yml up -d
```

## 5. Build và Chạy App (Backend + Web)
Sử dụng file `docker-compose.prod.yml` đã được tối ưu:

```bash
# Lệnh này sẽ tự build image từ source code và start container
docker-compose -f docker-compose.prod.yml up -d --build
```

## 6. Kiểm tra
- **Backend logs:** `docker logs -f aiwata-backend`
- **Frontend logs:** `docker logs -f aiwata-web`
- Truy cập trình duyệt: `http://<IP-VPS>:3000`

## 7. Cập nhật mới (Update Flow)
Khi có code mới:
```bash
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
```
