import os
import json
import logging
from typing import List, Dict, Optional, Any
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("potato_disease_ai.gemini")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

try:
    import google.generativeai as genai
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        HAS_GEMINI = True
    else:
        HAS_GEMINI = False
except Exception as e:
    logger.warning(f"Failed to load google.generativeai: {e}")
    HAS_GEMINI = False

SYSTEM_AGRONOMIST_PROMPT = """You are Dr. Spud, an elite Senior Agricultural Pathologist & Potato Agronomist AI.
Your expertise covers:
- Potato diseases: Early Blight (Alternaria solani), Late Blight (Phytophthora infestans), Blackleg, Potato Virus Y, Common Scab, Healthy foliar management.
- Integrated Pest Management (IPM), FRAC fungicide rotation codes (Group 3, Group 4, Group 11, Group M01/M03), dosage safety, withholding periods.
- Micro-climate and weather risk factors (relative humidity, temperature, leaf wetness duration).
- Organic alternatives (copper fungicides, Trichoderma, Bacillus subtilis, neem).
- Soil nutrition (NPK balance, calcium/magnesium deficiences mimicking blight).

Always structure your responses clearly with:
1. Direct Diagnostic Summary
2. Immediate Action Plan (Chemical & Organic options with active ingredients)
3. Micro-climate & Weather Advisory
4. Prevention & Long-term Field Care
Keep tone professional, empathetic to farmers, highly practical, and always include safety reminders for chemical application.
"""

def get_gemini_model(model_name: str = "gemini-1.5-flash"):
    if not HAS_GEMINI or not GEMINI_API_KEY:
        return None
    try:
        return genai.GenerativeModel(
            model_name=model_name,
            system_instruction=SYSTEM_AGRONOMIST_PROMPT
        )
    except Exception as e:
        logger.error(f"Error initializing Gemini model: {e}")
        return None


def analyze_leaf_multimodal(
    image_path: str,
    cnn_prediction: str,
    cnn_confidence: float,
    user_prompt: Optional[str] = None
) -> Dict[str, Any]:
    """
    Multimodal leaf analysis: combines PyTorch CNN classification with Gemini's visual reasoning.
    """
    model = get_gemini_model("gemini-1.5-flash")
    
    # If Gemini API key is not configured or fails, fallback gracefully to structured expert agronomist knowledge
    if not model or not Path(image_path).exists():
        return generate_fallback_analysis(cnn_prediction, cnn_confidence, user_prompt)
    
    try:
        import PIL.Image
        image = PIL.Image.open(image_path)
        
        prompt = f"""
Analyze this uploaded crop leaf image.
Our local PyTorch CNN vision model classified this as: '{cnn_prediction}' with {cnn_confidence * 100:.1f}% confidence.
User Notes/Inquiry: "{user_prompt if user_prompt else 'Perform full diagnosis and treatment recommendations.'}"

Please evaluate:
1. Is this actually a potato leaf or plant foliage? (If not potato, state it clearly).
2. Confirm or refine the CNN diagnosis. What visual symptoms (concentric rings, chlorotic halos, water-soaked rot, fuzzy sporulation) are visible?
3. What is the estimated severity percentage (Low 0-25%, Moderate 25-60%, Severe 60%+)?
4. Provide immediate actionable treatments (Specific chemical fungicides with FRAC codes and organic alternatives).
5. Recommended spray schedule & field hygiene instructions.

Format your response in clean, organized Markdown.
"""
        response = model.generate_content([prompt, image])
        analysis_text = response.text if response and response.text else ""
        
        return {
            "source": "gemini-1.5-flash",
            "is_potato_leaf": True,
            "analysis_markdown": analysis_text,
            "severity_estimate": "Moderate" if "early" in cnn_prediction.lower() else "Critical" if "late" in cnn_prediction.lower() else "None",
            "treatment_summary": "Follow detailed agronomist protocol provided below."
        }
    except Exception as exc:
        logger.error(f"Gemini visual analysis failed: {exc}")
        return generate_fallback_analysis(cnn_prediction, cnn_confidence, user_prompt)


