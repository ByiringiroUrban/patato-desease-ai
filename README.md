# Potato Disease AI

A practical computer-vision project for classifying potato leaf images into disease classes.

The project has two learning tracks:

1. A small neural network implemented with NumPy from scratch for learning the mathematics.
2. A practical CNN implemented with PyTorch for real image classification.

## Expected dataset

Put your dataset under:

```text
data/raw/
├── Potato___Early_blight/
├── Potato___Late_blight/
└── Potato___healthy/
```

The code also works with other class-folder names.

## Setup

Windows PowerShell:

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If PowerShell blocks activation, use:

```powershell
venv\Scripts\activate.bat
```

## 1. Inspect dataset

```powershell
python main.py inspect
```

## 2. Create train/validation/test splits

```powershell
python main.py split
```

This creates:

```text
data/splits/
├── train/
├── val/
└── test/
```

Default split: 70% train, 15% validation, 15% test.

## 3. Train the practical CNN

```powershell
python main.py train
```

The best model is saved to:

```text
models/potato_model.pth
```

## 4. Evaluate

```powershell
python main.py evaluate
```

## 5. Predict one image

```powershell
python main.py predict path/to/leaf.jpg
```

## 6. Run API

```powershell
uvicorn api.main:app --reload
```

Open:

```text
http://127.0.0.1:8000/docs
```

Then use `POST /api/v1/predict`.

## 7. Run tests

```powershell
pytest
```

## Important

Do not put the dataset itself in Git if it is large. Keep the dataset locally or use a dataset storage service.

This project is designed for learning and experimentation. It should not be used as the sole basis for agricultural treatment decisions without field validation.
