import os
import cv2
import pandas as pd
from services.affectnet_backbone import AffectNetBackbone

# Đường dẫn model và folder ảnh
MODEL_PATH = "models/backbone_affectnet_resnet50_model.pt"
IMG_FOLDER = "test_images/"
OUTPUT_CSV = "backbone_results.csv"

def main():
    model = AffectNetBackbone(MODEL_PATH)
    results = []
    for fname in os.listdir(IMG_FOLDER):
        if fname.lower().endswith((".jpg", ".png")):
            img_path = os.path.join(IMG_FOLDER, fname)
            img = cv2.imread(img_path)
            result = model.predict(img)
            results.append({"file": fname, **result})
    df = pd.DataFrame(results)
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"Done! Results saved to {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
