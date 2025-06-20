import torch
import numpy as np
from PIL import Image

class AffectNetBackbone:
    def __init__(self, model_path: str, device: str = "cpu"):
        self.device = device
        self.model = torch.jit.load(model_path, map_location=device)
        self.model.eval()
        # Các class emotion theo AffectNet
        self.emotion_classes = [
            "neutral", "happy", "sad", "surprise", "fear", "disgust", "anger", "contempt"
        ]

    def preprocess(self, img: np.ndarray) -> torch.Tensor:
        # Resize, normalize theo chuẩn model
        img = Image.fromarray(img)
        img = img.resize((224, 224))
        img = np.array(img).astype(np.float32) / 255.0
        img = (img - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]  # Chuẩn hóa ImageNet
        img = np.transpose(img, (2, 0, 1))  # HWC -> CHW
        tensor = torch.tensor(img).unsqueeze(0).to(self.device)
        return tensor

    def predict(self, img: np.ndarray):
        tensor = self.preprocess(img)
        with torch.no_grad():
            logits = self.model(tensor)
            probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
        dominant_idx = int(np.argmax(probs))
        return {
            "emotions": {self.emotion_classes[i]: float(probs[i]) for i in range(len(self.emotion_classes))},
            "dominant_emotion": self.emotion_classes[dominant_idx],
            "confidence": float(probs[dominant_idx])
        }
