let btn = document.querySelector("#btn");
let content = document.querySelector("#content");
let voice = document.querySelector("#voice");
let textInput = document.querySelector("#textInput");
let sendBtn = document.querySelector("#sendBtn");
let historyList = document.querySelector("#historyList");
let clearHistoryBtn = document.querySelector("#clearHistoryBtn");
let responseText = document.querySelector("#responseText");

function speak(text) {
    if (responseText) {
        responseText.innerText = text;
    }
    let text_speak = new SpeechSynthesisUtterance(text);
    text_speak.rate = 1;
    text_speak.pitch = 1;
    text_speak.volume = 1;
    text_speak.lang = "hi-IN";
    window.speechSynthesis.speak(text_speak);
}

function wishMe() {
    let day = new Date();
    let hours = day.getHours();
    if (hours >= 0 && hours < 12) {
        speak("Good Morning");
    } else if (hours >= 12 && hours < 17) {
        speak("Good Afternoon");
    } else {
        speak("Good Evening");
    }
}

function updateHistoryUI() {
    if (!historyList) return;
    historyList.innerHTML = "";
    let history = JSON.parse(localStorage.getItem("rushoBotHistory")) || [];
    
    history.forEach((item, index) => {
        let li = document.createElement("li");
        
        let textSpan = document.createElement("span");
        textSpan.className = "history-text";
        textSpan.textContent = item;
        textSpan.addEventListener("click", () => {
            content.innerText = item;
            takecommand(item.toLowerCase());
        });
        
        let deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-item-btn";
        deleteBtn.innerHTML = "&times;";
        deleteBtn.title = "Delete item";
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteHistoryItem(index);
        });
        
        li.appendChild(textSpan);
        li.appendChild(deleteBtn);
        historyList.appendChild(li);
    });
}

function addToHistory(command) {
    if (!command.trim()) return;
    let history = JSON.parse(localStorage.getItem("rushoBotHistory")) || [];
    
    if (history[0] === command) return;
    
    history = history.filter(item => item !== command);
    history.unshift(command);
    
    if (history.length > 20) history.pop();
    localStorage.setItem("rushoBotHistory", JSON.stringify(history));
    updateHistoryUI();
}

function deleteHistoryItem(index) {
    let history = JSON.parse(localStorage.getItem("rushoBotHistory")) || [];
    history.splice(index, 1);
    localStorage.setItem("rushoBotHistory", JSON.stringify(history));
    updateHistoryUI();
}

let speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = new speechRecognition();

recognition.onresult = (event) => {
    let currentIndex = event.resultIndex;
    let transcript = event.results[currentIndex][0].transcript;
    content.innerText = transcript;
    addToHistory(transcript);
    takecommand(transcript.toLowerCase());
};

window.addEventListener('load', () => {
    btn = document.querySelector("#btn"); 
    content = document.querySelector("#content");
    voice = document.querySelector("#voice");
    textInput = document.querySelector("#textInput");
    sendBtn = document.querySelector("#sendBtn");
    historyList = document.querySelector("#historyList");
    clearHistoryBtn = document.querySelector("#clearHistoryBtn");
    responseText = document.querySelector("#responseText");
    
    updateHistoryUI();
    wishMe();
    speak("I am Rusho Bot, your virtual assistant. How can I help you?");
    
    if (btn) {
        btn.addEventListener("click", () => {
            recognition.start();
            btn.style.display = "none";
            voice.style.display = "block";
        });
    }

    if (sendBtn && textInput) {
        sendBtn.addEventListener("click", () => {
            let textCommand = textInput.value.trim();
            if (textCommand) {
                content.innerText = textCommand;
                addToHistory(textCommand);
                takecommand(textCommand.toLowerCase());
                textInput.value = "";
            }
        });

        textInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                sendBtn.click();
            }
        });
    }

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener("click", () => {
            localStorage.removeItem("rushoBotHistory");
            updateHistoryUI();
        });
    }
});

async function askAI(message) {

    const response = await fetch("/chat", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            message: message
        })

    });

    const data = await response.json();

    return data.reply;

}

