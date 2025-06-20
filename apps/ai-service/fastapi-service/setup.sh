#!/bin/bash
set -e

echo "Tạo virtualenv..."
python3 -m venv venv
source venv/bin/activate

echo "Cài đặt requirements..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Tạo database (nếu chưa có)..."
python -c "from db import Base, engine; Base.metadata.create_all(bind=engine)"

echo "Setup xong!"
