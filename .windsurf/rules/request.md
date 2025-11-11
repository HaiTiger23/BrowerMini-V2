---
trigger: always_on
---

Tôi cần bạn viết toàn bộ mã nguồn cho một trình duyệt Electron tên là BrowserMini v2. Đây là một trình duyệt mini, gọn nhẹ, hiện đại, có giao diện React + TailwindCSS + Framer Motion + ShadCN/UI + Lucide React icons. Code được viết bằng JavaScript (NodeJS), Electron phiên bản ≥ 30. Giao diện phải tối giản, đẹp, hoạt động tốt cả ở cửa sổ siêu nhỏ (ví dụ góc màn hình 300x200), các nút và thanh điều khiển phải responsive, tự co giãn, không bị vỡ layout. Browser có thể bật/tắt chế độ “Always on Top” (pin browser lên trên cùng) qua nút hoặc hotkey.

Yêu cầu chi tiết:

Ứng dụng khởi động ẩn (show: false, frame: false), bật/tắt bằng hotkey Shift + Z + Space. Khi ẩn, lưu vị trí và kích thước cửa sổ (getBounds), khi hiện lại khôi phục đúng chỗ (setBounds). Lưu state vào window-state.json hoặc electron-store. Khi hiện ra, cửa sổ có animation fade-in mượt.

Hỗ trợ Adblock dùng @ghostery/adblocker-electron và cross-fetch. Nếu Electron < 30 thì fallback sang webRequest.onBeforeRequest. Log URL bị chặn trong console. Tích hợp script auto skip quảng cáo YouTube: tự click “Skip Ad”, tua hết đoạn quảng cáo không thể bỏ qua, ẩn overlay ads. Inject trực tiếp từ main process (không dùng preload).

Hỗ trợ multi-tab bằng BrowserView, không dùng webview tag. Có thanh tab hiển thị danh sách tab dạng chip (UI từ ShadCN). Tab có thể thêm (Ctrl+T), đóng (Ctrl+W), reload (Ctrl+R), chuyển (Ctrl+Tab). Session gồm danh sách tab, URL và tab đang active được lưu lại và khôi phục khi khởi động. Nếu không có session, mở Google mặc định.

Có hotkey hệ thống: Ctrl+T mở tab mới, Ctrl+W đóng tab, Ctrl+R reload tab hiện tại (chặn reload toàn app), Ctrl+Tab chuyển tab, Ctrl+Shift+I mở DevTools tab hiện tại, Shift+Z+Space ẩn/hiện cửa sổ, và một nút hoặc hotkey để bật/tắt chế độ luôn hiển thị trên đỉnh (AlwaysOnTop).

Có Tray icon, tooltip là “BrowserMini v2”, menu gồm “Open” để hiển thị cửa sổ và “Quit” để thoát app.

Giao diện được viết bằng React + TailwindCSS + Framer Motion + ShadCN/UI. UI hiện đại theo phong cách dark minimal, có hiệu ứng glassmorphism và animation chuyển cảnh mượt. Thanh tab ở trên cùng, thanh địa chỉ ở giữa, nút thao tác (reload, close, add tab, pin, v.v.) dùng icon từ Lucide React. Layout responsive, hoạt động tốt trên cửa sổ nhỏ, tự co kích thước các nút, icon, thanh địa chỉ.

Cấu trúc project: main.js (main process), src/ui (giao diện React, index.html, main.jsx, App.jsx, components), src/core (tabManager.js, windowState.js), assets/icons/app.png.

Khi chạy npm start: app khởi động ẩn, nhấn Shift + Z + Space để mở, giao diện đẹp, gọn, hiển thị tab + address bar. Mở/đóng/chuyển tab, reload tab, bật DevTools, bật/tắt AlwaysOnTop, adblock hoạt động, auto skip quảng cáo YouTube, khi đóng lưu lại vị trí và session, mở lại khôi phục y nguyên.

Tóm lại, tôi muốn bạn viết mã nguồn hoàn chỉnh cho một mini browser hiện đại bằng Electron + React, có multi-tab, adblock, auto skip ads YouTube, hotkey điều khiển, lưu session + vị trí, tray icon, giao diện dark đẹp, responsive tốt ở kích thước nhỏ, và có chức năng pin lên trên cùng (Always on Top) bật/tắt được.