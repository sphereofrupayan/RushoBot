from flask import Flask, request, jsonify, send_from_directory
from groq import Groq
from dotenv import load_dotenv
from pypdf import PdfReader
import os
import json
from pathlib import Path
import requests


env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

app = Flask(__name__, static_folder=".", static_url_path="")


client = Groq(api_key=os.getenv("GROQ_API_KEY"))
CRICKET_API_KEY = os.getenv("CRICKET_API_KEY")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

GROQ_MODEL = "llama-3.3-70b-versatile"


def ask_groq(system_prompt, user_prompt):
    """Shared helper for every tool route."""
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    )
    return response.choices[0].message.content


def extract_pdf_text(file_storage):
    """Extracts text from an uploaded PDF file. Raises on failure."""
    reader = PdfReader(file_storage)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text


@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/chat", methods=["POST"])
def chat():

    data = request.get_json()
    user_message = data.get("message", "")
    message = user_message.lower()
    history = data.get("history", [])

    weather_keywords = [
        "weather",
        "temperature",
        "forecast",
        "rain",
        "humidity",
        "hot",
        "cold",
        "climate"
    ]

    if any(keyword in message for keyword in weather_keywords):

        lat = data.get("lat")
        lon = data.get("lon")
        city = None

        if " in " in message:
            city = user_message.lower().split(" in ", 1)[1].strip().title()

        try:
            if city:
                url = (
                    f"https://api.openweathermap.org/data/2.5/weather?"
                    f"q={city}&appid={OPENWEATHER_API_KEY}&units=metric"
                )
            elif lat is not None and lon is not None:
                url = (
                    f"https://api.openweathermap.org/data/2.5/weather?"
                    f"lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
                )
            else:
                url = (
                    f"https://api.openweathermap.org/data/2.5/weather?"
                    f"q=Vellore&appid={OPENWEATHER_API_KEY}&units=metric"
                )

            response = requests.get(url)
            weather_data = response.json()

            if weather_data.get("cod") == 200:

                location_name = weather_data.get("name", city or "your area")
                temperature = weather_data["main"]["temp"]
                feels_like = weather_data["main"]["feels_like"]
                humidity = weather_data["main"]["humidity"]
                description = weather_data["weather"][0]["description"]
                wind_speed = weather_data["wind"]["speed"]

                reply = (
                    f"🌤 Weather in {location_name}\n\n"
                    f"🌡 Temperature: {temperature}°C\n"
                    f"🤗 Feels Like: {feels_like}°C\n"
                    f"☁ Condition: {description.title()}\n"
                    f"💧 Humidity: {humidity}%\n"
                    f"💨 Wind Speed: {wind_speed} m/s"
                )

            else:
                reply = "Sorry, I couldn't find weather information for that location."

        except Exception:
            reply = "Unable to fetch weather information."

        return jsonify({"reply": reply})



    messages = [
        {
            "role": "system",
            "content": (
                "You are Rusho Bot, a friendly AI assistant created by "
                "Rupayan Chattaraj. Keep answers short unless the user "
                "asks for details."
            )
        }
    ]


    for turn in history[-10:]:
        role = turn.get("role")
        content = turn.get("content")

        if role in ("user", "assistant") and content:
            messages.append({
                "role": role,
                "content": content
            })

    messages.append({
        "role": "user",
        "content": user_message
    })

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages
        )

        answer = response.choices[0].message.content

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"reply": answer})

@app.route("/cricket-score", methods=["POST"])
def cricket_score():
    data = request.get_json()
    message = (data.get("message") or "").strip()

    system_prompt = (
        "You are Rusho Bot. You do NOT have access to live or real-time "
        "sports scores. If asked about a live score, current match, or "
        "recent result, clearly say you can't provide live scores and "
        "suggest the user check a live source like Cricbuzz, ESPNcricinfo, "
        "or Google. Do not guess or invent scores, team names, or results."
    )

    try:
        reply = ask_groq(system_prompt, message)
    except Exception:
        return jsonify({"error": "Something went wrong."}), 500

    return jsonify({"reply": reply})
@app.route("/resume-analyze", methods=["POST"])
def resume_analyze():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    try:
        text = extract_pdf_text(file)
    except Exception:
        return jsonify({"error": "Could not read the PDF"}), 400

    if not text.strip():
        return jsonify({"error": "No readable text found in that PDF"}), 400

    system_prompt = (
        "You are an expert resume reviewer. Analyze the resume text and give "
        "structured feedback covering: overall impression, strengths, "
        "weaknesses, formatting/ATS issues, and 3-5 concrete improvement "
        "suggestions. Be concise and actionable."
    )

    try:
        reply = ask_groq(system_prompt, text[:6000])
    except Exception:
        return jsonify({"error": "AI analysis failed"}), 500

    return jsonify({"reply": reply})


@app.route("/notes-summarize", methods=["POST"])
def notes_summarize():
    data = request.get_json()
    notes = (data.get("text") or "").strip()

    if not notes:
        return jsonify({"error": "No text provided"}), 400

    system_prompt = (
        "You summarize study notes into clear, well-organized bullet points, "
        "highlighting key concepts and definitions. Use short headings where "
        "it helps readability."
    )

    try:
        reply = ask_groq(system_prompt, notes[:8000])
    except Exception:
        return jsonify({"error": "Summarization failed"}), 500

    return jsonify({"reply": reply})


