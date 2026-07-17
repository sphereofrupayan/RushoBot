from flask import Flask, request, jsonify, send_from_directory
from groq import Groq
from dotenv import load_dotenv
import os
from pathlib import Path
import requests


env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

app = Flask(__name__, static_folder=".", static_url_path="")


client = Groq(api_key=os.getenv("GROQ_API_KEY"))
CRICKET_API_KEY = os.getenv("CRICKET_API_KEY")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")


@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/chat", methods=["POST"])
def chat():

    data = request.get_json()
    user_message = data.get("message", "")
    message = user_message.lower()

    if "score" in message or "cricket" in message or "match" in message:

        try:
            url = f"https://api.cricapi.com/v1/currentMatches?apikey={CRICKET_API_KEY}&offset=0"

            response = requests.get(url)
            cricket_data = response.json()

            if cricket_data.get("status") == "success" and cricket_data.get("data"):

                match = cricket_data["data"][0]

                reply = (
                    f"🏏 {match['name']}\n\n"
                    f"Status: {match['status']}"
                )

            else:
                reply = "Sorry, I couldn't find any live cricket matches."

        except Exception:
            reply = "Unable to fetch cricket information."

        return jsonify({"reply": reply})

    
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

        city = "Vellore"

        if " in " in message:
            city = user_message.lower().split(" in ", 1)[1].strip().title()

        try:
            url = (
                f"https://api.openweathermap.org/data/2.5/weather?"
                f"q={city}&appid={OPENWEATHER_API_KEY}&units=metric"
            )

            response = requests.get(url)
            weather_data = response.json()

            if weather_data.get("cod") == 200:

                temperature = weather_data["main"]["temp"]
                feels_like = weather_data["main"]["feels_like"]
                humidity = weather_data["main"]["humidity"]
                description = weather_data["weather"][0]["description"]
                wind_speed = weather_data["wind"]["speed"]

                reply = (
                    f"🌤 Weather in {city}\n\n"
                    f"🌡 Temperature: {temperature}°C\n"
                    f"🤗 Feels Like: {feels_like}°C\n"
                    f"☁ Condition: {description.title()}\n"
                    f"💧 Humidity: {humidity}%\n"
                    f"💨 Wind Speed: {wind_speed} m/s"
                )

            else:
                reply = f"Sorry, I couldn't find weather information for '{city}'."

        except Exception:
            reply = "Unable to fetch weather information."

        return jsonify({"reply": reply})

    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are Rusho Bot, a friendly AI assistant created by "
                    "Rupayan Chattaraj. Keep answers short unless the user "
                    "asks for details."
                )
            },
            {
                "role": "user",
                "content": user_message
            }
        ]
    )

    answer = response.choices[0].message.content

    return jsonify({"reply": answer})


if __name__ == "__main__":
    app.run(debug=True)
