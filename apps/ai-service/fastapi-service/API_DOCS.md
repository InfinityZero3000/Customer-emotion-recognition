# Emotion Recognition API

## Đăng ký
- `POST /api/v1/auth/register`
- Body: `{ "username": "...", "email": "...", "password": "..." }`

## Đăng nhập
- `POST /api/v1/auth/login`
- Body: `{ "username": "...", "password": "..." }`

## Nhận diện cảm xúc ảnh
- `POST /api/v1/emotion/detect-emotion`
- Body: multipart/form-data (file ảnh)

## Nhận diện cảm xúc văn bản
- `POST /api/v1/emotion/detect-emotion-text`
- Body: `{ "text": "..." }`

## Nhận diện cảm xúc video
- `POST /api/v1/emotion/detect-emotion-video`
- Body: multipart/form-data (file video)

## Lịch sử nhận diện
- `GET /api/v1/history/{user_id}`

## Thông tin user
- `GET /api/v1/user/me?username=...`
