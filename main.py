import argparse
from pathlib import Path

from src.data.loader import inspect_dataset
from src.data.preprocessing import create_splits
from src.training.train import train_model
from src.training.evaluate import evaluate_model
from src.inference.predict import predict_image


def main():
    parser = argparse.ArgumentParser(description="Potato Disease AI")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("inspect", help="Inspect the raw dataset")
    sub.add_parser("split", help="Create train/validation/test splits")
    sub.add_parser("train", help="Train the PyTorch CNN")
    sub.add_parser("evaluate", help="Evaluate the trained model")

    predict_parser = sub.add_parser("predict", help="Predict one image")
    predict_parser.add_argument("image", type=str)

    args = parser.parse_args()

    if args.command == "inspect":
        inspect_dataset(Path("data/raw"))
    elif args.command == "split":
        create_splits()
    elif args.command == "train":
        train_model()
    elif args.command == "evaluate":
        evaluate_model()
    elif args.command == "predict":
        result = predict_image(args.image)
        print(result)


if __name__ == "__main__":
    main()
