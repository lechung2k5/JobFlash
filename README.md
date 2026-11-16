# ⚡ JobFlash - Nền Tảng Kết Nối Thợ & Việc Làm Tức Thì (Realtime On-Demand Gig Platform)

> **JobFlash** là ứng dụng di động kết nối người có nhu cầu thuê thợ (Requester) và người lao động/thợ tay nghề tự do (Worker) theo mô hình **On-Demand hỏa tốc** (tương tự Grab, Be, Xanh SM dành cho thợ kỹ thuật & lao động dịch vụ). Thợ nhận việc và có mặt ngay tại hiện trường trong **30 - 60 phút**.

---

## 📑 Mục Lục
1. [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
2. [Kiến Trúc Công Nghệ (Tech Stack)](#-kiến-trúc-công-nghệ-tech-stack)
3. [Cấu Trúc Thư Mục (Project Structure)](#-cấu-trúc-thư-mục-project-structure)
4. [Yêu Cầu Hệ Thống (Prerequisites)](#-yêu-cầu-hệ-thống-prerequisites)
5. [Hướng Dẫn Cài Đặt & Chạy Dự Án (Getting Started)](#-hướng-dẫn-cài-đặt--chạy-dự-án-getting-started)
   - [Bước 1: Clone Repository & Cấu hình Biến môi trường](#bước-1-clone-repository--cấu-hình-biến-môi-trường)
   - [Bước 2: Khởi động Cơ sở dữ liệu & Cache với Docker](#bước-2-khởi-động-cơ-sở-dữ-liệu--cache-với-docker)
   - [Bước 3: Cài đặt & Chạy Backend API (NestJS + Prisma)](#bước-3-cài-đặt--chạy-backend-api-nestjs--prisma)
   - [Bước 4: Cài đặt & Chạy Mobile App (React Native + Expo)](#bước-4-cài-đặt--chạy-mobile-app-react-native--expo)
6. [Chi Tiết 8 Danh Mục Dịch Vụ Cốt Lõi](#-chi-tiết-8-danh-mục-dịch-vụ-cốt-lõi)
7. [Tiêu Chuẩn Thiết Kế & Quy Ước Mã Nguồn](#-tiêu-chuẩn-thiết-kế--quy-ước-mã-nguồn)
8. [Khắc Phục Sự Cố Thường Gặp (Troubleshooting)](#-khắc-phục-sự-cố-thường-gặp-troubleshooting)
9. [Đóng Góp & Phát Triển (Contribution)](#-đóng-góp--phát-triển-contribution)

---

## 🌟 Tính Năng Nổi Bật

* **⚡ Điều phối hỏa tốc (On-Demand Dispatch):** Không đặt lịch hẹn trước rườm rà. Hệ thống phát sóng yêu cầu tức thời tới các thợ uy tín trong bán kính gần nhất có mặt sau 30 - 60 phút.
* **📍 Bản đồ Goong Maps & Định vị chính xác:**
  - Tự động gợi ý địa chỉ (Places Autocomplete) theo thời gian thực.
  - Định vị GPS 1 chạm lấy tọa độ hiện tại.
  - Modal chọn vị trí trên bản đồ Vector 0ms-lag bằng MapLibre GL.
  - Tính toán lộ trình đường bộ thực tế qua Goong Directions API (hỗ trợ nhiều cấp fallback).
* **💰 Công cụ gợi ý thù lao thông minh:** Dựa vào diện tích, khối lượng, độ khó sự cố và số lượng đầu việc, hệ thống tự động gợi ý mức tiền công hợp lý kèm nút **"Áp dụng"** 1 chạm và chip giá khoán linh hoạt.
* **🎟️ Hệ thống Voucher & Khuyến mãi:** Chọn mã giảm giá có sẵn hoặc tự nhập mã ưu đãi, tính toán giảm trừ chi phí trực tiếp trên hóa đơn.
* **📱 Giao diện trang chủ phong cách hàng đầu (Grab / Be / Xanh SM):**
  - **Banner giới thiệu dịch vụ:** Carousel vuốt ngang tỉ lệ panoramic `3:1`, chiếm đúng 3/4 chiều rộng màn hình kèm chấm tròn chỉ thị trang.
  - **Khuyến mãi hot:** Bố cục card dọc dạng lưới 2 cột (`flexWrap: wrap`) tự động xuống dòng cân đối, mở xem chi tiết bằng Bottom Sheet.
* **🛡️ An tâm với FlashCare:** Thợ xác minh danh tính qua CCCD gắn chip NFC, chính sách bảo hiểm việc làm và hỗ trợ đổi thợ nhanh trong 15 phút.
* **🌓 Đa giao diện & Đa ngôn ngữ:** Tương thích 100% chế độ Sáng / Tối (`Light/Dark mode`) và hỗ trợ song ngữ Tiếng Việt & Tiếng Anh.

---

## 🛠 Kiến Trúc Công Nghệ (Tech Stack)

### 1. Mobile App (`mobile-app/`)
| Công Nghệ | Phiên Bản | Vai Trò |
| :--- | :--- | :--- |
| **React Native** | `0.88.1` | Nền tảng phát triển ứng dụng di động đa nền tảng |
| **Expo** | `~58.0.25` | Bộ công cụ SDK & Runtime hỗ trợ phát triển nhanh |
| **Expo Router** | `~58.0.31` | Định tuyến điều hướng dạng File-based routing |
| **TypeScript** | `~6.0.3` | Kiểm soát kiểu tĩnh chặt chẽ |
| **Zustand** | `^5.1.0` | Quản lý trạng thái toàn cục (Auth, Theme, Job state) |
| **Lucide Icons** | `^1.73.0` | Bộ biểu tượng vector 2D chuẩn hóa (không dùng emoji) |
| **Expo Image** | `~58.0.18` | Tối ưu hóa tải và cache hình ảnh hiệu năng cao |
| **React Native WebView** | `14.0.1` | Render bản đồ tương tác Vector MapLibre GL |
| **NativeWind / Tailwind**| `^4.2.7` | Utility-first CSS styling cho React Native |

### 2. Backend API (`backend-api/`)
| Công Nghệ | Phiên Bản | Vai Trò |
| :--- | :--- | :--- |
| **NestJS** | `^12.0.1` | Framework Node.js kiến trúc module, enterprise-ready |
| **Prisma ORM** | `^6.2.1` | Tầng tương tác Cơ sở dữ liệu thế hệ mới |
| **Socket.io** | `^4.8.1` | Kết nối WebSocket thời gian thực (tracking thợ, chat) |
| **Passport & JWT** | `^0.7.0` | Xác thực người dùng và phân quyền RBAC |
| **PostgreSQL + PostGIS**| `15-3.3` | Spatial Database quét tọa độ bán kính địa lý |
| **Redis** | `7-alpine` | Lưu Geohash vị trí thợ, pub/sub realtime & caching |

---

## 📁 Cấu Trúc Thư Mục (Project Structure)

```text
JobFlash/
├── backend-api/                    # Mã nguồn Backend NestJS
│   ├── prisma/
│   │   └── schema.prisma           # Định nghĩa cấu trúc Database (Users, Jobs, KYC...)
│   ├── src/
│   │   ├── auth/                   # Module xác thực & JWT
│   │   ├── jobs/                   # Module quản lý việc làm & matching thợ
│   │   ├── users/                  # Module hồ sơ người dùng
│   │   └── main.ts                 # Điểm khởi động server
│   └── package.json
│
├── mobile-app/                     # Mã nguồn Ứng dụng Di Động Expo
│   ├── assets/
│   │   ├── banner-introduce/       # 4 Banner giới thiệu dịch vụ (tỉ lệ 3:1)
│   │   ├── banner-khuyenmai/       # 5 Banner ưu đãi vuông (tỉ lệ 1:1)
│   │   ├── icon-cate/              # 8 Icon 2D danh mục nghề nghiệp
│   │   └── icon-delivery/          # Bộ icon các dòng xe vận chuyển
│   ├── src/
│   │   ├── app/                    # File-based routing của Expo Router
│   │   │   ├── (auth)/             # Màn hình Đăng nhập, Đăng ký, OTP
│   │   │   ├── (requester)/        # Luồng dành cho Người Thuê Thợ
│   │   │   │   ├── index.tsx       # Trang chủ Người Thuê (Carousel + 2-row Grid)
│   │   │   │   ├── create.tsx      # Màn hình tạo công việc chung
│   │   │   │   └── categories/     # 8 Màn hình chuyên sâu từng danh mục:
│   │   │   │       ├── van-chuyen.tsx       # Vận chuyển & Dọn nhà
│   │   │   │       ├── ve-sinh-don-dep.tsx  # Vệ sinh & Dọn dẹp
│   │   │   │       ├── viec-nang.tsx        # Bốc xếp & Việc nặng
│   │   │   │       ├── sua-chua.tsx         # Sửa chữa điện nước
│   │   │   │       ├── phuc-vu.tsx          # Phục vụ tiệc & Chạy bàn
│   │   │   │       ├── cham-soc.tsx         # Chăm sóc người thân & thú cưng
│   │   │   │       ├── chuyen-mon.tsx       # Thợ kỹ thuật chuyên môn
│   │   │   │       └── khac.tsx             # Việc làm tự do linh hoạt
│   │   │   ├── (worker)/           # Luồng dành cho Thợ nhận việc
│   │   │   └── (shared)/           # Thông báo, chat, hồ sơ cá nhân
│   │   ├── components/             # Components dùng chung (GlassBottomBar...)
│   │   ├── constants/              # Bảng màu Theme (Light/Dark), Shadows
│   │   ├── i18n/                   # Quản lý đa ngôn ngữ (VIE / ENG)
│   │   ├── services/               # Goong Maps Service, API Client
│   │   └── store/                  # Zustand Store (useAuthStore...)
│   ├── metro.config.js             # Cấu hình Metro Bundler (tự động nạp .env gốc & NativeWind)
│   └── package.json
│
├── .env.example                    # Mẫu cấu hình biến môi trường duy nhất toàn dự án
├── .gitignore                      # Chặn commit thông tin bí mật (.env, node_modules...)
├── docker-compose.yml              # Cấu hình container PostGIS & Redis
├── DESIGN.md                       # Bản đặc tả thiết kế & Design System
├── rule.md                         # Quy tắc bắt buộc khi lập trình & AI Agent
└── README.md                       # Tài liệu hướng dẫn dự án
```

---

## 💻 Yêu Cầu Hệ Thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
1. **Node.js**: Phiên bản **`v20.x`** hoặc **`v22.x`** (Khuyến nghị **Node 22 LTS**). Kiểm tra bằng lệnh:
   ```bash
   node -v
   npm -v
   ```
2. **Docker & Docker Desktop**: Để chạy PostgreSQL (PostGIS) và Redis một cách nhanh chóng mà không cần cài đặt cục bộ. Kiểm tra bằng:
   ```bash
   docker --version
   docker compose version
   ```
3. **Expo Go** (Tùy chọn): Tải app **Expo Go** trên App Store (iOS) hoặc Google Play (Android) để quét mã QR chạy app trực tiếp trên điện thoại thật.
4. **Git**: Kiểm tra bằng `git --version`.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án (Getting Started)

### Bước 1: Clone Repository & Cấu hình Biến môi trường

1. Clone source code về máy:
   ```bash
   git clone <URL_REPOSITORY_CUA_BAN>
   cd JobFlash
   ```

2. Tạo duy nhất 1 file cấu hình môi trường `.env` tại thư mục gốc từ file mẫu `.env.example`:
   * **Trên Windows PowerShell:**
     ```powershell
     Copy-Item .env.example .env
     ```
   * **Trên macOS / Linux:**
     ```bash
     cp .env.example .env
     ```
   *(Toàn bộ Backend NestJS, Database Docker và Mobile App Expo đều dùng chung 1 file `.env` duy nhất này tại thư mục gốc, không cần tạo thêm file `.env` ở các thư mục con).*

Các thông số cấu hình quan trọng trong file `.env` gốc:
* **PostgreSQL:** Cổng `5499` (User: `postgres`, Password: `mysecretpassword`, DB: `gigapp_db`)
* **Redis:** Cổng `6389`
* **Goong Maps API (Bảo mật qua `.env`):** Điền key của bạn vào các dòng:
  * `EXPO_PUBLIC_GOONG_API_KEY` (và `GOONG_API_KEY`)
  * `EXPO_PUBLIC_GOONG_MAPTILES_KEY` (và `GOONG_MAPTILES_KEY`)
  * `EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1`
  *(Metro Bundler trong `mobile-app/metro.config.js` đã được thiết lập tự động đọc file `.env` từ thư mục gốc và đẩy vào ứng dụng. File `.env` chứa key thật đã được chặn commit bởi `.gitignore` nên tuyệt đối an toàn khi push code lên GitHub/GitLab).*

---

### Bước 2: Khởi động Cơ sở dữ liệu & Cache với Docker

Tại thư mục gốc của dự án (`JobFlash/`), chạy lệnh sau để khởi động container PostGIS và Redis:

```bash
docker compose up -d
```

Kiểm tra trạng thái các container đang chạy:
```bash
docker compose ps
```
> Bạn sẽ thấy 2 container: `jobflash-postgres` (port `5499:5432`) và `jobflash-redis` (port `6389:6379`) ở trạng thái `Up` (Running).

---

### Bước 3: Cài đặt & Chạy Backend API (NestJS + Prisma)

1. Mở một terminal mới và di chuyển vào thư mục `backend-api`:
   ```bash
   cd backend-api
   ```

2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```

3. Sinh Prisma Client và đồng bộ cấu trúc Database vào PostgreSQL:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Khởi động Backend API ở chế độ phát triển (Development):
   ```bash
   npm run start:dev
   ```

> 🎯 Backend API sẽ lắng nghe tại: `http://localhost:3000` (Swagger tài liệu API tại `http://localhost:3000/api/docs` nếu được kích hoạt).

---

### Bước 4: Cài đặt & Chạy Mobile App (React Native + Expo)

1. Mở một terminal khác và di chuyển vào thư mục `mobile-app`:
   ```bash
   cd mobile-app
   ```

2. Cài đặt các thư viện phụ thuộc của ứng dụng di động:
   ```bash
   npm install
   ```

3. Khởi động Metro Bundler với tùy chọn xóa cache:
   ```bash
   npx expo start -c
   ```

4. **Trải nghiệm ứng dụng:**
   * **Trên điện thoại thật:** Mở ứng dụng **Expo Go** (Android: quét mã QR trực tiếp; iOS: mở camera quét mã QR hiển thị trên terminal).
   * **Trên máy ảo Android:** Nhấn phím `a` trên bàn phím terminal.
   * **Trên máy ảo iOS (Mac):** Nhấn phím `i` trên bàn phím terminal.
   * **Trên trình duyệt Web:** Nhấn phím `w` trên bàn phím terminal.

---

## 📋 Chi Tiết 8 Danh Mục Dịch Vụ Cốt Lõi

Tất cả 8 danh mục công việc trong `mobile-app/src/app/(requester)/categories/` đều đã được chuẩn hóa theo format thiết kế On-Demand hỏa tốc:

| Danh Mục | Tệp Tin | Đặc Điểm Nghiệp Vụ & Bố Cục Chuẩn |
| :--- | :--- | :--- |
| **1. Vận chuyển** | `van-chuyen.tsx` | Mặc định 0 phụ xe; bộ icon xe tải 2D; tính lộ trình km đường thực tế qua Goong Directions; preview lộ trình trực quan. |
| **2. Vệ sinh** | `ve-sinh-don-dep.tsx` | Mặc định 1h, 1 thợ; tính thù lao theo diện tích và số phòng; thợ có mặt sau 30-60p. |
| **3. Việc nặng** | `viec-nang.tsx` | Phân loại khối lượng, tải trọng và địa hình gọn gàng; gợi ý thù lao bốc xếp; phụ cấp đồ bảo hộ (+20.000đ). |
| **4. Sửa chữa** | `sua-chua.tsx` | 4 nhóm lỗi (Điện, Nước, Điện lạnh, Đồ gỗ); gợi ý giá khoán theo độ phức tạp; tùy chọn linh kiện vật tư. |
| **5. Phục vụ** | `phuc-vu.tsx` | Tiệc cưới, nhà hàng, cafe; số lượng bàn tiệc; checklist chạy bàn, tiếp thực, phụ bếp; chọn trang phục sảnh tiệc. |
| **6. Chăm sóc** | `cham-soc.tsx` | Người cao tuổi, người bệnh, trẻ em, thú cưng; tình trạng vận động; toggle kỹ năng điều dưỡng/y tế (+50.000đ). |
| **7. Chuyên môn** | `chuyen-mon.tsx` | Mạng LAN, Camera, Đồ gỗ nội thất, Hàn xì, Sơn bả; cấp độ tay nghề; phụ cấp máy móc đồ nghề (+30.000đ). |
| **8. Việc khác** | `khac.tsx` | Tự nhập tên việc linh hoạt (Xếp hàng giữ chỗ, phát tờ rơi, phụ kho...); phụ cấp xe máy di chuyển (+20.000đ). |

---

## 🎨 Tiêu Chuẩn Thiết Kế & Quy Ước Mã Nguồn

Dự án tuân thủ nghiêm ngặt các quy tắc lập trình đã nêu tại [`rule.md`](./rule.md):

1. **Giao diện không dùng thuật ngữ kỹ thuật (Rule 5):** Mọi văn bản, thông báo lỗi trên UI sử dụng ngôn ngữ đời thường, gần gũi, người dùng phổ thông đọc là hiểu ngay.
2. **Không dùng Emoji trên các thành phần UI:** 100% icon điều hướng và minh họa sử dụng biểu tượng vector 2D của thư viện `lucide-react-native` hoặc hình ảnh PNG/SVG chuyên dụng.
3. **Hỗ trợ Đa giao diện Sáng / Tối (Rule 6):** Mọi component đều lấy màu sắc qua hook `useAppTheme()` (`colors`, `gradients`, `shadows`, `isDark`), tuyệt đối không hard-code mã màu hex trực tiếp.
4. **An toàn hiển thị (Safe Area):** Sử dụng `useSafeAreaInsets()` và `SafeAreaView` từ `react-native-safe-area-context` để tránh đè lấn tai thỏ (Notch) và thanh điều hướng đáy.
5. **Định tuyến chuẩn Expo Router (Rule 4):** Mỗi file trong thư mục `src/app/` luôn có `export default function ...` đầy đủ.

---

## 🔧 Khắc Phục Sự Cố Thường Gặp (Troubleshooting)

### 1. Xung đột cổng kết nối khi chạy Docker
* **Hiện tượng:** Docker báo lỗi cổng `5499` hoặc `6389` đã bị chiếm dụng.
* **Xử lý:** Mở file `docker-compose.yml` và đổi cổng bên trái sang một cổng trống khác (ví dụ `"5500:5432"`), sau đó cập nhật lại biến `DB_PORT` và `DATABASE_URL` trong file `.env`.

### 2. Expo bị đơ hoặc giữ cache giao diện cũ
* **Hiện tượng:** Sau khi cập nhật code, màn hình điện thoại không cập nhật giao diện mới.
* **Xử lý:** Dừng terminal Expo bằng tổ hợp phím `Ctrl + C`, sau đó khởi động lại với cờ xóa cache:
  ```bash
  cd mobile-app
  npx expo start -c
  ```

### 3. Không lấy được vị trí GPS trên thiết bị
* **Hiện tượng:** Nhấn "Vị trí hiện tại" báo không lấy được tọa độ.
* **Xử lý:**
  - Trên điện thoại thật: Vào Cài đặt ứng dụng -> Cấp quyền vị trí (Location Permission) cho **Expo Go**.
  - Trên máy ảo Android/iOS: Bật tính năng giả lập vị trí GPS trong bảng điều khiển emulator.

### 4. Lỗi Prisma không kết nối được Database
* **Hiện tượng:** `npx prisma db push` báo không kết nối được tới `localhost:5499`.
* **Xử lý:** Đảm bảo Docker Desktop đang chạy và container `jobflash-postgres` đang ở trạng thái `Up` bằng lệnh `docker compose ps`.

### 5. Bản đồ Goong Maps không hiển thị hoặc bị xám / quay vòng loading
* **Hiện tượng:** Khi mở modal chọn điểm trên bản đồ hoặc xem thẻ bản đồ chỉ thấy ô xám hoặc icon loading quay mãi.
* **Nguyên nhân:** Metro Bundler đang giữ cache JavaScript cũ từ trước khi bạn thiết lập biến môi trường Goong vào file `.env`.
* **Xử lý:**
  1. Mở file `.env` ở thư mục gốc kiểm tra xem đã có `EXPO_PUBLIC_GOONG_API_KEY` và `EXPO_PUBLIC_GOONG_MAPTILES_KEY` chưa.
  2. Tắt terminal chạy Expo hiện tại (`Ctrl + C`) và khởi động lại với cờ `-c`:
     ```bash
     cd mobile-app
     npx expo start -c
     ```
  3. Bấm phím `r` trên terminal hoặc lắc điện thoại chọn **Reload** để tải lại ứng dụng.

---

## 👥 Đóng Góp & Phát Triển (Contribution)

1. Tạo nhánh mới cho tính năng:
   ```bash
   git checkout -b feature/ten-tinh-nang
   ```
2. Thực hiện commit theo chuẩn Conventional Commits:
   ```bash
   git commit -m "feat: tich hop ban do goong maps va bo cuc 2 row khuyen mai"
   ```
3. Đẩy nhánh lên Remote Repository và tạo Pull Request:
   ```bash
   git push origin feature/ten-tinh-nang
   ```

---

<p align="center">
  Phát triển với ❤️ bởi <b>Đội ngũ Kỹ sư JobFlash</b>
</p>
