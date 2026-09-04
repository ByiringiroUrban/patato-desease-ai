from pathlib import Path

import torch
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from sklearn.metrics import classification_report, confusion_matrix

from src.models.cnn import PotatoCNN


MODEL_PATH = Path("models/potato_model.pth")
TEST_DIR = Path("data/splits/test")
IMAGE_SIZE = 224


def evaluate_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError("Train the model first: python main.py train")

    if not TEST_DIR.exists():
        raise FileNotFoundError("Run: python main.py split")

    checkpoint = torch.load(MODEL_PATH, map_location="cpu")
    class_names = checkpoint["class_names"]

    transform = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=checkpoint["mean"],
            std=checkpoint["std"],
        ),
    ])

    dataset = datasets.ImageFolder(TEST_DIR, transform=transform)
    loader = DataLoader(dataset, batch_size=32, shuffle=False, num_workers=0)

    model = PotatoCNN(num_classes=len(class_names))
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    all_predictions = []
    all_labels = []

    with torch.no_grad():
        for images, labels in loader:
            logits = model(images)
            predictions = logits.argmax(dim=1)

            all_predictions.extend(predictions.numpy().tolist())
            all_labels.extend(labels.numpy().tolist())

    print("\nClassification report:")
    print(
        classification_report(
            all_labels,
            all_predictions,
            labels=list(range(len(class_names))),
            target_names=class_names,
            zero_division=0,
        )
    )

    print("Confusion matrix:")
    print(confusion_matrix(all_labels, all_predictions, labels=list(range(len(class_names)))))


if __name__ == "__main__":
    evaluate_model()
