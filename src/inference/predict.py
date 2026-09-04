from pathlib import Path

import torch
from PIL import Image
from torchvision import transforms

from src.models.cnn import PotatoCNN


MODEL_PATH = Path("models/potato_model.pth")
IMAGE_SIZE = 224


def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. Run training first."
        )

    checkpoint = torch.load(MODEL_PATH, map_location="cpu")

    class_names = checkpoint["class_names"]
    model = PotatoCNN(num_classes=len(class_names))
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    transform = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=checkpoint["mean"],
            std=checkpoint["std"],
        ),
    ])

    return model, class_names, transform


def predict_image(image_path: str):
    model, class_names, transform = load_model()

    image = Image.open(image_path).convert("RGB")
    tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        logits = model(tensor)
        probabilities = torch.softmax(logits, dim=1)[0]
        index = int(probabilities.argmax())

    return {
        "class": class_names[index],
        "confidence": float(probabilities[index]),
        "probabilities": {
            class_names[i]: float(probabilities[i])
            for i in range(len(class_names))
        },
    }


if __name__ == "__main__":
    import sys
    print(predict_image(sys.argv[1]))
