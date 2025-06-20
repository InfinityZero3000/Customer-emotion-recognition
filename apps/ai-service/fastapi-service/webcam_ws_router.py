from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import torch
import cv2
import numpy as np
from deepface import DeepFace

ws_router = APIRouter()

# Load YOLOv5 model (person detection)
yolo_model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
yolo_model.classes = [0]  # person class

@ws_router.websocket("/ws/webcam-emotion")
async def websocket_emotion(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_bytes()
            np_img = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
            results = yolo_model(frame)
            faces = []
            for *box, conf, cls in results.xyxy[0].tolist():
                x1, y1, x2, y2 = map(int, box)
                face = frame[y1:y2, x1:x2]
                if face.size > 0:
                    faces.append(face)
            emotions = []
            for face in faces:
                try:
                    face_rgb = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
                    result = DeepFace.analyze(face_rgb, actions=['emotion'], enforce_detection=False)
                    emotions.append(result['emotion'])
                except Exception as e:
                    emotions.append({"error": str(e)})
            await websocket.send_json({
                "num_faces": len(faces),
                "emotions": emotions
            })
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"error": str(e)})