def chat_with_agronomist_llm(
    messages: List[Dict[str, str]],
    user_plan: str = "free"
) -> str:
    """
    Chat endpoint for agricultural queries, treatment advice, and crop health questions.
    """
    model = get_gemini_model("gemini-1.5-flash")
    
    if not model:
        last_user_msg = messages[-1]["content"] if messages else "Hello"
        return generate_fallback_chat_reply(last_user_msg)
    
    try:
        # Build chat history for Gemini
        gemini_history = []
        for m in messages[:-1]:
            role = "user" if m.get("role") == "user" else "model"
            gemini_history.append({"role": role, "parts": [m.get("content", "")]})
        
        chat = model.start_chat(history=gemini_history)
        last_message = messages[-1].get("content", "")
        
        # Append tier context
        enhanced_prompt = last_message
        if user_plan in ("pro", "enterprise"):
            enhanced_prompt += "\n(Note: User has Pro Agronomist access. Provide detailed dosage charts, active ingredients, and scientific IPM protocols.)"
            
        response = chat.send_message(enhanced_prompt)
        return response.text
    except Exception as exc:
        logger.error(f"Gemini chat failed: {exc}")
        last_user_msg = messages[-1]["content"] if messages else "Hello"
        return generate_fallback_chat_reply(last_user_msg)


def generate_fallback_analysis(cnn_prediction: str, confidence: float, user_prompt: Optional[str] = None) -> Dict[str, Any]:
    """Expert fallback knowledge engine if external LLM API is offline."""
    pred_lower = cnn_prediction.lower()
    
    if "early" in pred_lower:
        markdown = f"""### 🔬 Diagnostic Report: Early Blight (*Alternaria solani*)
**AI Confidence:** {confidence * 100:.1f}%  
**Pathogen:** *Alternaria solani* (Fungal)  
**Severity:** Moderate Risk (Early foliar infection detected)

#### 📋 Observed Symptoms & Pathology
- Dark brown to black circular lesions with distinct concentric rings (target-board appearance).
- Surrounding yellow chlorotic halo caused by fungal toxins (*alternaric acid*).
- Lesions primarily affect older lower canopy leaves first.

#### 💊 Recommended Treatment Protocol
1. **Immediate Protectant Spray:** Apply **Chlorothalonil** (2.0–2.5 L/ha) or **Mancozeb** (2.0 kg/ha) (FRAC Group M05/M03).
2. **Systemic Curative Action:** At first disease spread, spray **Azoxystrobin + Difenoconazole** (FRAC Group 11 + 3) to halt mycelial expansion.
3. **Organic / Biological Alternative:** Copper oxychloride (50% WP) or *Bacillus subtilis* foliar bio-fungicide.

#### 🛡️ Cultural & Field Prevention
- Strip infected lower senescing leaves and dispose away from the field.
- Avoid overhead sprinkler irrigation to reduce leaf wetness period.
- Implement 3-year crop rotation avoiding tomato, pepper, and eggplant.
"""
        return {
            "source": "knowledge-engine",
            "is_potato_leaf": True,
            "analysis_markdown": markdown,
            "severity_estimate": "Moderate",
            "treatment_summary": "Apply protectant or systemic fungicide within 3–5 days."
        }
    elif "late" in pred_lower:
        markdown = f"""### 🚨 URGENT: Late Blight Alert (*Phytophthora infestans*)
**AI Confidence:** {confidence * 100:.1f}%  
**Pathogen:** *Phytophthora infestans* (Oomycete)  
**Severity:** 🚨 **CRITICAL** (Can devastate entire field in 5–10 days)

#### 📋 Observed Symptoms & Pathology
- Water-soaked irregular lesions rapidly turning dark brown/purplish-black.
- Delicately pale white or grayish fungal sporulation on leaf undersides during humid mornings.
- High risk of tuber rot if fungal sporangia wash into the soil during rain.

#### 💊 Immediate Treatment Protocol
1. **Emergency Curative Spray:** Apply systemic oomycete-targeted fungicide immediately:
   - **Metalaxyl-M + Mancozeb** (e.g. Ridomil Gold) at 2.5 kg/ha.
   - Or **Dimethomorph + Mancozeb** (FRAC Group 40 + M03).
   - Or **Cymoxanil + Mancozeb** (FRAC Group 27 + M03).
2. **Fungicide Rotation:** Alternate modes of action every 5–7 days to prevent *P. infestans* strain resistance.

#### 🛡️ Urgent Preventive Action
- Immediately isolate affected zones; do not enter wet fields to prevent spore mechanical transfer.
- Hill up soil ridges firmly to create a physical barrier preventing spores reaching developing tubers.
- If over 50% foliage is infected before harvest, vine-kill (defoliate) with diquat to protect underground tubers.
"""
        return {
            "source": "knowledge-engine",
            "is_potato_leaf": True,
            "analysis_markdown": markdown,
            "severity_estimate": "Critical",
            "treatment_summary": "Urgent intervention required within 24–48 hours."
        }
    else:
        markdown = f"""### ✅ Crop Health Report: Healthy Foliage
**AI Confidence:** {confidence * 100:.1f}%  
**Foliage Condition:** Normal, vigorous green canopy with no active pathogen lesions.

#### 🌿 Key Observations
- Uniform chlorophyll pigmentation without chlorotic mottling or necrotic lesions.
- Healthy vascular veins with no fungal sporulation or water-soaked margins.

#### 🛡️ Preventive Maintenance Schedule
1. Continue scouting lower leaf canopy every 4–7 days.
2. Apply preventive protectant sprays (**Mancozeb** or **Copper Hydroxide**) prior to extended forecasted rains.
3. Maintain balanced nitrogen/potassium fertilization to avoid vegetative weakness.
"""
        return {
            "source": "knowledge-engine",
            "is_potato_leaf": True,
            "analysis_markdown": markdown,
            "severity_estimate": "None",
            "treatment_summary": "No active disease detected. Maintain preventive scouting."
        }


