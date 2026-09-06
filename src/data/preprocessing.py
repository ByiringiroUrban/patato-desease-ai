from pathlib import Path
import random
import shutil

from src.data.loader import find_images, get_raw_data_dir


RAW_DIR_FALLBACK = Path("data/raw")
SPLIT_DIR = Path("data/splits")

TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15
SEED = 42


def create_splits(
    raw_dir: Path = None,
    split_dir: Path = SPLIT_DIR,
    train_ratio: float = TRAIN_RATIO,
    val_ratio: float = VAL_RATIO,
    seed: int = SEED,
):
    if raw_dir is None:
        raw_dir = get_raw_data_dir()
    if abs(train_ratio + val_ratio + TEST_RATIO - 1.0) > 1e-9:
        raise ValueError("Split ratios must add up to 1.")

    images = find_images(raw_dir)
    if not images:
        raise FileNotFoundError(
            f"No images found in {raw_dir}. "
            "Put images inside class folders first."
        )

    classes = sorted({p.parent.name for p in images})
    random.seed(seed)

    if split_dir.exists():
        shutil.rmtree(split_dir)

    for split in ("train", "val", "test"):
        for class_name in classes:
            (split_dir / split / class_name).mkdir(parents=True, exist_ok=True)

    for class_name in classes:
        class_images = [p for p in images if p.parent.name == class_name]
        random.shuffle(class_images)

        n = len(class_images)
        train_end = int(n * train_ratio)
        val_end = train_end + int(n * val_ratio)

        # Ensure small classes still get sensible distribution where possible.
        train_items = class_images[:train_end]
        val_items = class_images[train_end:val_end]
        test_items = class_images[val_end:]

        for split_name, items in (
            ("train", train_items),
            ("val", val_items),
            ("test", test_items),
        ):
            for index, source in enumerate(items):
                # Prefixing avoids collisions when source filenames repeat.
                target = split_dir / split_name / class_name / f"{index:06d}_{source.name}"
                shutil.copy2(source, target)

    print("Dataset split created.")
    for split in ("train", "val", "test"):
        count = len(find_images(split_dir / split))
        print(f"  {split}: {count} images")


if __name__ == "__main__":
    create_splits()
