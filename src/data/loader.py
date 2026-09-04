from pathlib import Path
from collections import Counter
from PIL import Image


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def find_images(root: Path):
    if not root.exists():
        return []

    return [
        p for p in root.rglob("*")
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    ]


def inspect_dataset(root: Path):
    images = find_images(root)

    if not images:
        print(f"No images found in {root}.")
        print("Expected: data/raw/<class_name>/*.jpg")
        return

    class_counts = Counter(p.parent.name for p in images)

    print(f"Dataset: {root}")
    print(f"Total images: {len(images)}")
    print("\nClasses:")
    for name, count in sorted(class_counts.items()):
        print(f"  {name}: {count}")

    print("\nImage examples:")
    for path in images[:10]:
        try:
            with Image.open(path) as img:
                print(f"  {path} -> size={img.size}, mode={img.mode}")
        except Exception as exc:
            print(f"  {path} -> ERROR: {exc}")
