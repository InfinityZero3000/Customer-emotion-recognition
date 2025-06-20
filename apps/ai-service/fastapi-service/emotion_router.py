from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks, Query
from fastapi.responses import StreamingResponse, FileResponse
from typing import List, Dict, Any, Optional
import logging
from pydantic import BaseModel
import json
from emotion_detector_fer import EmotionDetector
# from emotion_agent import EmotionAgent
import numpy as np

import cv2
import os
from tempfile import NamedTemporaryFile
from concurrent.futures import ThreadPoolExecutor
from services.affectnet_backbone import AffectNetBackbone
from services.affectnet_temporal import AffectNetTemporal
import torch
import zipfile
import shutil
import tempfile
import pandas as pd

# Configure logging
logger = logging.getLogger("emotion-router")

# Create router
emotion_router = APIRouter()

# Initialize models
emotion_detector = EmotionDetector()
emotion_agent = EmotionAgent()
affectnet_model = AffectNetBackbone("models/torchscript_model_0_66_49_wo_gl.pth")

temporal_models = {
    "RAMAS": AffectNetTemporal("models/RAMAS.pth"),
    "RAVDESS": AffectNetTemporal("models/RAVDESS.pth"),
    "SAVEE": AffectNetTemporal("models/SAVEE.pth"),
    "Aff-Wild2": AffectNetTemporal("models/Aff-Wild2.pth"),
    "CREMA-D": AffectNetTemporal("models/CREMA-D.pth"),
    "IEMOCAP": AffectNetTemporal("models/IEMOCAP.pth"),
}
affectnet_lstm = AffectNetTemporal(temporal_models)

# Pydantic models for request/response
class EmotionResponse(BaseModel):
    emotions: Dict[str, float]
    dominant_emotion: str
    confidence: float
    timestamp: str

class ProductPreferenceResponse(BaseModel):
    user_id: str
    recommended_categories: List[str]
    reasoning: str
    confidence_score: float

class UserPreferenceInput(BaseModel):
    user_id: str
    previous_interactions: Optional[List[Dict[str, Any]]] = None
    current_emotion: Optional[Dict[str, float]] = None
    session_context: Optional[Dict[str, Any]] = None

