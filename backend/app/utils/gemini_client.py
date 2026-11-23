"""
Gemini API client for LabLink AI features.
Validates API key on import. All calls fall back gracefully if unavailable.
"""
import os
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    _GEMINI_AVAILABLE = True
except ImportError:
    _GEMINI_AVAILABLE = False
    logger.warning("google-generativeai not installed. AI features will use fallback.")

_client_initialized = False

def _init_client():
    global _client_initialized
    if _client_initialized:
        return True
    if not _GEMINI_AVAILABLE:
        return False
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or api_key == "your_gemini_api_key_here":
        logger.warning("GEMINI_API_KEY not set. AI features will use fallback.")
        return False
    try:
        genai.configure(api_key=api_key)
        _client_initialized = True
        return True
    except Exception as e:
        logger.error(f"Gemini init failed: {e}")
        return False


def analyze_project_for_equipment(
    project_title: str,
    project_description: str,
    available_equipment: list[dict],
) -> dict:
    """
    Ask Gemini to recommend equipment from available_equipment for a project.

    Returns:
        {
            "recommendations": [
                {
                    "equipment_id": str,
                    "equipment_name": str,
                    "reason": str,
                    "confidence": float,  # 0.0–1.0
                    "is_essential": bool,
                }
            ],
            "prerequisites": [str],
            "summary": str,
            "ai_available": bool,
        }
    """
    if not _init_client():
        return _fallback_recommendations(available_equipment)

    # Build a compact equipment list for the prompt (avoid huge contexts)
    eq_list = "\n".join(
        f"- ID: {eq.get('id', '')} | Name: {eq.get('name', '')} | Category: {eq.get('category', '')} | Dept: {eq.get('department', '')} | Status: {eq.get('status', '')} | Description: {eq.get('short_description', '')}"
        for eq in available_equipment[:30]  # limit to 30 items
    )

    prompt = f"""You are an intelligent lab resource advisor for a university. A student has submitted a project request.

Project Title: {project_title}

Project Description:
{project_description}

Available Equipment (from actual database — only recommend from this list):
{eq_list}

Task:
1. Analyze the project and identify what equipment is needed.
2. Recommend equipment ONLY from the list above. Do NOT invent equipment.
3. For each recommendation, explain why it is needed.
4. Identify any prerequisites the student should be aware of.
5. Give a brief summary of your analysis.

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{{
  "recommendations": [
    {{
      "equipment_id": "<exact id from list>",
      "equipment_name": "<exact name from list>",
      "reason": "<why this equipment is needed for the project>",
      "confidence": <0.0 to 1.0>,
      "is_essential": <true or false>
    }}
  ],
  "prerequisites": ["<prerequisite 1>", "<prerequisite 2>"],
  "summary": "<2-3 sentence summary of your analysis>"
}}

Important: Only include equipment that is genuinely relevant. If no equipment matches, return an empty recommendations array."""

    try:
        model  = genai.GenerativeModel("gemini-1.5-flash")
        result = model.generate_content(prompt)
        text   = result.text.strip()

        # Strip markdown code fences if Gemini wrapped in them
        if text.startswith("```"):
            lines = text.split("\n")
            text  = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])

        data = json.loads(text)

        # Validate: only keep recommendations whose IDs exist in available_equipment
        valid_ids = {eq.get("id", "") for eq in available_equipment}
        data["recommendations"] = [
            r for r in data.get("recommendations", [])
            if r.get("equipment_id") in valid_ids
        ]
        data["ai_available"] = True
        return data

    except json.JSONDecodeError as e:
        logger.error(f"Gemini returned non-JSON: {e}")
        return _fallback_recommendations(available_equipment)
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return _fallback_recommendations(available_equipment)


def explain_fairshare_decision(
    project_title: str,
    score: float,
    score_breakdown: dict,
    slot_assigned: Optional[str] = None,
    alternatives: Optional[list] = None,
) -> str:
    """
    Ask Gemini to explain a FairShare allocation decision in plain English.
    Returns a plain-text explanation string.
    Falls back to a template if Gemini is unavailable.
    """
    if not _init_client():
        return _fallback_explanation(project_title, score, score_breakdown)

    breakdown_text = "\n".join(f"- {k}: {v}" for k, v in score_breakdown.items())
    alt_text = ""
    if alternatives:
        alt_text = "Alternative slots considered:\n" + "\n".join(f"- {a}" for a in alternatives[:3])

    prompt = f"""You are a lab resource allocation advisor. Explain the following FairShare allocation result to a student in a friendly, clear, 2-3 sentence message.

Project: {project_title}
Priority Score: {score:.2f} / 100
Score Breakdown:
{breakdown_text}
{f"Assigned Slot: {slot_assigned}" if slot_assigned else "No slot assigned yet."}
{alt_text}

Write a clear, helpful explanation. Do NOT use bullet points. Just 2-3 sentences of plain English."""

    try:
        model  = genai.GenerativeModel("gemini-1.5-flash")
        result = model.generate_content(prompt)
        return result.text.strip()
    except Exception as e:
        logger.error(f"Gemini explanation error: {e}")
        return _fallback_explanation(project_title, score, score_breakdown)


def _fallback_recommendations(available_equipment: list[dict]) -> dict:
    """Return a graceful fallback when Gemini is unavailable."""
    return {
        "recommendations": [],
        "prerequisites": [],
        "summary": "AI analysis is currently unavailable. Please browse equipment manually and select what you need for your project.",
        "ai_available": False,
    }


def _fallback_explanation(project_title: str, score: float, score_breakdown: dict) -> str:
    deadline = score_breakdown.get("deadline_urgency", 0)
    necessity = score_breakdown.get("equipment_necessity", 0)
    fairness  = score_breakdown.get("fairness", 0)
    return (
        f'Your project "{project_title}" received a priority score of {score:.1f}/100. '
        f"This was determined by deadline urgency ({deadline:.1f}), equipment necessity ({necessity:.1f}), "
        f"and fairness ({fairness:.1f}). Higher scores receive earlier slot assignments."
    )
