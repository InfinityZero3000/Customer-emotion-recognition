from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import torch
import cv2
import numpy as np
from deepface import DeepFace
from PIL import Image
import io

webcam_router = APIRouter()

# Load YOLOv5 model (person detection)
yolo_model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
yolo_model.classes = [0]  # person class

@webcam_router.post("/webcam-emotion")
async def webcam_emotion(image: UploadFile = File(...)):
    try:
        # Đọc ảnh từ file upload
        contents = await image.read()
        np_img = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

        # Phát hiện người/khuôn mặt bằng YOLOv5
        results = yolo_model(frame)
        faces = []
        for *box, conf, cls in results.xyxy[0].tolist():
            x1, y1, x2, y2 = map(int, box)
            face = frame[y1:y2, x1:x2]
            if face.size > 0:
                faces.append(face)

        # Nếu không phát hiện khuôn mặt
        if not faces:
            return JSONResponse({"error": "No face detected"}, status_code=200)

        # Nhận diện cảm xúc từng khuôn mặt với DeepFace
        emotions = []
        for face in faces:
            try:
                # DeepFace expects RGB
                face_rgb = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
                pil_face = Image.fromarray(face_rgb)
                # DeepFace yêu cầu ảnh dạng file hoặc numpy array
                result = DeepFace.analyze(np.array(pil_face), actions=['emotion'], enforce_detection=False)
                emotions.append(result['emotion'])
            except Exception as e:
                emotions.append({"error": str(e)})

        return {"num_faces": len(faces), "emotions": emotions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