def generate_fallback_chat_reply(user_query: str) -> str:
    query = user_query.lower()
    if "late blight" in query or "phytophthora" in query:
        return """**Late Blight Management Guide (*Phytophthora infestans*):**

1. **Identification:** Irregular water-soaked pale green lesions quickly turning dark brown/black with white mildew underneath in humid conditions (>90% RH).
2. **Immediate Action:** Spray systemic fungicides like **Metalaxyl + Mancozeb** (Ridomil Gold) or **Cymoxanil** immediately.
3. **Weather Warning:** Cool nights (10–15°C) and warm days (18–22°C) with fog or dew accelerate spore germination in under 3 hours.
4. **Tuber Protection:** Ensure ridges are well-hilled so spores cannot wash down into tubers."""
    elif "early blight" in query or "alternaria" in query:
        return """**Early Blight Management Guide (*Alternaria solani*):**

1. **Identification:** Concentric brown 'target-like' circular rings on older leaves with yellow halos.
2. **Treatment:** Use protectants (**Chlorothalonil, Mancozeb**) or systemic triazoles/strobilurins (**Difenoconazole, Azoxystrobin**).
3. **Nutrient Link:** Severe early blight is often aggravated by nitrogen or potassium deficiency and drought stress."""
    elif "fertilizer" in query or "npk" in query or "soil" in query:
        return """**Potato Nutrition & Soil Best Practices:**

- **Ideal Soil pH:** 5.5 to 6.5 (prevents Common Scab).
- **NPK Strategy:**
  - **Nitrogen (N):** Essential during early vegetative growth; excess N late in season delays tuber bulking and increases blight susceptibility.
  - **Phosphorus (P):** Critical at planting for root development and tuber initiation.
  - **Potassium (K):** High demand during tuber bulking; improves disease resistance and storage quality."""
    else:
        return f"""**Dr. Spud (Potato AI Agronomist):**

I am ready to assist you with potato crop diagnostics, blight identification, IPM fungicide spray schedules, and soil health management.

Feel free to:
- Attach a photo of your potato leaf or stem for instant computer vision + pathology analysis.
- Ask questions about active ingredients, chemical dosages, or organic treatments.
- Request weather-based disease risk assessments for your field plot."""