@app.route("/code-review", methods=["POST"])
def code_review():
    data = request.get_json()
    code = (data.get("code") or "").strip()
    language = (data.get("language") or "").strip()

    if not code:
        return jsonify({"error": "No code provided"}), 400

    system_prompt = (
        "You are a senior software engineer performing a code review. Review "
        "the given code for bugs, readability, performance, and best "
        "practices. List issues clearly and suggest improved snippets where "
        "relevant. Be concise but thorough."
    )
    user_prompt = f"Language: {language or 'unspecified'}\n\nCode:\n{code[:8000]}"

    try:
        reply = ask_groq(system_prompt, user_prompt)
    except Exception:
        return jsonify({"error": "Code review failed"}), 500

    return jsonify({"reply": reply})


@app.route("/email-write", methods=["POST"])
def email_write():
    data = request.get_json()
    details = (data.get("details") or "").strip()
    tone = (data.get("tone") or "Professional").strip()

    if not details:
        return jsonify({"error": "No details provided"}), 400

    system_prompt = (
        f"You write clear, well-structured emails in a {tone.lower()} tone. "
        "Include an appropriate subject line and sign-off. Return the email "
        "ready to send, with no extra commentary."
    )

    try:
        reply = ask_groq(system_prompt, details[:4000])
    except Exception:
        return jsonify({"error": "Email generation failed"}), 500

    return jsonify({"reply": reply})


@app.route("/study-planner", methods=["POST"])
def study_planner():
    data = request.get_json()
    subject = (data.get("subject") or "").strip()
    duration = (data.get("duration") or "").strip()
    goal = (data.get("goal") or "").strip()

    if not subject:
        return jsonify({"error": "No subject provided"}), 400

    system_prompt = (
        "You are a study planning assistant. Create a structured, day-by-day "
        "or week-by-week study plan based on the subject, timeframe, and "
        "goal given. Keep it realistic and organized under clear headings."
    )
    user_prompt = (
        f"Subject: {subject}\n"
        f"Timeframe: {duration or 'not specified'}\n"
        f"Goal: {goal or 'not specified'}"
    )

    try:
        reply = ask_groq(system_prompt, user_prompt)
    except Exception:
        return jsonify({"error": "Planner generation failed"}), 500

    return jsonify({"reply": reply})


@app.route("/quiz-generate", methods=["POST"])
def quiz_generate():
    data = request.get_json()
    topic = (data.get("topic") or "").strip()
    count = data.get("count", "5")
    difficulty = (data.get("difficulty") or "Medium").strip()

    if not topic:
        return jsonify({"error": "No topic provided"}), 400

    system_prompt = (
        "You generate multiple-choice quizzes. Respond ONLY with valid JSON, "
        "no preamble, no markdown fences, in exactly this shape: "
        '{"questions": [{"question": "...", "options": ["...", "...", "...", "..."], '
        '"answer": "..."}]}. The "answer" value must exactly match one of the options.'
    )
    user_prompt = f"Topic: {topic}\nNumber of questions: {count}\nDifficulty: {difficulty}"

    try:
        raw = ask_groq(system_prompt, user_prompt)
        cleaned = raw.replace("```json", "").replace("```", "").strip()
        quiz = json.loads(cleaned)
    except Exception:
        return jsonify({"error": "Quiz generation failed"}), 500

    return jsonify(quiz)


@app.route("/pdf-upload", methods=["POST"])
def pdf_upload():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    try:
        text = extract_pdf_text(file)
    except Exception:
        return jsonify({"error": "Could not read the PDF"}), 400

    if not text.strip():
        return jsonify({"error": "No readable text found in that PDF"}), 400

    return jsonify({"text": text[:15000]})


@app.route("/pdf-chat", methods=["POST"])
def pdf_chat():
    data = request.get_json()
    context = (data.get("context") or "").strip()
    question = (data.get("question") or "").strip()

    if not context or not question:
        return jsonify({"error": "Missing document context or question"}), 400

    system_prompt = (
        "Answer the user's question using only the provided document "
        "context. If the answer isn't in the document, say so clearly "
        "instead of guessing."
    )
    user_prompt = f"Document:\n{context[:12000]}\n\nQuestion: {question}"

    try:
        reply = ask_groq(system_prompt, user_prompt)
    except Exception:
        return jsonify({"error": "PDF chat failed"}), 500

    return jsonify({"reply": reply})


@app.route("/translate", methods=["POST"])
def translate():
    data = request.get_json()
    text = (data.get("text") or "").strip()
    target_language = (data.get("target_language") or "").strip()

    if not text or not target_language:
        return jsonify({"error": "Missing text or target language"}), 400

    system_prompt = (
        "You are a professional translator. Translate the given text "
        "accurately into the target language, preserving tone and meaning. "
        "Return only the translated text, with no extra commentary."
    )
    user_prompt = f"Translate to {target_language}:\n\n{text[:4000]}"

    try:
        reply = ask_groq(system_prompt, user_prompt)
    except Exception:
        return jsonify({"error": "Translation failed"}), 500

    return jsonify({"reply": reply})


@app.route("/grammar-check", methods=["POST"])
def grammar_check():
    data = request.get_json()
    text = (data.get("text") or "").strip()

    if not text:
        return jsonify({"error": "No text provided"}), 400

    system_prompt = (
        "You proofread text for grammar, spelling, punctuation, and clarity. "
        "Return the corrected version first under a 'Corrected:' heading, "
        "then a short bullet list of the key issues fixed under a "
        "'Changes:' heading."
    )

    try:
        reply = ask_groq(system_prompt, text[:4000])
    except Exception:
        return jsonify({"error": "Grammar check failed"}), 500

    return jsonify({"reply": reply})


if __name__ == "__main__":
    app.run(debug=True)
