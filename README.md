# BroMin

Mini browser Electron + React (Tailwind, Framer Motion, ShadCN/UI, Lucide) với multi-tab dùng BrowserView, adblock, auto-skip YouTube ads, hotkeys, lưu session + vị trí, Tray, AlwaysOnTop.

## Tính năng chính
- Multi-tab bằng BrowserView (không dùng webview tag)
- Lưu/khôi phục session tabs, vị trí/kích thước cửa sổ, AlwaysOnTop, Quicklinks, Opacity
- Adblock (@ghostery/adblocker-electron) + fallback webRequest, log URL bị chặn
- Auto skip quảng cáo YouTube (click Skip Ad, tua quảng cáo, ẩn overlay)
- Hotkeys: 
  - Shift + Space: Ẩn/hiện app (global)
  - Ctrl + T / W / R / Tab / Ctrl+Shift+I: chỉ khi cửa sổ focus
- Tray icon: Open, Quit
- Giao diện dark minimal, glassmorphism, responsive tốt ở cửa sổ nhỏ
- Quicklinks trong menu dấu ba chấm của thanh tab. Click mở tab mới. Right-click để Sửa/Xoá. Nút + để thêm
- Opacity slider trong Controls; AlwaysOnTop toggle

## Yêu cầu
- Node 18+
- Windows (đã test), Electron >= 30

## Cấu trúc dự án
- main.js: Main process, cửa sổ, hotkeys, tray, adblock, IPC
- src/core/tabManager.js: Quản lý BrowserView tabs, session, context menu
- src/core/windowState.js: electron-store lưu bounds, session, quicklinks, opacity
- src/preload.cjs: expose API an toàn cho renderer
- src/ui: React UI
  - App.jsx, components (TabsBar, AddressBar, Controls, Quicklinks)
  - styles.css (Tailwind + custom)
- assets/icons/app.png: icon

## Chạy dev
```
npm install
npm run dev
```
- Mặc định UI ở http://localhost:5173, Electron tự mở khi sẵn sàng
- App khởi động ẩn; dùng Shift+Space để hiện

## Build
```
npm run build
```
- Vite build UI -> electron-builder đóng gói
- Kết quả ở thư mục `release/` (artifactName: BroMin-<version>-<os>-<arch>.*)

## Hotkeys
- Shift+Space: Ẩn/hiện app (global)
- Ctrl+T: Tab mới
- Ctrl+W: Đóng tab
- Ctrl+R: Reload tab
- Ctrl+Tab: Chuyển tab
- Ctrl+Shift+I: DevTools tab hiện tại

## Quicklinks
- Mở menu dấu ba chấm ở thanh tab
- Nhấn + để thêm; điền Title và URL (không có protocol sẽ tự thêm https://)
- Right-click vào quicklink để Sửa/Xoá
- Click vào quicklink sẽ mở trong tab mới

## Ghi chú
- Adblock có fallback thủ công nếu API bind ESM không khả dụng, vẫn log URL chặn
- Tránh sửa đổi preload để giữ an toàn contextIsolation

## Đổi tên app
- Tên hiển thị: BroMin
- appId: com.bromin.app
- artifactName: BroMin-<version>-<os>-<arch>.*

## License
MIT
