"""
LLM Service for Period Tracker Chatbot
Handles AI response generation with user context using Google Gemini API
"""

import os
from typing import List, Dict, Optional
from dataclasses import dataclass

# Import secure configuration (NO dotenv here - config handles everything)
from app.core.config import get_settings

# Import Google Gemini SDK
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None


@dataclass
class ChatMessage:
    role: str  # "user" or "assistant"
    content: str


class LLMService:
    """
    Service for generating AI chatbot responses using Google Gemini API
    Falls back to mock responses if API key is not available or on error
    """
    
    # System prompt template - hidden from user
    SYSTEM_PROMPT_TEMPLATE = """You are a compassionate menstrual health assistant for a period tracking app. 

USER CONTEXT:
- Current cycle day: {cycle_day}
- PCOS/Irregular mode: {pcos_mode}
- Pronouns: {pronouns}
- Recent symptoms (last 7 days): {symptoms}
- Recent moods: {moods}
- Currently on period: {on_period}
- Average cycle length: {avg_cycle_length} days

GUIDELINES:
- Be empathetic, supportive, and non-judgmental
- Use gender-neutral language unless user's pronouns indicate otherwise
- If PCOS mode is active, focus on symptom patterns rather than cycle predictions
- Provide evidence-based health information
- Encourage consulting healthcare providers for serious concerns
- Keep responses concise (2-4 sentences for simple questions, longer for complex ones)
- Never make definitive medical diagnoses

Respond naturally to the user's message."""

    _model = None
    _gemini_configured = False
    _model_name = None

    @classmethod
    def _configure_gemini(cls):
        """Configure Gemini API if not already configured using secure settings."""
        if cls._gemini_configured or not GEMINI_AVAILABLE:
            return
        
        # Get API key from secure config (NOT from os.getenv directly)
        try:
            settings = get_settings()
            api_key = settings.gemini_api_key  # Returns None if not set (safe fallback)
        except Exception as e:
            print(f"⚠️ Failed to load settings: {e}")
            api_key = None
        
        if api_key:
            try:
                genai.configure(api_key=api_key)
                cls._gemini_configured = True
                print("✅ Gemini API configured successfully (via secure config)")
            except Exception as e:
                print(f"⚠️ Failed to configure Gemini API: {e}")
                cls._gemini_configured = False
        else:
            print("⚠️ GEMINI_API_KEY not found in secure config (.env file)")
            cls._gemini_configured = False

    @classmethod
    def _discover_model(cls):
        """Discover available Gemini models that support generateContent"""
        try:
            models = genai.list_models()
            
            # Find models that support generateContent and have 'flash' or 'pro' in name
            candidates = []
            for model in models:
                model_name = model.name
                supported = model.supported_generation_methods
                
                if "generateContent" in supported:
                    # Prefer flash models (faster, cheaper) then pro models
                    if "flash" in model_name.lower():
                        candidates.append((0, model_name))  # Highest priority
                    elif "pro" in model_name.lower():
                        candidates.append((1, model_name))  # Second priority
                    else:
                        candidates.append((2, model_name))  # Lowest priority
            
            if candidates:
                # Sort by priority and return the best one
                candidates.sort(key=lambda x: x[0])
                selected_model = candidates[0][1]
                print(f"🤖 Auto-discovered model: {selected_model}")
                return selected_model
            else:
                print("⚠️ No suitable models found in list_models()")
                return None
                
        except Exception as e:
            print(f"⚠️ Failed to discover models: {e}")
            return None

    @classmethod
    def _get_model(cls):
        """Get or create Gemini model instance (auto-discover if needed)"""
        if cls._model is not None:
            return cls._model
        
        cls._configure_gemini()
        
        if not cls._gemini_configured:
            return None
        
        try:
            # Auto-discover available model
            model_name = cls._discover_model()
            
            if not model_name:
                print("⚠️ Could not discover any suitable model")
                return None
            
            cls._model_name = model_name
            
            # Create model without system_instruction (for older SDK compatibility)
            cls._model = genai.GenerativeModel(
                model_name=model_name,
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 1024,
                }
            )
            print(f"✅ Model initialized: {model_name}")
            return cls._model
            
        except Exception as e:
            print(f"⚠️ Failed to create Gemini model: {e}")
            return None

    @classmethod
    def generate_response(
        cls,
        user_message: str,
        user_context: dict,
        conversation_history: Optional[List[dict]] = None
    ) -> str:
        """
        Generate AI response based on user message and context
        Uses Gemini API if available, otherwise falls back to mock response
        """
        # Build system prompt from user context
        system_prompt = cls._build_system_prompt(user_context)
        
        # Try to use Gemini API
        try:
            model = cls._get_model()
            
            if model is None:
                # Fallback to mock response if Gemini not configured
                print("📝 Using mock response (Gemini not configured)")
                return cls._generate_mock_response(user_message, user_context)
            
            # Prepare chat with system instruction
            # Create a chat session with system instruction as the first context
            chat = model.start_chat(history=[])
            
            # Combine system prompt with user message
            # Note: Gemini 1.5 Flash supports system_instruction parameter in start_chat
            full_prompt = f"{system_prompt}\n\nUser message: {user_message}\n\nPlease respond to the user in a helpful and empathetic way."
            
            # Generate response
            response = chat.send_message(full_prompt)
            
            if response and response.text:
                return response.text
            else:
                print("⚠️ Empty response from Gemini API")
                return cls._generate_mock_response(user_message, user_context)
                
        except Exception as e:
            print(f"⚠️ Gemini API error: {e}. Falling back to mock response.")
            return cls._generate_mock_response(user_message, user_context)
    
    @classmethod
    def _build_system_prompt(cls, context: dict) -> str:
        """Build system prompt from user context"""
        
        # Format cycle day
        cycle_day = context.get("cycle_day", "unknown")
        
        # Format PCOS mode
        pcos_mode = "Active" if context.get("pcos_mode") else "Not active"
        
        # Format pronouns
        pronouns = context.get("pronouns") or "not specified"
        
        # Format symptoms
        symptoms_list = context.get("recent_symptoms", [])
        if symptoms_list:
            symptoms_str = ", ".join([f"{s['symptom']} ({s['count']}x)" for s in symptoms_list])
        else:
            symptoms_str = "none logged recently"
        
        # Format moods
        moods_list = context.get("recent_moods", [])
        if moods_list:
            moods_str = ", ".join([f"{m['mood']} ({m['count']}x)" for m in moods_list])
        else:
            moods_str = "none logged recently"
        
        # Format period status
        on_period = "Yes" if context.get("has_active_period") else "No"
        
        # Format cycle length
        avg_cycle = context.get("avg_cycle_length") or "unknown"
        
        return cls.SYSTEM_PROMPT_TEMPLATE.format(
            cycle_day=cycle_day,
            pcos_mode=pcos_mode,
            pronouns=pronouns,
            symptoms=symptoms_str,
            moods=moods_str,
            on_period=on_period,
            avg_cycle_length=avg_cycle
        )
    
    @classmethod
    def _generate_mock_response(cls, message: str, context: dict) -> str:
        """Generate contextual mock response for development or fallback"""
        
        message_lower = message.lower()
        cycle_day = context.get("cycle_day")
        pcos_mode = context.get("pcos_mode")
        symptoms = [s["symptom"] for s in context.get("recent_symptoms", [])]
        pronouns = context.get("pronouns")
        
        # Personalized greeting based on pronouns
        if pronouns and "he" in pronouns.lower():
            greeting = "Hey there! 💙"
        elif pronouns and "they" in pronouns.lower():
            greeting = "Hello! 💚"
        else:
            greeting = "Hi there! 💗"
        
        # PCOS-specific responses
        if pcos_mode:
            if any(word in message_lower for word in ["cycle", "period", "late", "irregular"]):
                return f"{greeting} I see you have PCOS/irregular cycle mode enabled. With PCOS, cycle variations are completely normal. Instead of focusing on exact timing, let's track your symptoms and patterns. Have you noticed any new symptoms lately?"
            
            if any(word in message_lower for word in ["pain", "cramp", "symptom"]):
                return f"{greeting} I notice you've been tracking symptoms. For PCOS, tracking symptoms is often more valuable than tracking cycle days. Heat pads and gentle movement can help with cramps. If pain is severe, please consult your healthcare provider."
        
        # Cycle day specific responses
        if cycle_day:
            if cycle_day <= 5:
                if "cramp" in message_lower or "pain" in message_lower:
                    return f"{greeting} You're on day {cycle_day} of your cycle. Cramps during the first few days are common. Try a heating pad, gentle yoga, or over-the-counter pain relief if needed. Stay hydrated!"
                return f"{greeting} You're on day {cycle_day} of your cycle. This is typically the menstrual phase. Make sure to rest, stay hydrated, and eat iron-rich foods. How are you feeling today?"
            
            elif 6 <= cycle_day <= 14:
                return f"{greeting} You're on day {cycle_day} - you're in the follicular phase. Energy levels often rise during this time. It's a great period for exercise and productivity!"
            
            elif 14 <= cycle_day <= 17:
                return f"{greeting} You're around day {cycle_day}, which is typically ovulation time. You might notice changes in cervical mucus or a slight temperature rise. Some people experience mild ovulation pain."
            
            elif cycle_day >= 18:
                if any(mood in [s.lower() for s in symptoms] for mood in ["moody", "irritable", "anxious"]):
                    return f"{greeting} You're in the luteal phase (day {cycle_day}). Mood changes are common during this time due to hormonal shifts. Be gentle with yourself and prioritize self-care."
                return f"{greeting} You're in the luteal phase (day {cycle_day}). Some people experience PMS symptoms during this time. Tracking your symptoms can help identify patterns."
        
        # Symptom-related responses
        if symptoms:
            if "cramps" in message_lower or "cramping" in message_lower:
                return f"{greeting} I see you've logged cramps recently. For relief, try: heat therapy, magnesium supplements, gentle stretching, or hydration. If cramps are severe or disruptive, please consult a healthcare provider."
            
            if any(word in message_lower for word in ["mood", "sad", "anxious", "emotional"]):
                return f"{greeting} Mood changes are a normal part of the cycle. I notice you've tracked some mood shifts. Regular exercise, adequate sleep, and stress management can help. If mood changes are severe, consider discussing with a healthcare provider."
            
            if any(word in message_lower for word in ["bloating", "bloated", "stomach"]):
                return f"{greeting} Bloating is very common, especially in the luteal phase. Try reducing salt intake, staying hydrated, and eating smaller meals. If bloating is persistent, mention it to your healthcare provider."
        
        # General health queries
        if any(word in message_lower for word in ["tip", "advice", "help", "what should"]):
            return f"{greeting} I'm here to help! Based on your cycle data, I can offer personalized tips. Regular exercise, balanced nutrition, and stress management support overall cycle health. What specific aspect would you like to know more about?"
        
        if any(word in message_lower for word in ["pregnant", "pregnancy", "conceive", "fertility"]):
            return f"{greeting} If you're trying to conceive or have pregnancy questions, tracking ovulation is key. The fertile window is typically 5 days before and including ovulation day. For personalized fertility advice, consult with a healthcare provider."
        
        # Default response
        return f"{greeting} I'm your cycle health assistant. I can see your cycle data and help answer questions about symptoms, cycle phases, or general wellness. What would you like to know?"

    @classmethod
    def _generate_error_response(cls) -> str:
        """Generate a polite error message when API fails"""
        return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment, or check your internet connection. 🌸"

    # ==================== AI Content Moderation ====================
    
    # System prompt for content moderation - supports all languages including Thai
    MODERATION_PROMPT = """You are a strict content moderator for a safe women's health and wellness community. 

The user text can be in ANY language (including Thai, English, Chinese, Japanese, Spanish, French, German, Arabic, Hindi, Vietnamese, Korean, Portuguese, Russian, Italian, and all other languages). You must analyze the context accurately across languages.

Analyze the user's text. If it contains hate speech, bullying, severe self-harm threats, explicit sexual content (non-educational), or dangerous medical misinformation, reply with exactly 'UNSAFE'. Otherwise, reply with exactly 'SAFE'."""
    
    @classmethod
    def moderate_content(cls, text: str) -> bool:
        """
        Moderate content using Gemini AI to detect inappropriate content.
        
        Args:
            text: The text content to moderate (post title, content, or comment)
            
        Returns:
            bool: True if content is SAFE, False if UNSAFE or error
        """
        if not text or not text.strip():
            return True  # Empty content is considered safe
        
        try:
            model = cls._get_model()
            
            if model is None:
                # If Gemini not available, allow content through (fail open for availability)
                print("⚠️ Content moderation skipped: Gemini not configured")
                return True
            
            # Prepare moderation prompt
            full_prompt = f"{cls.MODERATION_PROMPT}\n\nUser text to analyze:\n{text}\n\nRespond with only 'SAFE' or 'UNSAFE'."
            
            # Generate response
            chat = model.start_chat(history=[])
            response = chat.send_message(full_prompt)
            
            if response and response.text:
                result = response.text.strip().upper()
                
                # Check for UNSAFE response
                if "UNSAFE" in result:
                    print(f"🚫 Content moderation: UNSAFE content detected")
                    return False
                
                # Any other response (including SAFE) is considered safe
                print(f"✅ Content moderation: SAFE")
                return True
            else:
                print("⚠️ Content moderation: Empty response, allowing content")
                return True
                
        except Exception as e:
            error_str = str(e).lower()
            
            # Check if it's a safety exception from Google's filters
            if any(keyword in error_str for keyword in [
                "safety", "blocked", "harm", "dangerous", "prohibited",
                "content_filter", "filtered", "policy"
            ]):
                print(f"🚫 Content moderation: Blocked by safety filters")
                return False
            
            # Other errors - log but allow content through (fail open for unexpected errors)
            print(f"⚠️ Content moderation error: {e}. Allowing content.")
            return True
