# Tích hợp trong Locket qua Shadowrocket

Yêu cầu của dự án là dùng bên trong ứng dụng Locket thông qua Shadowrocket. Không chuyển yêu cầu sang làm một website camera riêng.

## Photobooth trên web tham khảo

Giao diện web có lựa chọn chụp bốn ảnh, bố cục 2×2 và đếm ngược. Mã chạy trong trình duyệt điều khiển camera, chụp các khung hình và ghép chúng thành một ảnh. Sau đó website dùng backend để đăng ảnh đã ghép lên Locket. Đây là cơ chế đã quan sát từ mã công khai; không chứng minh ứng dụng iPhone có cùng chế độ chụp.

Shadowrocket có thể chỉnh các yêu cầu và phản hồi mạng phù hợp. Việc đó không tự chèn bộ điều khiển camera hoặc giao diện của website vào ứng dụng native. Muốn bật một tính năng ẩn cần chứng minh phiên bản Locket đang dùng có triển khai tính năng đó và xác định đúng cấu hình. Muốn chuyển việc xử lý ảnh qua dịch vụ riêng còn cần giao thức đầu vào/đầu ra tương thích và một bộ xử lý ảnh thực sự.

Module hiện tại chưa có bộ chụp/ghép photobooth. Không xem việc xuất hiện nút, trả lại URL ảnh gốc hoặc đổi lỗi HTTP thành thành công là đã thực hiện photobooth. Những bản thử cờ UI trước đây chưa giải quyết được yêu cầu này.

## Âm thanh video

Quyền micrô chỉ là một điều kiện. Cần phân biệt không thu âm, có âm nhưng đang tắt khi phát, hoặc mất âm sau bước xử lý/đăng video. Theo [hướng dẫn Apple](https://support.apple.com/en-us/101600), nếu một ứng dụng đã được cấp quyền mà vẫn có vấn đề thì cần kiểm tra phía ứng dụng; thử video bằng Camera giúp đối chiếu phần cứng.

V4 chỉ bật các khóa audio có sẵn được nhận diện từ cấu hình; không thay đổi vòng đời audio session, không tự thêm khóa âm thanh phỏng đoán và không tạo lại tiếng cho video cũ. Tên khóa đến từ mã cộng đồng, chưa có tài liệu API chính thức của Locket bảo đảm hiệu lực.

## Dữ liệu cần cho bước tiếp theo

- Số phiên bản Locket: có thể xem trong Cài đặt iPhone → Cài đặt chung → Dung lượng iPhone → Locket.
- Log `[Locket Zim] v4 input schema`, `filter diagnostics`, `audio input`, `audio output` sau một lần tải Remote Config mới.
- Video mới có mất tiếng cả khi lưu và phát trong Ảnh hay chỉ mất tiếng trong Locket.

Không cần chia sẻ mật khẩu, token, chứng chỉ hoặc toàn bộ dữ liệu tài khoản. Nếu chưa có phản hồi từ thiết bị, chưa thể kết luận chính xác nguyên nhân hoặc khẳng định đã sửa xong.
