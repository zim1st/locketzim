# Khôi phục Gold trên iPhone

Module mặc định hiện chỉ chạy hai script Gold nguyên bản. Video, âm thanh và photobooth chưa được xác nhận hoạt động bằng bản khôi phục. Xem [nguồn và giới hạn](../recovery/README.md).

## Dùng module từ repo riêng

1. Chọn cấu hình nền có giải mã HTTPS và chứng chỉ đã được tin cậy, ưu tiên `Locket_ohb.conf` cũ.
2. Tắt các module Locket Zim/v4 khác, kể cả module có URL chứa mã commit `78a1ae7…`. Tắt các hook Locket cũ trong cấu hình nền để không chạy trùng với module mới. Giữ nguyên chứng chỉ.
3. Trong **Mô-đun / Modules → +**, thêm:

   `https://raw.githubusercontent.com/zim1st/locketzim/main/LocketZim.Recovery.module`

4. Bật **Locket Zim - Khoi phuc Gold**. Module chỉ có hai hook `revenuecat` và `deleteHeader`; kiểm tra hai URL Script đều tải được.
5. Bật Shadowrocket, đóng hẳn rồi mở lại Locket và kiểm tra Gold.

File `.module` dùng để thêm vào cấu hình có sẵn, không chọn làm cấu hình chính mới: module không chứa chứng chỉ HTTPS riêng.

## Dùng cấu hình đầy đủ đã chuẩn bị riêng

Chủ máy có file cục bộ `LocketZim_KhoiPhuc.conf`, được tạo từ cấu hình gốc và giữ nguyên chứng chỉ. Chuyển file sang iPhone, nhập vào **Cấu hình**, chọn nó và tắt các module Locket khác. File này đã có hai hook Gold nên không cần thêm module khôi phục.

File chứa chứng chỉ riêng chỉ được giữ cục bộ, không có trên GitHub.

## Kiểm tra nếu Gold chưa trở lại

- Kiểm tra hai script tải thành công và chỉ một bộ Gold đang bật.
- Kiểm tra giải mã HTTPS và độ tin cậy của chứng chỉ trong cấu hình đang chọn.
- Bật **Gỡ lỗi** ở hai hook, mở lại Locket và xem lỗi tải/chạy script. Bản gốc không ghi log `v4`; sự vắng mặt của log đó không phải lỗi.
- Không cần xóa Locket hoặc đăng xuất để thử bước đầu. Chưa có log thiết bị nên chưa kết luận nguyên nhân mất Gold.

Nếu muốn thử đúng cấu hình gốc: tắt tất cả module Locket Zim, chọn `Locket_ohb.conf`, chỉ bật `revenuecat` và `deleteHeader` gốc.

## Dùng script cục bộ

Tải `LocketZim.local.module` và thư mục `scripts/`, giữ đúng đường dẫn tương đối. Profile khôi phục dùng hai file riêng `scripts/recovery-response.js` và `scripts/recovery-request.js`.