function takecommand(message) {
    btn.style.display = "flex";
    voice.style.display = "none";
    
    if (message.includes("hello") || message.includes("hi")) {
        speak("Hello, what can I help you?");
    } 
    else if (message.includes("who are you")) {
        speak("I am Rusho Bot, your virtual assistant, created by Rupayan Sir.");
    }
    else if (message.includes("open google")) {
        speak("Opening Google...");
        window.open("https://google.com", "_blank");
    }
    else if (message.includes("open youtube")) {
        speak("Opening YouTube...");
        window.open("https://youtube.com", "_blank");
    }
    else if (message.includes("open github")) {
        speak("Opening GitHub...");
        window.open("https://github.com", "_blank");
    }
    else if (message.includes("open facebook")) {
        speak("Opening Facebook...");
        window.open("https://facebook.com", "_blank");
    }
    else if (message.includes("open twitter")) {
        speak("Opening Twitter...");
        window.open("https://twitter.com", "_blank");
    }
    else if (message.includes("open instagram")) {
        speak("Opening Instagram...");
        window.open("https://instagram.com", "_blank");
    }
    else if (message.includes("open linkedin")) {
        speak("Opening LinkedIn...");
        window.open("https://linkedin.com", "_blank");
    }
     else if (message.includes("good evening")) {
        speak("Good evening! How can I assist you?");
    }
    else if (message.includes("good morning")) {
        speak("Good morning! How can I assist you?");
    }
    else if (message.includes("good afternoon")) {
        speak("Good afternoon! How can I assist you?");
    }
    else if (message.includes("open whatsapp")) {
        speak("Opening WhatsApp...");
        window.open("https://web.whatsapp.com", "_blank");
    }
    else if(message.includes("what time is it") || message.includes("current time") || message.includes("time now")|| message.includes("tell me the time") || message.includes("can you tell me the time")|| message.includes("could you tell me the time") || message.includes("do you know the time") || message.includes("what's the time") || message.includes("what is the time")||message.includes("time")) {
        let now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        let ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        let timeString = `${hours}:${minutes} ${ampm}`;
        speak("The current time is " + timeString);
    }
    else if (message.includes("what's the date") || message.includes("what is the date") || message.includes("current date") || message.includes("date now") || message.includes("tell me the date") || message.includes("can you tell me the date") || message.includes("could you tell me the date") || message.includes("do you know the date") || message.includes("date")) {
        let now = new Date();
        let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let dateString = now.toLocaleDateString('en-US', options);
        speak("Today's date is " + dateString);
    }
    else if(message.includes("weather") || message.includes("what's the weather") || message.includes("what is the weather") || message.includes("current weather") || message.includes("weather now") || message.includes("tell me the weather") || message.includes("can you tell me the weather") || message.includes("could you tell me the weather") || message.includes("do you know the weather")) {
        speak("I currently don't have access to weather information, but you can check it on Google.");
        window.open("https://www.google.com/search?q=weather", "_blank");
    }
    else if (message.includes("who created you") || message.includes("your creator") || message.includes("who is your creator") || message.includes("who made you")) {
        speak("I was created by Rupayan Chattaraj, a talented web developer with a passion for technology.");
    }
    else if (message.includes("what can you do") || message.includes("your capabilities") || message.includes("what are your features") || message.includes("what can you help with")) {
        speak("I can assist you with various tasks such as opening websites, providing current time and date, taking screenshots, and answering general questions. Just ask me anything!");
    }
    else if(message.includes("who is rupayan") || message.includes("rupayan sir") || message.includes("rupayan")) {
        speak("Rupayan Chattaraj is a skilled web developer and the creator of Rusho Bot. He has a passion for technology and is dedicated to providing helpful solutions through his virtual assistant.");
    }
    else if (message.includes("thank you") || message.includes("thanks")) {
        speak("You're welcome! If you have any more questions, feel free to ask.");
    }
    else if (message.includes("how are you")) {
        speak("I am doing well, thank you! How can I assist you today?");
    }
    else if (message.includes("what is your name") || message.includes("your name")) {
        speak("My name is Rusho Bot, your virtual assistant.");
    }
    else if (message.includes("take screenshot") || message.includes("screenshot")) {
        speak("Taking screenshot");

        const video = document.getElementById("bgVideo");
        if (video) video.style.visibility = "hidden";

        html2canvas(document.documentElement, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#000",
            ignoreElements: (el) => el.tagName === "VIDEO"
        }).then(canvas => {
            if (video) video.style.visibility = "visible";

            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "RushoBotScreenshot.png";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                speak("Screenshot taken successfully");
            }, "image/png");

        }).catch((err) => {
            if (video) video.style.visibility = "visible";
            console.error("Screenshot error:", err);
            speak("Unable to take screenshot");
        });
    }
    else {

    let finalMessage = message
        .replace("rusho bot", "")
        .replace("rusho", "")
        .replace("bot", "")
        .replace("ruso got", "")
        .replace("ruso bought", "")
        .replace("rusho got", "")
        .replace("rusho bought", "")
        .replace("search", "")
        .replace("google", "")
        .replace("search for", "")
        .replace("google for", "")
        .replace("search about", "")
        .replace("google about", "")
        .trim();

    responseText.innerText = "Thinking...";

    askAI(finalMessage)
        .then(reply => {
            speak(reply);
        })
        .catch(error => {
            console.error(error);
            speak("Sorry, I couldn't connect to the AI.");
        });

}
}

function copyMail() {
    const email = "rupayanchattaraj@gmail.com";
    navigator.clipboard.writeText(email)
        .then(() => {
            alert("Email copied to clipboard!");
        })
        .catch(() => {
            alert("Failed to copy email.");
        });
}