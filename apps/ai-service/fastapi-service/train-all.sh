#!/bin/bash
source venv/bin/activate
cd ml_models
python train_image.py
python train_text.py
# Nếu sau này có train_audio.py thì thêm vào đây
