import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import torch
from src.models.cnn import PotatoCNN



def test_model_output_shape():
    model = PotatoCNN(num_classes=3)
    x = torch.randn(2, 3, 224, 224)

    output = model(x)

    assert output.shape == (2, 3)