# Endpoints
@emotion_router.post("/detect-emotion", response_model=EmotionResponse)
async def detect_emotion(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    backbone: str = "deepface"  # hoặc "affectnet"
):
    """
    Detect emotions from an uploaded facial image.
    """
    try:
        contents = await image.read()
        np_img = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        # Phát hiện khuôn mặt bằng YOLOv5 như cũ
        results = emotion_detector.model(frame)
        faces = []
        for *box, conf, cls in results.xyxy[0].tolist():
            x1, y1, x2, y2 = map(int, box)
            face = frame[y1:y2, x1:x2]
            if face.size > 0:
                faces.append(face)
        if not faces:
            return {"error": "No face detected"}
        # Chọn backbone
        if backbone == "affectnet":
            emotions = [affectnet_model.predict(face) for face in faces]
        else:
            # DeepFace như cũ
            emotions = []
            for face in faces:
                try:
                    face_rgb = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
                    result = DeepFace.analyze(face_rgb, actions=['emotion'], enforce_detection=False)
                    emotions.append(result['emotion'])
                except Exception as e:
                    emotions.append({"error": str(e)})
        # Trả về kết quả
        return {"num_faces": len(faces), "emotions": emotions}
    except Exception as e:
        logger.error(f"Error detecting emotion: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@emotion_router.post("/predict-preferences", response_model=ProductPreferenceResponse)
async def predict_preferences(input_data: UserPreferenceInput):
    """
    Predict product preferences based on user's detected emotion and interaction history.
    """
    try:
        # Get product preferences using the emotion agent
        preferences = await emotion_agent.predict_preferences(
            user_id=input_data.user_id,
            emotions=input_data.current_emotion,
            previous_interactions=input_data.previous_interactions,
            session_context=input_data.session_context
        )
        return preferences
    except Exception as e:
        logger.error(f"Error predicting preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error predicting preferences: {str(e)}")

@emotion_router.post("/streaming-recommendations")
async def streaming_recommendations(input_data: UserPreferenceInput):
    """
    Stream product recommendations based on user's emotion.
    """
    try:
        # Create a generator for streaming responses
        return StreamingResponse(
            emotion_agent.stream_recommendations(
                user_id=input_data.user_id,
                emotions=input_data.current_emotion,
                previous_interactions=input_data.previous_interactions,
                session_context=input_data.session_context
            ),
            media_type="application/json"
        )
    except Exception as e:
        logger.error(f"Error streaming recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error streaming recommendations: {str(e)}")

@emotion_router.get("/emotion-stats/{user_id}")
async def get_emotion_stats(user_id: str, timeframe: str = Query("daily", enum=["daily", "weekly", "monthly"])):
    """
    Get emotion statistics for a user over a specified timeframe.
    """
    try:
        stats = await emotion_agent.get_emotion_stats(user_id, timeframe)
        return stats
    except Exception as e:
        logger.error(f"Error getting emotion stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting emotion stats: {str(e)}")

# Video Emotion Recognition (mô phỏng, thực tế cần trích frame và nhận diện từng frame)
def detect_emotion_on_frame(frame):
    # Gọi model nhận diện ảnh ở đây (ví dụ: emotion_detector.detect_from_image)
    # Ở đây mock
    return {"happy": 0.5, "neutral": 0.5}

@emotion_router.post("/detect-emotion-video")
async def detect_emotion_video(
    video: UploadFile = File(...),
    mode: str = "static"  # hoặc "dynamic"
):
    try:
        # Lưu file tạm, đọc video
        with NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
            temp_video.write(await video.read())
            temp_video_path = temp_video.name
        cap = cv2.VideoCapture(temp_video_path)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        features = []
        for i in range(0, frame_count, max(1, frame_count // 30)):  # Lấy tối đa 30 frame đại diện
            cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ret, frame = cap.read()
            if not ret:
                continue
            # Phát hiện khuôn mặt, cắt face lớn nhất
            results = affectnet_model.model(frame)
            faces = []
            for *box, conf, cls in results.xyxy[0].tolist():
                x1, y1, x2, y2 = map(int, box)
                face = frame[y1:y2, x1:x2]
                if face.size > 0:
                    faces.append(face)
            if not faces:
                continue
            face = faces[0]  # Lấy face đầu tiên/lớn nhất
            # Trích feature backbone
            tensor = affectnet_model.preprocess(face)
            with torch.no_grad():
                feature = affectnet_model.model(tensor, return_features=True)  # Cần sửa model backbone để trả về feature
            features.append(feature.cpu().numpy().squeeze())
        cap.release()
        # Nếu mode=dynamic, dùng temporal model
        if mode == "dynamic" and len(features) > 0:
            features_np = np.stack(features)
            result = affectnet_lstm.predict(features_np)
        else:
            # Static: tổng hợp cảm xúc từng frame
            emotions = [affectnet_model.predict(face) for face in faces]
            # Trung bình các frame
            avg_emotion = {}
            for emo in emotions:
                for k, v in emo["emotions"].items():
                    avg_emotion[k] = avg_emotion.get(k, 0) + v
            for k in avg_emotion:
                avg_emotion[k] /= len(emotions)
            dominant = max(avg_emotion, key=avg_emotion.get)
            result = {
                "emotions": avg_emotion,
                "dominant_emotion": dominant,
                "confidence": avg_emotion[dominant]
            }
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def save_history_async(history_data):
    # Lưu vào DB, gửi log, v.v.
    pass

batch_router = APIRouter()

@batch_router.post("/batch-emotion")
async def batch_emotion(
    file: UploadFile = File(...),
    file_type: str = "image",  # "image" hoặc "video"
    backbone: str = "affectnet",  # hoặc "deepface"
    mode: str = "static"  # hoặc "dynamic" cho video
):
    """
    Nhận file zip chứa nhiều ảnh hoặc video, trả về kết quả nhận diện cảm xúc hàng loạt.
    """
    try:
        # Tạo thư mục tạm
        with tempfile.TemporaryDirectory() as tmpdir:
            zip_path = os.path.join(tmpdir, file.filename)
            with open(zip_path, "wb") as f:
                f.write(await file.read())
            # Giải nén
            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                zip_ref.extractall(tmpdir)
            results = []
            for fname in os.listdir(tmpdir):
                if fname.endswith(".jpg") or fname.endswith(".png") and file_type == "image":
                    img_path = os.path.join(tmpdir, fname)
                    img = cv2.imread(img_path)
                    # Nhận diện cảm xúc từng ảnh
                    if backbone == "affectnet":
                        result = affectnet_model.predict(img)
                    else:
                        # DeepFace
                        from deepface import DeepFace
                        result = DeepFace.analyze(img, actions=['emotion'], enforce_detection=False)['emotion']
                    results.append({"file": fname, **result})
                elif fname.endswith(".mp4") and file_type == "video":
                    video_path = os.path.join(tmpdir, fname)
                    # Nhận diện cảm xúc từng video (dùng pipeline đã có ở bước 2)
                    # Gọi lại hàm detect_emotion_video, hoặc copy logic vào đây
                    # Ví dụ:
                    with open(video_path, "rb") as vfile:
                        class DummyUploadFile:
                            def __init__(self, file, filename):
                                self.file = file
                                self.filename = filename
                        dummy_file = DummyUploadFile(vfile, fname)
                        result = await detect_emotion_video(dummy_file, mode=mode)
                    results.append({"file": fname, **result})
            # Trả về kết quả dạng JSON và CSV
            df = pd.DataFrame(results)
            csv_path = os.path.join(tmpdir, "results.csv")
            df.to_csv(csv_path, index=False)
            return {
                "results": results,
                "csv": df.to_csv(index=False)
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

visualization_router = APIRouter()

@visualization_router.post("/visualize-emotion-video")
async def visualize_emotion_video(
    video: UploadFile = File(...),
    backbone: str = "affectnet",
    mode: str = "static"  # hoặc "dynamic"
):
    """
    Nhận video, nhận diện cảm xúc từng frame, vẽ nhãn cảm xúc lên frame, trả về video mới.
    """
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            # Lưu video tạm
            video_path = os.path.join(tmpdir, video.filename)
            with open(video_path, "wb") as f:
                f.write(await video.read())
            cap = cv2.VideoCapture(video_path)
            frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            out_path = os.path.join(tmpdir, "output_" + video.filename)
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(out_path, fourcc, fps, (frame_width, frame_height))
            frame_idx = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                # Nhận diện cảm xúc frame này
                if backbone == "affectnet":
                    result = affectnet_model.predict(frame)
                else:
                    from deepface import DeepFace
                    result = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)['emotion']
                # Vẽ nhãn lên frame
                label = f"{result['dominant_emotion']} ({result['confidence']:.2f})"
                cv2.putText(frame, label, (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 2)
                out.write(frame)
                frame_idx += 1
            cap.release()
            out.release()
            # Trả về file video đã gắn nhãn
            return FileResponse(out_path, media_type="video/mp4", filename="emotion_" + video.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))