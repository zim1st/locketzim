# AI/photobooth: đã biết gì và còn thiếu gì

## Bằng chứng hiện có

- Người dùng xác nhận quay 30 giây hoạt động với bản v1.
- Người dùng xác nhận v1/v2 đều chưa thấy nút AI/photobooth.
- V1 chỉ sửa các khóa UI có sẵn; v2 thêm một nhóm khóa UI từ mã cộng đồng khi thiếu. V3 giữ hành vi đó và ghi thêm hình dạng cấu hình **trước khi sửa**.
- Chưa có phiên bản Locket hoặc log cấu hình từ thiết bị. Vì vậy chưa xác định được nguyên nhân cụ thể của việc ẩn nút.
- Hai script Gold gốc và script Remote Config tham khảo trả HTTP 200 khi tải ngày 17/11/2026. Link nguồn còn tải được không có nghĩa là backend AI còn dùng được hoặc cấp quyền cho mọi tài khoản.

## Vì sao sao chép lên GitHub chưa làm AI hoạt động

Cần phân biệt ba phần: ứng dụng có UI tương ứng, danh sách filter/photobooth hợp lệ, và bộ xử lý tạo ảnh thực sự. Module hiện tại chỉnh cấu hình phía ứng dụng, giữ danh sách máy chủ cung cấp; không chứa mô hình AI hay máy chủ ghép ảnh.

Trong bản nguồn đã tải, `locket_photobooth.js` gửi yêu cầu tới `locket-vip.mhiep20077.workers.dev`. Chủ Worker kiểm soát dịch vụ đó; mã JavaScript phía client không phải mã Worker. Truy cập trang chủ hiện “Online” không chứng minh các API xử lý ảnh công khai hoặc miễn phí.

`locket_pb_req.js` có nhánh trả `photoUrl` của ảnh đầu vào như kết quả thành công, còn các đoạn khác xóa lỗi/đổi trạng thái phản hồi. Đó không phải bằng chứng đã ghép photobooth hay sinh ảnh AI. Các file này nằm trong `reference/`, không được module chính gọi.

## Bước chẩn đoán tiếp theo

Lấy phiên bản Locket và hai dòng log v3 sau một lần tải cấu hình mới. `missing-or-invalid` nghĩa là không nhận diện được object tương ứng. `no-catalog-arrays` nghĩa là không thấy các mảng danh sách mà script biết; ứng dụng có thể tải danh sách ở API khác. Không suy ra rằng chỉ cần thêm một khóa bất kỳ là đủ.

Nếu cần catalog riêng, phải xác định schema mà phiên bản ứng dụng thực sự đọc trước. Nếu cần xử lý ảnh riêng, phải triển khai backend ghép ảnh/AI hoặc kết nối dịch vụ do chủ repo được phép sử dụng. GitHub lưu file và GitHub Pages phục vụ nội dung tĩnh không tự cung cấp backend này.

Không bật Worker cộng đồng, không đăng ký/mua dịch vụ và không gửi ảnh tới bên thứ ba trong quá trình tạo repo này.
