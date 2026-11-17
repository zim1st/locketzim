# Cài bộ riêng trên iPhone

1. Giữ cấu hình Shadowrocket đang dùng có giải mã HTTPS và chứng chỉ được tin cậy.
2. Vào **Kịch bản**, tắt `revenuecat`, `deleteHeader`, `locket_features_request` và `locket_features_response` của bản cũ. Không xóa chứng chỉ.
3. Mở **Mô-đun / Modules → +** và thêm:

   `https://raw.githubusercontent.com/zim1st/locketzim/main/LocketZim.module`

4. Bật module Locket Zim. Hai file trong `scripts/` được tải từ chính repo của anh, không phải copy mã thủ công nữa. Trong mục URL Script, kiểm tra cả hai link đều tải được.
5. Bật Shadowrocket. Đóng hẳn và mở lại Locket, thử quay video rồi kiểm tra camera/filter.

Nếu màn hình cấu hình không có mục Mô-đun, trở về danh sách **Cấu hình** để tìm mục Modules; vị trí có thể khác theo phiên bản Shadowrocket.

## Cài không dùng GitHub để tải mã

Tải `LocketZim.local.module` và thư mục `scripts/`, giữ đúng đường dẫn tương đối. Có thể dùng trình sửa script qua biểu tượng **ⓘ** để lưu nội dung JS cục bộ rồi sửa đường dẫn trong từng hook tới file đã lưu. Hai hook request/response của cùng dịch vụ dùng chung một file.

## Cập nhật

Khi repo có bản mới, cập nhật module và tải lại hai URL script trong Shadowrocket. Chỉ cập nhật module có thể chưa xóa bản JS đã cache. Log Remote Config v3 bắt đầu bằng `[Locket Zim]` để phân biệt với `[Locket 30s]` ở bản cũ.

Locket cũng có cache riêng của Firebase. Đóng/mở ứng dụng không bảo đảm có lần tải Remote Config mới. Việc bỏ ETag không bỏ được khoảng chờ do ứng dụng đặt. Không cần xóa app để thử bước đầu.

## Kiểm tra

- Quay thử, xem trước và kiểm tra thời lượng thật; nếu gửi thử, kiểm tra bên nhận mở đủ video.
- Xác nhận nút filter xuất hiện, danh sách có mục, rồi kiểm tra ảnh kết quả thực sự được tạo. Đây là ba bước khác nhau.
- Nếu thiếu nút: bật **Gỡ lỗi** ở `zim_remote_config_response`, lấy các dòng `[Locket Zim] v3 input schema` và `filter diagnostics` cùng số phiên bản Locket.
- Nếu tạo ảnh báo lỗi: giữ nguyên lỗi đó để chẩn đoán; không đổi lỗi máy chủ thành HTTP 200.

Để quay lại bản trước: tắt module Locket Zim rồi bật lại bốn script cũ. Các giá trị Locket đã cache có thể tồn tại đến lần tải và kích hoạt cấu hình mới.
