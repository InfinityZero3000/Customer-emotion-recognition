import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models

def train():
    # 1. Chuẩn bị dataset (ví dụ: FER2013)
    data_dir = "./data/FER2013"
    batch_size = 32
    num_classes = 7  # angry, disgust, fear, happy, sad, surprise, neutral

    transform = transforms.Compose([
        transforms.Grayscale(num_output_channels=3),
        transforms.Resize((48, 48)),
        transforms.ToTensor(),
    ])

    train_dataset = datasets.ImageFolder(root=f"{data_dir}/train", transform=transform)
    train_loader = torch.utils.data.DataLoader(train_dataset, batch_size=batch_size, shuffle=True)

    # 2. Khởi tạo model (ResNet18)
    model = models.resnet18(pretrained=True)
    model.fc = nn.Linear(model.fc.in_features, num_classes)

    # 3. Loss & Optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=1e-4)

    # 4. Training loop (demo 1 epoch)
    model.train()
    for epoch in range(1):
        for images, labels in train_loader:
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
        print(f"Epoch {epoch+1} done, loss: {loss.item()}")

    # 5. Lưu model
    torch.save(model.state_dict(), "fer_resnet18.pth")
    print("Training complete, model saved as fer_resnet18.pth")

if __name__ == "__main__":
    train()
