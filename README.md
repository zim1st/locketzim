# Locket Zim

Bộ script Shadowrocket riêng cho [zim1st/locketzim](https://github.com/zim1st/locketzim). Hai script chạy chính được lưu trong repo này; không tải mã từ repo cộng đồng và không gửi ảnh sang Worker bên thứ ba.

**Trạng thái thực tế:** người dùng đã xác nhận quay được **30 giây** với bản trước, nhưng video chưa có tiếng. AI/photobooth **chưa hiện nút và chưa hoạt động**. V4 thử bật các khóa âm thanh đã tồn tại trong cấu hình; chưa kiểm chứng trên iPhone. Bộ này không có bộ chụp/ghép photobooth hay máy chủ xử lý AI riêng.

## Link cài

[LocketZim.module](https://raw.githubusercontent.com/zim1st/locketzim/main/LocketZim.module)

Trong Shadowrocket, dùng cấu hình đang có chứng chỉ HTTPS hoạt động → **Mô-đun / Modules → +** → dán link trên. Tắt bốn script cũ trong cấu hình: `revenuecat`, `deleteHeader`, `locket_features_request`, `locket_features_response`, để tránh chạy chồng hai bộ. Giữ giải mã HTTPS bật. Xem [hướng dẫn đầy đủ](docs/INSTALL.md).

## Những gì repo quản lý

| Đường dẫn | Vai trò |
| --- | --- |
| `settings.json` | Giới hạn video và owner/repo/ref dùng tạo URL |
| `src/remote-config.js` | Điều chỉnh thời lượng, khóa âm thanh có sẵn, UI filter và log cấu hình nhận từ Locket |
| `src/revenuecat.js` | Thay thế hai hook Gold cũ, giới hạn theo User-Agent Locket |
| `scripts/` | Script đã build và bản có hash trong tên để phân biệt cache, tải trực tiếp từ repo này |
| `LocketZim.module` | Module dùng URL của repo `zim1st/locketzim` |
| `LocketZim.local.module` | Module dùng file cục bộ, không cần tải script từ GitHub |
| `reference/` | Bản chụp 9 script và 5 ảnh từ nguồn đã tham khảo, kèm module gốc; **không bật trong cấu hình chính** |
| `reference/SOURCES.json` | URL nguồn, thời điểm kiểm tra và SHA-256 của bản tải về |
| `tools/`, `tests/` | Build, kiểm tra hoạt động mô phỏng và kiểm tra file trước khi publish |

Mã nguồn tham khảo vẫn giữ tên/tác giả gốc, xem [NOTICE.md](NOTICE.md). Việc sở hữu repo không có nghĩa là sở hữu mã máy chủ hoặc quyền sử dụng dịch vụ của bên khác.

## Chỉnh và build

Cần Node.js 20 trở lên; không có package phụ thuộc và không cần `npm install`.

```sh
npm run check
```

Sửa `settings.json` rồi chạy lại lệnh trên để tạo hai module, hai script và `manifest.json`. Kết quả build có thể lặp lại, không tải thêm bất cứ tài nguyên nào.

`videoSeconds` đang là **120** để giữ đúng giá trị đã có trong file làm việc trước khi chuyển sang repo riêng. **Chỉ mốc 30 giây đã được người dùng xác nhận.** Đổi thành `30` nếu muốn dùng mốc đã thử; giá trị trong cấu hình không bảo đảm máy chủ nhận video cùng thời lượng.

Sau khi sửa, commit và push các file đã build trong `scripts/` cùng module. Không chỉ push `src/`. Có thể đặt `github.ref` thành SHA của một commit chứa script để cố định phiên bản tải, thay vì luôn dùng `main`.

Từ v4, module dùng tên file chứa hash nội dung. Khi mã thay đổi, URL script cũng đổi để Shadowrocket tải đúng bản mới. Build giữ các file có hash cũ để module chưa cập nhật vẫn tải được. Điều này không xóa cache Remote Config bên trong ứng dụng Locket.

## Video có âm thanh

V4 bật các khóa âm thanh được nhận diện trong `camera`, `camera_roll` và nhóm cấu hình ngoài cùng **chỉ khi máy chủ đã gửi các khóa đó**. Nó không cấp quyền micrô của iOS, không thêm track âm thanh vào video cũ và không xác nhận rằng ứng dụng đọc các khóa này. Xem [giới hạn tích hợp trong ứng dụng](docs/NATIVE-LIMITS.md).

Kiểm tra một video mới trong cả màn hình xem trước Locket và ứng dụng Ảnh sau khi lưu, bật loa và âm lượng. Log `[Locket Zim] v4 audio input` / `audio output` cho biết số khóa nhận diện được. `present:0` nghĩa là không có khóa âm thanh thuộc danh sách đang hỗ trợ; không phải đã bật ghi âm thành công.

## AI và photobooth

Các URL script công khai đã kiểm tra trả HTTP 200 ngày **17/11/2026**. V1/v2 không gọi `locket-vip.mhiep20077.workers.dev`, nên yêu cầu mua dịch vụ của Worker đó không trực tiếp giải thích lỗi không có nút trên các bản này.

Bản nguồn `locket_photobooth.js` có chuyển yêu cầu sang Worker riêng, còn `locket_pb_req.js` có nhánh trả lại ảnh đầu vào như kết quả thành công. Cả hai được lưu để đối chiếu, không bật trong module chính.

Để xử lý tiếp trong ứng dụng Locket, cần phiên bản Locket và các dòng log `[Locket Zim] v4 input schema` / `filter diagnostics` sau một lần Locket tải Remote Config mới. Log chỉ có tên nhóm cấu hình và số phần tử, không có token, ảnh hoặc tài khoản. Xem [phân tích AI/photobooth](docs/AI-PHOTOBOOTH.md).

Đã nghiên cứu thêm website anh cung cấp: [cơ chế photobooth, đăng nhập và AI của locket.elingo.app](docs/ELINGO-RESEARCH.md). Website có giao diện và backend riêng; mã công khai phía trình duyệt không chứa toàn bộ dịch vụ AI.

## Dữ liệu riêng

Repo không chứa chứng chỉ CA hay mật khẩu trong file `.conf` gốc. Giữ chứng chỉ trên iPhone, không tải file cấu hình gốc có chứng chỉ lên GitHub. Bộ script vẫn phụ thuộc các dịch vụ chính thức của Locket, Firebase và RevenueCat; GitHub chỉ cung cấp file script.
