# AI AGENT CORE RULES & CONTEXT

You are an AI programming assistant working on this project. You MUST strictly adhere to the following rules at all times.

## 1. 🛑 QUYỀN THỰC THI (EXECUTION PERMISSIONS)
- **TUYỆT ĐỐI KHÔNG** tự ý thực thi (auto-execute) bất kỳ câu lệnh CLI nào (terminal, npm install, xóa file, build...).
- **LUÔN LUÔN HỎI VÀ CHỜ XÁC NHẬN** từ người dùng trước khi muốn chạy bất kỳ lệnh nào làm thay đổi hệ thống hoặc mã nguồn.
- Trình bày lệnh (command) trong markdown code block để người dùng tự copy/chạy hoặc tự đưa ra quyết định.

## 2. 🧠 GHI NHỚ NGỮ CẢNH (CONTEXT & STATE MANAGEMENT)
- **GHI NHỚ** trạng thái hiện tại của kiến trúc dự án, lịch sử các file đã sửa và các thư viện đã cài đặt.
- **KHÔNG ĐƯỢC** tự động quét (scan/analyze) lại toàn bộ Workspace/Monorepo mỗi khi nhận được prompt mới để tránh lãng phí token và thời gian.
- Chỉ phân tích/đọc các file cụ thể khi có sự thay đổi hoặc khi được người dùng yêu cầu đích danh. Kế thừa dữ liệu từ các lượt hội thoại trước.

## 3. ⚡ TỐI ƯU HIỆU SUẤT (PREVENT CPU SPIKES)
- **KHÔNG** kích hoạt các tiến trình chạy ngầm (background processes), các tác vụ indexing nặng, hoặc các watcher (`--watch`, `nodemon`, `expo start`).
- Tuyệt đối không chạy các lệnh có khả năng gây treo máy hoặc tăng tải CPU đột biến (ví dụ: tìm kiếm text diện rộng bằng regex, cài lại `node_modules` liên tục).

## 4. 🛠 NGỮ CẢNH DỰ ÁN (CURRENT PROJECT STATE)
- **Tech Stack:** React Native, Expo Router, TypeScript.
- **Môi trường Node.js:** Dự án chạy trên **Node.js v22**. Khi đề xuất lệnh cài đặt hoặc thư viện, phải đảm bảo tương thích với môi trường Node 22.
- **Định tuyến (Routing):** Sử dụng Expo Router (File-based routing). **Bắt buộc** mọi file component trong thư mục `app/` đều phải có `export default`. Tuyệt đối không tạo hoặc để lại file trống gây lỗi compile.

## 5. 🗣️ TIÊU CHUẨN NGÔN NGỮ GIAO DIỆN (UI COPYWRITING STANDARDS)
- **KHÔNG DÙNG THUẬT NGỮ KỸ THUẬT:** Tuyệt đối không sử dụng các từ ngữ miêu tả công nghệ, chức năng hệ thống, hoặc các cụm từ chuyên ngành (dev jargon) hiển thị trên giao diện. 
- Mọi văn bản trên UI (text, nút bấm, thông báo lỗi...) phải dùng từ ngữ phổ thông, tự nhiên, thân thiện và người-dùng-bình-thường đọc là hiểu ngay.

## 6. 🎨 TIÊU CHUẨN KIẾN TRÚC MỞ RỘNG (THEME & LOCALIZATION)
- **Đa giao diện (Theme):** Phải phát triển cấu trúc hỗ trợ cả giao diện Sáng/Tối (Light/Dark mode) ngay từ đầu cho mọi component. Reponsive cho mọi kích cỡ điện thoại - tablet
- **Đa ngôn ngữ (i18n):** Hỗ trợ song ngữ Tiếng Việt (VIE) và Tiếng Anh (ENG). 
- **Quy tắc code:** Không hard-code chuỗi văn bản (text string) hay mã màu (color hex) trực tiếp vào các component. Bắt buộc sử dụng các biến theme và file ngôn ngữ (localization files) để quản lý.
## 7. 🐳 TIÊU CHUẨN TRIỂN KHAI & ĐÓNG GÓI (DOCKER & EC2 DEPLOYMENT)
- **Quản lý biến môi trường (Environment Variables):** Tuyệt đối không hard-code các đường dẫn API (`API_URL`), chuỗi kết nối Database, hay Secret Keys vào source code. Bắt buộc sử dụng file `.env` (ví dụ: `EXPO_PUBLIC_...` cho Frontend) để linh hoạt chuyển đổi giữa Local và Production.
- **Kiến trúc Stateless (Không trạng thái):** Đảm bảo logic Backend và Frontend không lưu trữ session/file vật lý cục bộ trên server, luôn sẵn sàng cho việc đóng gói vào Container (Docker) và triển khai lên AWS EC2.
- **Quản lý CORS & IP:** Thiết lập sẵn CORS linh hoạt ở phía Backend để không bị chặn khi gọi API giữa host EC2 (Production) và thiết bị thật của người dùng.