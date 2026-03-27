# ✈️ Flappy Plane

> Flappy Bird nhưng thay con chim bằng máy bay ngu ngu cute.

## Cách chạy

Chỉ cần mở `index.html` bằng trình duyệt (Chrome, Firefox, Edge, Safari đều được).

> ⚠️ Do dùng ES Modules (`type="module"`), bạn cần chạy qua một HTTP server nếu mở từ filesystem:
>
> ```bash
> # Dùng Python
> python3 -m http.server 8080
>
> # Dùng Node / npx
> npx serve .
>
> # Dùng VS Code Live Server extension
> ```
> Sau đó mở: http://localhost:8080

## Cách chơi

| Hành động | Điều khiển |
|---|---|
| Bay lên | Click chuột / Space / ArrowUp / Tap |
| Bắt đầu | Click / tap màn hình |
| Chơi lại | Click / tap sau khi chết |

## Cấu trúc project

```
flappy-plane/
├── index.html          # Entry point
├── css/
│   └── style.css       # Styles & layout
├── js/
│   ├── main.js         # Game loop, state machine
│   ├── config.js       # Hằng số, màu sắc
│   ├── plane.js        # Máy bay cute + hitbox
│   ├── pipes.js        # Ống chướng ngại vật
│   ├── background.js   # Sao, mây, nền trời
│   ├── particles.js    # Hiệu ứng hạt
│   └── overlay.js      # Màn hình idle / game over
└── README.md
```

## Tính năng

- ✈️ Máy bay béo cute có mặt pilot trong cửa sổ
- 💫 Chong chóng quay vù vù
- 🌟 Bầu trời đêm đầy sao nhấp nháy
- ☁️ Mây trôi lơ lửng
- 🎆 Hiệu ứng trail khi bay, nổ khi va chạm
- 🏆 Lưu best score trong phiên chơi
- 📱 Hỗ trợ touch (mobile)
