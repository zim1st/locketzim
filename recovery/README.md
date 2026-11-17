# Khôi phục cấu hình Gold gốc

Bản thử nghiệm mới được người dùng báo mất Gold. Vì vậy cấu hình mặc định hiện là `profile: recovery`, chỉ chạy hai hook gốc được tải từ các URL trong `Locket_ohb.conf` người dùng đã cung cấp.

- `request.js`: bản nguyên vẹn của `reference/vuong2023/deleteHeader.js`.
- `response.js`: bản nguyên vẹn của `reference/vuong2023/Locket_Ohoang7.js`.
- Giữ nguyên pattern, tên hook, `max-size=-1`, `timeout=60` và cách xử lý ETag của cấu hình gốc.
- URL tải mã trỏ về repo riêng, với hash trong tên file.
- Không bật hook Firebase, UI filter, photobooth hay âm thanh.

Đây là khôi phục về hành vi cũ, không phải xác nhận Gold đã trở lại trên iPhone. Chưa có log thiết bị để kết luận nguyên nhân mất Gold; các khác biệt về bộ lọc URL/headers của adapter mới và việc chọn nhầm module làm cấu hình thiếu chứng chỉ đều cần được phân biệt.

## Cài

Ưu tiên quay về `Locket_ohb.conf` cũ trên iPhone, bật hai script `revenuecat` và `deleteHeader`, tắt mọi module Locket Zim/v4, rồi mở lại Locket.

Nếu dùng bộ tải từ repo riêng: giữ cấu hình nền có chứng chỉ HTTPS đã tin cậy, tắt các script/module Locket khác, thêm **một** module `LocketZim.Recovery.module` trong mục Modules. Không chọn file `.module` làm cấu hình chính mới.

Cấu hình đầy đủ kèm chứng chỉ gốc chỉ được tạo cục bộ cho chủ máy, không đưa lên repo. Các file script v3/v4 được giữ cho việc đối chiếu, không được module recovery gọi.
