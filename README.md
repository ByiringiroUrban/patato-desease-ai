# Potato Disease AI — Multimodal Agronomy Platform

A commercial-grade agricultural intelligence platform combining PyTorch computer vision (ResNet-50 / CNN) with **Google Gemini 2.0 / 1.5 Pro Multimodal Vision & Reasoning**, Stripe subscription payments, field project management, and automated PDF agronomic report generation.

---

## 🌟 Key Capabilities

1. **Multimodal Leaf Pathology Diagnosis**:
   - PyTorch CNN identifies disease classes (*Early Blight*, *Late Blight*, *Healthy*).
   - Google Gemini 2.0 / 1.5 Pro provides deep visual symptom verification, severity estimates, and step-by-step IPM treatment plans.
2. **Dr. Spud — AI Potato Agronomist Chat**:
   - Ask agronomy questions about weather risks, FRAC fungicide rotation codes, dosages, soil nutrients, and organic treatments.
3. **Automated Agronomic PDF Certificates**:
   - One-click exportable PDF field diagnostic reports with chemical prescriptions, safety advisories, and agronomist disclaimers.
4. **Commercial Stripe Subscriptions**:
   - Built-in Stripe Checkout for **Pro Agronomist ($19/mo)** and **Enterprise ($79/mo)** plans with real-time webhooks.
5. **Field Plot & Multi-Project Tracking**:
   - Organize field inspections by plot or greenhouse with database-persisted image archives.

---

## 🚀 Quick Setup

### 1. Environment Configuration (`.env`)

Create or update your `.env` file with your credentials:

```env
DATABASE_URL=postgresql://user:pass@host/dbname
SECRET_KEY=your-secure-jwt-secret
GEMINI_API_KEY=your-gemini-api-key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 2. Backend Installation & Run

```powershell
# Activate Python Virtual Environment
venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt

# Start FastAPI server
uvicorn api.main:app --reload --port 8000
```

Interactive API documentation available at: `http://localhost:8000/docs`

### 3. Frontend Web App

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Running Tests

```powershell
.\venv\Scripts\python.exe -m pytest
```

---

## 🔒 Security & Disclaimers

- AI predictions and dosages are generated to assist farm scouting. Always calibrate chemical applications according to local pesticide regulatory guidelines.

