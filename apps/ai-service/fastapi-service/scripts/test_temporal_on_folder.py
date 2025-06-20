import os
import cv2
import numpy as np
import pandas as pd
from services.affectnet_backbone import AffectNetBackbone
from services.affectnet_temporal import AffectNetTemporal

BACKBONE_PATH = "models/backbone_affectnet_resnet50_model.pt"
TEMPORAL_PATH = "models/temporal_affectnet_lstm_model.pt"
VIDEO_FOLDER = "test_videos/"
OUTPUT_CSV = "temporal_results.csv"

def extract_features_from_video(video_path, backbone):
    cap = cv2.VideoCapture(video_path)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    features = []
    for i in range(0, frame_count, max(1, frame_count // 30)):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if not ret:
            continue
        tensor = backbone.preprocess(frame)
        with torch.no_grad():
            feature = backbone.model(tensor, return_features=True)
        features.append(feature.cpu().numpy().squeeze())
    cap.release()
    return np.stack(features) if features else None

def main():
    backbone = AffectNetBackbone(BACKBONE_PATH)
    temporal = AffectNetTemporal(TEMPORAL_PATH)
    results = []
    for fname in os.listdir(VIDEO_FOLDER):
        if fname.lower().endswith(".mp4"):
            video_path = os.path.join(VIDEO_FOLDER, fname)
            features = extract_features_from_video(video_path, backbone)
            if features is not None:
                result = temporal.predict(features)
                results.append({"file": fname, **result})
    df = pd.DataFrame(results)
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"Done! Results saved to {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
