# Nghiên cứu locket.elingo.app

Kiểm tra ngày **17/11/2026**, chỉ đọc HTML và các bundle JavaScript công khai mà trang nạp. Chưa đăng nhập, chưa gửi ảnh và chưa chạy tác vụ AI. Không sao chép bundle của website vào repo này.

## Kết quả quan sát

| Phần | Bằng chứng trong mã công khai | Ý nghĩa |
| --- | --- | --- |
| Photobooth | Module camera có ghép ảnh; module camera-tools có layout 2–4 ô và thao tác vẽ/xuất ảnh bằng Canvas | Website tự dựng trải nghiệm chụp/ghép trong trình duyệt; không phải một nút Gold tự có trong ứng dụng iPhone |
| Đăng nhập | Có các route `/locket/login`, `/locket/login-key` và đăng nhập bằng số điện thoại; có mã mã hóa thông tin gửi lên backend của website | Đăng nhập được xử lý qua dịch vụ của website; chưa xác minh cách backend lưu hoặc xử lý thông tin |
| Đăng ảnh/video | Có các route upload-media, publish-image, publish-video | Website có backend riêng để đưa nội dung lên Locket; việc tồn tại route không chứng minh nó hoạt động với mọi tài khoản |
| AI | Frontend gửi ảnh, filter/prompt, chế độ và token phiên tới `/locket/ai/run`, sau đó theo dõi job | Xử lý AI không nằm trọn trong file JavaScript tải về |
| Điều kiện AI | Giao diện đọc balance, so sánh giá của mode, trạng thái enabled/paused | Có cơ chế kiểm tra số dư/giá ở frontend. Chưa xác minh giá cụ thể, ưu đãi miễn phí hoặc điều kiện bắt buộc trả tiền ở backend |

## Liên hệ với cấu hình Shadowrocket

Bản Locket Zim hiện tại điều chỉnh phản hồi cấu hình của ứng dụng iPhone. Nó không đưa giao diện camera của website vào ứng dụng, không sở hữu backend `/locket/*`, và không dùng tài khoản/số dư của website.

Nếu mục tiêu là có photobooth riêng, có thể triển khai giao diện camera và bộ ghép ảnh bằng mã của mình. Nếu mục tiêu là AI riêng, còn cần máy chủ chạy mô hình hoặc API xử lý ảnh được cấp quyền. Nếu muốn các mục này xuất hiện trong camera của ứng dụng Locket, cần xác định schema catalog và giao thức mà phiên bản ứng dụng đang dùng hỗ trợ. Chưa có bằng chứng rằng chỉ thay URL script là đủ.

## Nguồn công khai đã đọc

- [Trang chủ](https://locket.elingo.app/).
- [Bundle chính](https://locket.elingo.app/static/js/main.f1753c26.js): khai báo route, luồng đăng nhập, upload và gọi AI.
- [Module camera](https://locket.elingo.app/static/js/camera.ba47c3d9.chunk.js): chụp và ghép ảnh.
- [Module camera-tools](https://locket.elingo.app/static/js/camera-tools.08e5af07.chunk.js): chỉnh khung/layout và xuất ảnh.
- [Module AI filter](https://locket.elingo.app/static/js/ai-filter.877b8082.chunk.js): chọn chế độ, kiểm tra số dư và theo dõi kết quả.

Các tên bundle có hash và có thể thay đổi khi website cập nhật. Những kết luận về phía server cần được kiểm chứng riêng; phần nghiên cứu này không khẳng định quyền sử dụng, bảo mật nội bộ hay chất lượng ảnh AI của dịch vụ.
