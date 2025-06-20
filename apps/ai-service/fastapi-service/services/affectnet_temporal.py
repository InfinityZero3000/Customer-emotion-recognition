import torch
import numpy as np

class AffectNetTemporal:
    def __init__(self, model_path: str, device: str = "cpu"):
        self.device = device
        self.model = torch.jit.load(model_path, map_location=device)
        self.model.eval()
        self.emotion_classes = [
            "neutral", "happy", "sad", "surprise", "fear", "disgust", "anger", "contempt"
        ]

    def predict(self, features: np.ndarray):
        # features: (T, D) numpy array, T = số frame, D = feature dim
        tensor = torch.tensor(features, dtype=torch.float32).unsqueeze(0).to(self.device)  # (1, T, D)
        with torch.no_grad():
            logits = self.model(tensor)  # (1, T, num_classes) hoặc (1, num_classes)
            if logits.ndim == 3:
                logits = logits[0, -1]  # Lấy kết quả cuối cùng
            probs = torch.softmax(logits, dim=-1).cpu().numpy()
        dominant_idx = int(np.argmax(probs))
        return {
            "emotions": {self.emotion_classes[i]: float(probs[i]) for i in range(len(self.emotion_classes))},
            "dominant_emotion": self.emotion_classes[dominant_idx],
            "confidence": float(probs[dominant_idx])
        }
