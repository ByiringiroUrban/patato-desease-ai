import numpy as np


class NeuralNetworkFromScratch:
    """Small educational binary classifier implemented with NumPy only.

    Architecture:
        input -> dense(ReLU) -> dense(sigmoid)

    This is intentionally small so the forward pass and backpropagation
    can be studied without a deep-learning framework.
    """

    def __init__(self, input_size, hidden_size=16, learning_rate=0.01, seed=42):
        rng = np.random.default_rng(seed)

        self.W1 = rng.normal(0, np.sqrt(2 / input_size), (input_size, hidden_size))
        self.b1 = np.zeros((1, hidden_size))

        self.W2 = rng.normal(0, np.sqrt(2 / hidden_size), (hidden_size, 1))
        self.b2 = np.zeros((1, 1))

        self.learning_rate = learning_rate

    @staticmethod
    def relu(x):
        return np.maximum(0, x)

    @staticmethod
    def relu_derivative(x):
        return (x > 0).astype(float)

    @staticmethod
    def sigmoid(x):
        x = np.clip(x, -50, 50)
        return 1 / (1 + np.exp(-x))

    @staticmethod
    def binary_cross_entropy(y, y_hat):
        eps = 1e-8
        y_hat = np.clip(y_hat, eps, 1 - eps)
        return -np.mean(y * np.log(y_hat) + (1 - y) * np.log(1 - y_hat))

    def forward(self, X):
        self.Z1 = X @ self.W1 + self.b1
        self.A1 = self.relu(self.Z1)
        self.Z2 = self.A1 @ self.W2 + self.b2
        self.A2 = self.sigmoid(self.Z2)
        return self.A2

    def train(self, X, y, epochs=1000, verbose_every=100):
        y = y.reshape(-1, 1)

        for epoch in range(1, epochs + 1):
            y_hat = self.forward(X)
            loss = self.binary_cross_entropy(y, y_hat)

            m = X.shape[0]

            dZ2 = (y_hat - y) / m
            dW2 = self.A1.T @ dZ2
            db2 = np.sum(dZ2, axis=0, keepdims=True)

            dA1 = dZ2 @ self.W2.T
            dZ1 = dA1 * self.relu_derivative(self.Z1)
            dW1 = X.T @ dZ1
            db1 = np.sum(dZ1, axis=0, keepdims=True)

            self.W2 -= self.learning_rate * dW2
            self.b2 -= self.learning_rate * db2
            self.W1 -= self.learning_rate * dW1
            self.b1 -= self.learning_rate * db1

            if epoch == 1 or epoch % verbose_every == 0:
                predictions = (y_hat >= 0.5).astype(int)
                accuracy = np.mean(predictions == y)
                print(f"Epoch {epoch:4d} | loss={loss:.4f} | accuracy={accuracy:.4f}")

    def predict_proba(self, X):
        return self.forward(X)

    def predict(self, X, threshold=0.5):
        return (self.predict_proba(X) >= threshold).astype(int)
