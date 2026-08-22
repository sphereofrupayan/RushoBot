let btn = document.querySelector("#btn");
let content = document.querySelector("#content");
let voice = document.querySelector("#voice");
let textInput = document.querySelector("#textInput");
let sendBtn = document.querySelector("#sendBtn");
let historyList = document.querySelector("#historyList");
let clearHistoryBtn = document.querySelector("#clearHistoryBtn");
let responseText = document.querySelector("#responseText");
let userLocation = { lat: null, lon: null };
let conversationHistory = [];
let newChatBtn = document.querySelector("#newChatBtn");
function getUserLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve();
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation.lat = position.coords.latitude;
                userLocation.lon = position.coords.longitude;
                resolve();
            },
            () => {
                resolve(); 
            },
            { timeout: 5000 }
        );
    });
}
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
function hasWord(text, ...words) {
    return words.some(word => new RegExp(`\\b${word}\\b`, "i").test(text));
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
    newChatBtn = document.querySelector("#newChatBtn");

if (newChatBtn) {
    newChatBtn.addEventListener("click", () => {
        conversationHistory = [];
        responseText.innerText = "New chat started. Waiting for command...";
        speak("Starting a new chat. How can I help you?");
    });
}
    getUserLocation();
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
async function fetchCricketScore(message) {
    try {
        const response = await fetch("/cricket-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message })
        });
        const data = await response.json();

        if (data.error) {
            speak("Sorry, I couldn't fetch the score right now.");
        } else {
            speak(data.reply);
        }
    } catch (err) {
        console.error(err);
        speak("Sorry, I couldn't reach the score service.");
    }
}
async function askAI(message) {

    conversationHistory.push({ role: "user", content: message });

    const response = await fetch("/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: message,
            history: conversationHistory,
            lat: userLocation.lat,
            lon: userLocation.lon
        })
    });

    const data = await response.json();

    conversationHistory.push({ role: "assistant", content: data.reply });

    // keep memory from growing forever — trim to last 20 messages
    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
    }

    return data.reply;
}

function takecommand(message) {
    btn.style.display = "flex";
    voice.style.display = "none";
    
    if (hasWord(message, "hello", "hi")) {
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
    else if (hasWord(message, "what time is it", "current time", "time now", "tell me the time", "can you tell me the time", "could you tell me the time", "do you know the time", "what's the time", "what is the time", "time")) {
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
    else if (hasWord(message, "what's the date", "what is the date", "current date", "date now", "tell me the date", "can you tell me the date", "could you tell me the date", "do you know the date", "date")) {
        let now = new Date();
        let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let dateString = now.toLocaleDateString('en-US', options);
        speak("Today's date is " + dateString);
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
    else if (hasWord(message, "cricket score", "match score", "live score", "icc score", "cricket match", "score update", "current score")) {
    responseText.innerText = "Fetching latest scores...";
    fetchCricketScore(message);
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
    .replace(/\brusho bot\b/gi, "")
    .replace(/\brusho\b/gi, "")
    .replace(/\bbot\b/gi, "")
    .replace(/\bruso got\b/gi, "")
    .replace(/\bruso bought\b/gi, "")
    .replace(/\brusho got\b/gi, "")
    .replace(/\brusho bought\b/gi, "")
    .replace(/\bsearch for\b/gi, "")
    .replace(/\bgoogle for\b/gi, "")
    .replace(/\bsearch about\b/gi, "")
    .replace(/\bgoogle about\b/gi, "")
    .replace(/\bsearch\b/gi, "")
    .replace(/\bgoogle\b/gi, "")
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


const TOOL_CONFIG = {
    resume: {
        title: "Resume Analyzer",
        fields: [
            { type: "file", name: "file", label: "Upload your resume (PDF)", accept: ".pdf" }
        ],
        endpoint: "/resume-analyze",
        submitLabel: "Analyze Resume",
        isFormData: true
    },
    notes: {
        title: "Notes Summarizer",
        fields: [
            { type: "textarea", name: "text", label: "Paste your notes", placeholder: "Paste the notes you want summarized...", rows: 8 }
        ],
        endpoint: "/notes-summarize",
        submitLabel: "Summarize Notes"
    },
    code: {
        title: "Code Reviewer",
        fields: [
            { type: "text", name: "language", label: "Language (optional)", placeholder: "e.g. Python, JavaScript" },
            { type: "textarea", name: "code", label: "Paste your code", placeholder: "Paste the code you want reviewed...", rows: 10 }
        ],
        endpoint: "/code-review",
        submitLabel: "Review Code"
    },
    email: {
        title: "Email Writer",
        fields: [
            { type: "select", name: "tone", label: "Tone", options: ["Professional", "Friendly", "Formal", "Persuasive"] },
            { type: "textarea", name: "details", label: "What should the email say?", placeholder: "e.g. Ask my manager for two days of leave next week...", rows: 6 }
        ],
        endpoint: "/email-write",
        submitLabel: "Generate Email"
    },
    planner: {
        title: "Study Planner",
        fields: [
            { type: "text", name: "subject", label: "Subject / Exam", placeholder: "e.g. Oracle SQL fundamentals" },
            { type: "text", name: "duration", label: "Timeframe", placeholder: "e.g. 2 weeks, 5 days" },
            { type: "textarea", name: "goal", label: "Goal (optional)", placeholder: "e.g. Pass the certification exam", rows: 4 }
        ],
        endpoint: "/study-planner",
        submitLabel: "Create Plan"
    },
    quiz: {
        title: "Quiz Generator",
        fields: [
            { type: "text", name: "topic", label: "Topic", placeholder: "e.g. Oracle multitenant architecture" },
            { type: "select", name: "difficulty", label: "Difficulty", options: ["Easy", "Medium", "Hard"] },
            { type: "select", name: "count", label: "Number of questions", options: ["3", "5", "10"] }
        ],
        endpoint: "/quiz-generate",
        submitLabel: "Generate Quiz",
        isQuiz: true
    },
    pdf: {
        title: "PDF Chat",
        isPdfChat: true
    },
    translator: {
        title: "Translator",
        fields: [
            { type: "text", name: "target_language", label: "Translate to", placeholder: "e.g. French, Hindi, Spanish" },
            { type: "textarea", name: "text", label: "Text to translate", placeholder: "Paste the text you want translated...", rows: 6 }
        ],
        endpoint: "/translate",
        submitLabel: "Translate"
    },
    grammar: {
        title: "Grammar Checker",
        fields: [
            { type: "textarea", name: "text", label: "Paste your text", placeholder: "Paste the text you want checked...", rows: 6 }
        ],
        endpoint: "/grammar-check",
        submitLabel: "Check Grammar"
    }
};

const toolModalOverlay = document.getElementById("toolModalOverlay");
const toolModalTitle = document.getElementById("toolModalTitle");
const toolModalBody = document.getElementById("toolModalBody");
const toolModalClose = document.getElementById("toolModalClose");

function closeToolModal() {
    toolModalOverlay.classList.remove("active");
    toolModalBody.innerHTML = "";
}

if (toolModalClose) {
    toolModalClose.addEventListener("click", closeToolModal);
}

if (toolModalOverlay) {
    toolModalOverlay.addEventListener("click", (e) => {
        if (e.target === toolModalOverlay) closeToolModal();
    });
}

function buildField(field) {
    const wrapper = document.createElement("div");
    wrapper.className = "tool-field";

    const label = document.createElement("label");
    label.textContent = field.label;
    wrapper.appendChild(label);

    let input;
    if (field.type === "textarea") {
        input = document.createElement("textarea");
        input.rows = field.rows || 5;
        input.placeholder = field.placeholder || "";
    } else if (field.type === "select") {
        input = document.createElement("select");
        field.options.forEach(opt => {
            const option = document.createElement("option");
            option.value = opt;
            option.textContent = opt;
            input.appendChild(option);
        });
    } else if (field.type === "file") {
        input = document.createElement("input");
        input.type = "file";
        input.accept = field.accept || "";
    } else {
        input = document.createElement("input");
        input.type = "text";
        input.placeholder = field.placeholder || "";
    }
    input.dataset.fieldName = field.name;
    wrapper.appendChild(input);
    return wrapper;
}

function openToolModal(toolKey) {
    const config = TOOL_CONFIG[toolKey];
    if (!config) return;

    toolModalTitle.textContent = config.title;
    toolModalBody.innerHTML = "";
    toolModalOverlay.classList.add("active");

    if (config.isPdfChat) {
        buildPdfChatModal();
        return;
    }

    const form = document.createElement("div");
    config.fields.forEach(field => form.appendChild(buildField(field)));

    const submitBtn = document.createElement("button");
    submitBtn.className = "tool-submit-btn";
    submitBtn.textContent = config.submitLabel;

    const resultBox = document.createElement("div");

    submitBtn.addEventListener("click", async () => {
        resultBox.className = "";
        resultBox.textContent = "";
        submitBtn.disabled = true;
        submitBtn.textContent = "Working...";

        try {
            let response;

            if (config.isFormData) {
                const formData = new FormData();
                config.fields.forEach(field => {
                    const el = form.querySelector(`[data-field-name="${field.name}"]`);
                    if (field.type === "file") {
                        if (el.files[0]) formData.append(field.name, el.files[0]);
                    } else {
                        formData.append(field.name, el.value);
                    }
                });
                response = await fetch(config.endpoint, { method: "POST", body: formData });
            } else {
                const payload = {};
                config.fields.forEach(field => {
                    const el = form.querySelector(`[data-field-name="${field.name}"]`);
                    payload[field.name] = el.value;
                });
                response = await fetch(config.endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            }

            const data = await response.json();

            if (!response.ok || data.error) {
                resultBox.className = "tool-error";
                resultBox.textContent = data.error || "Something went wrong.";
            } else if (config.isQuiz) {
                renderQuiz(resultBox, data.questions || []);
            } else {
                resultBox.className = "tool-result";
                resultBox.textContent = data.reply;
            }
        } catch (err) {
            resultBox.className = "tool-error";
            resultBox.textContent = "Could not reach the server.";
        }

        submitBtn.disabled = false;
        submitBtn.textContent = config.submitLabel;
    });

    toolModalBody.appendChild(form);
    toolModalBody.appendChild(submitBtn);
    toolModalBody.appendChild(resultBox);
}

function renderQuiz(container, questions) {
    container.className = "";
    container.innerHTML = "";

    if (!questions.length) {
        container.className = "tool-error";
        container.textContent = "No questions were generated. Try again.";
        return;
    }

    questions.forEach((q, i) => {
        const qWrap = document.createElement("div");
        qWrap.className = "quiz-question";

        const qText = document.createElement("p");
        qText.className = "q-text";
        qText.textContent = `${i + 1}. ${q.question}`;
        qWrap.appendChild(qText);

        (q.options || []).forEach(opt => {
            const optBtn = document.createElement("button");
            optBtn.className = "quiz-option";
            optBtn.textContent = opt;
            optBtn.addEventListener("click", () => {
                const buttons = qWrap.querySelectorAll(".quiz-option");
                buttons.forEach(b => (b.disabled = true));
                if (opt === q.answer) {
                    optBtn.classList.add("correct");
                } else {
                    optBtn.classList.add("incorrect");
                    buttons.forEach(b => {
                        if (b.textContent === q.answer) b.classList.add("correct");
                    });
                }
            });
            qWrap.appendChild(optBtn);
        });

        container.appendChild(qWrap);
    });
}

function buildPdfChatModal() {
    let pdfContext = "";

    const uploadWrap = document.createElement("div");
    uploadWrap.className = "tool-field";
    const uploadLabel = document.createElement("label");
    uploadLabel.textContent = "Upload a PDF to chat with";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".pdf";
    uploadWrap.appendChild(uploadLabel);
    uploadWrap.appendChild(fileInput);

    const uploadBtn = document.createElement("button");
    uploadBtn.className = "tool-submit-btn";
    uploadBtn.textContent = "Upload PDF";

    const statusBox = document.createElement("div");
    statusBox.style.display = "none";

    const questionWrap = document.createElement("div");
    questionWrap.className = "tool-field";
    questionWrap.style.display = "none";
    questionWrap.style.marginTop = "18px";
    const questionLabel = document.createElement("label");
    questionLabel.textContent = "Ask a question about the document";
    const questionInput = document.createElement("input");
    questionInput.type = "text";
    questionInput.placeholder = "e.g. Summarize section 2";
    questionWrap.appendChild(questionLabel);
    questionWrap.appendChild(questionInput);

    const askBtn = document.createElement("button");
    askBtn.className = "tool-submit-btn";
    askBtn.textContent = "Ask";
    askBtn.style.display = "none";

    const answerBox = document.createElement("div");

    uploadBtn.addEventListener("click", async () => {
        if (!fileInput.files[0]) return;
        uploadBtn.disabled = true;
        uploadBtn.textContent = "Uploading...";
        statusBox.style.display = "block";
        statusBox.className = "tool-result";
        statusBox.textContent = "Reading PDF...";

        const formData = new FormData();
        formData.append("file", fileInput.files[0]);

        try {
            const response = await fetch("/pdf-upload", { method: "POST", body: formData });
            const data = await response.json();

            if (!response.ok || data.error) {
                statusBox.className = "tool-error";
                statusBox.textContent = data.error || "Could not read the PDF.";
            } else {
                pdfContext = data.text;
                statusBox.textContent = "PDF loaded. Ask a question below.";
                questionWrap.style.display = "block";
                askBtn.style.display = "block";
            }
        } catch (err) {
            statusBox.className = "tool-error";
            statusBox.textContent = "Could not reach the server.";
        }

        uploadBtn.disabled = false;
        uploadBtn.textContent = "Upload PDF";
    });

    askBtn.addEventListener("click", async () => {
        const question = questionInput.value.trim();
        if (!question || !pdfContext) return;

        askBtn.disabled = true;
        askBtn.textContent = "Thinking...";
        answerBox.className = "tool-result";
        answerBox.textContent = "Thinking...";

        try {
            const response = await fetch("/pdf-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ context: pdfContext, question: question })
            });
            const data = await response.json();

            if (!response.ok || data.error) {
                answerBox.className = "tool-error";
                answerBox.textContent = data.error || "Something went wrong.";
            } else {
                answerBox.className = "tool-result";
                answerBox.textContent = data.reply;
            }
        } catch (err) {
            answerBox.className = "tool-error";
            answerBox.textContent = "Could not reach the server.";
        }

        askBtn.disabled = false;
        askBtn.textContent = "Ask";
    });

    toolModalBody.appendChild(uploadWrap);
    toolModalBody.appendChild(uploadBtn);
    toolModalBody.appendChild(statusBox);
    toolModalBody.appendChild(questionWrap);
    toolModalBody.appendChild(askBtn);
    toolModalBody.appendChild(answerBox);
}

document.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('click', () => {
        const tool = card.dataset.tool;
        if (tool === 'chat') {
            document.getElementById('textInput')?.focus();
        } else {
            openToolModal(tool);
        }
    });
});
const toolCards = document.querySelectorAll('.tool-card');
const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const card = entry.target;
            const index = Array.from(toolCards).indexOf(card);
            card.style.transitionDelay = `${index * 90}ms`;
            card.classList.add('visible');
            cardObserver.unobserve(card);
        }
    });
}, { threshold: 0.15 });
const featuresHeader = document.querySelector('.features-header');
if (featuresHeader) {
    const headerObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                headerObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    headerObserver.observe(featuresHeader);
}

const featureCards = document.querySelectorAll('.feature-card');
const featureCardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const card = entry.target;
            const index = Array.from(featureCards).indexOf(card);
            card.style.transitionDelay = `${index * 100}ms`;
            card.classList.add('visible');
            featureCardObserver.unobserve(card);
        }
    });
}, { threshold: 0.2 });

featureCards.forEach(card => featureCardObserver.observe(card));
toolCards.forEach(card => cardObserver.observe(card));

const dotsCanvas = document.getElementById('toolsDotsCanvas');

if (dotsCanvas) {
    const dctx = dotsCanvas.getContext('2d');
    let dotsWrapEl = document.getElementById('toolsHeaderCanvasWrap');
    let dcW = 0, dcH = 0;
    let dotMouseX = -9999, dotMouseY = -9999;

    function resizeDotsCanvas() {
        const rect = dotsWrapEl.getBoundingClientRect();
        dcW = dotsCanvas.width = rect.width;
        dcH = dotsCanvas.height = rect.height;
    }
    resizeDotsCanvas();
    window.addEventListener('resize', resizeDotsCanvas);

    dotsWrapEl.addEventListener('mousemove', (e) => {
        const rect = dotsWrapEl.getBoundingClientRect();
        dotMouseX = e.clientX - rect.left;
        dotMouseY = e.clientY - rect.top;
    });
    dotsWrapEl.addEventListener('mouseleave', () => {
        dotMouseX = -9999;
        dotMouseY = -9999;
    });

    const DOT_COUNT = 170;

const dots = Array.from({ length: DOT_COUNT }, () => ({
    x: Math.random() * dcW,
    y: Math.random() * dcH,

   
    vx: (Math.random() - 0.5) * 1.8,
    vy: (Math.random() - 0.5) * 1.8,


    r: Math.random() * 1.5 + 0.5,


    baseAlpha: Math.random() * 0.4 + 0.25
}));

function drawDots() {
    dctx.clearRect(0, 0, dcW, dcH);

    dots.forEach(dot => {

        const dx = dot.x - dotMouseX;
        const dy = dot.y - dotMouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const repelRadius = 120;

        if (dist < repelRadius) {

            const force =
                Math.pow((repelRadius - dist) / repelRadius, 2);

            const angle = Math.atan2(dy, dx);

            dot.vx += Math.cos(angle) * force * 1.4;
            dot.vy += Math.sin(angle) * force * 1.4;
        }

        
        dot.vx *= 0.965;
        dot.vy *= 0.965;

     
        const maxSpeed = 2.8;

        const speed = Math.sqrt(
            dot.vx * dot.vx +
            dot.vy * dot.vy
        );

        if (speed > maxSpeed) {
            dot.vx = (dot.vx / speed) * maxSpeed;
            dot.vy = (dot.vy / speed) * maxSpeed;
        }

        dot.x += dot.vx;
        dot.y += dot.vy;

       
        const margin = 20;

if (dot.x < -margin) dot.x = dcW + margin;
if (dot.x > dcW + margin) dot.x = -margin;

if (dot.y < -margin) dot.y = dcH + margin;
if (dot.y > dcH + margin) dot.y = -margin;

        
        dctx.beginPath();
        dctx.arc(
            dot.x,
            dot.y,
            dot.r,
            0,
            Math.PI * 2
        );

        dctx.fillStyle =
            `rgba(255,255,255,${dot.baseAlpha})`;

        dctx.shadowColor =
            'rgba(255,255,255,0.35)';

        dctx.shadowBlur = 2;

        dctx.fill();
    });

    requestAnimationFrame(drawDots);
}

drawDots();
} else {
    console.warn('toolsDotsCanvas not found in DOM');
}
document.querySelectorAll('.tilt-card').forEach(card => {
    const shine = card.querySelector('.tilt-shine');
    let targetRotX = 0, targetRotY = 0, targetScale = 1, targetY = 0;
    let curRotX = 0, curRotY = 0, curScale = 1, curY = 0;
    let hovering = false;
    let lastMouseX = 0, lastMouseY = 0;

    card.addEventListener('mousemove', (e) => {
        if (!card.classList.contains('visible')) return;

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        lastMouseX = x;
        lastMouseY = y;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        targetRotY = ((x - centerX) / centerX) * 12;
        targetRotX = -((y - centerY) / centerY) * 12;
        targetScale = 1.04;
        targetY = -6;
        hovering = true;
    });

    card.addEventListener('mouseleave', () => {
        targetRotX = 0;
        targetRotY = 0;
        targetScale = 1;
        targetY = 0;
        hovering = false;
    });

    function animateTilt() {
        
        curRotX += (targetRotX - curRotX) * 0.25;
        curRotY += (targetRotY - curRotY) * 0.25;
        curScale += (targetScale - curScale) * 0.2;
        curY += (targetY - curY) * 0.2;

        card.style.transform = `translateY(${curY}px) perspective(1000px) rotateX(${curRotX}deg) rotateY(${curRotY}deg) scale(${curScale})`;

        if (shine) {
            shine.style.background = hovering
                ? `radial-gradient(circle at ${lastMouseX}px ${lastMouseY}px, rgba(255,255,255,0.28), transparent 60%)`
                : `radial-gradient(circle at 50% 50%, rgba(255,255,255,0), transparent 60%)`;
        }

        requestAnimationFrame(animateTilt);
    }
    animateTilt();
});
const spotlightCanvas = document.getElementById('cursorSpotlight');

if (spotlightCanvas) {
    const sctx = spotlightCanvas.getContext('2d');
    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;

    function resizeSpotlight() {
        spotlightCanvas.width = window.innerWidth;
        spotlightCanvas.height = window.innerHeight;
    }
    resizeSpotlight();
    window.addEventListener('resize', resizeSpotlight);

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    window.addEventListener('touchmove', (e) => {
        if (e.touches[0]) {
            mouseX = e.touches[0].clientX;
            mouseY = e.touches[0].clientY;
        }
    });

    const POINT_COUNT = 22;
    const trail = Array.from({ length: POINT_COUNT }, () => ({ x: mouseX, y: mouseY }));

    function updateTrail() {
        trail[0].x += (mouseX - trail[0].x) * 0.35;
        trail[0].y += (mouseY - trail[0].y) * 0.35;

        for (let i = 1; i < trail.length; i++) {
            const ease = 0.32 - i * 0.006;
            trail[i].x += (trail[i - 1].x - trail[i].x) * Math.max(ease, 0.08);
            trail[i].y += (trail[i - 1].y - trail[i].y) * Math.max(ease, 0.08);
        }
    }

    function drawSmokeLine() {
        sctx.clearRect(0, 0, spotlightCanvas.width, spotlightCanvas.height);

        for (let i = 0; i < trail.length - 1; i++) {
            const p1 = trail[i];
            const p2 = trail[i + 1];
            const t = i / trail.length;

            const width = Math.max(10 * (1 - t), 0.5);
            const alpha = Math.max(0.5 * (1 - t), 0);

            const gradient = sctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            gradient.addColorStop(0, `rgba(176, 91, 167, ${alpha})`);
            gradient.addColorStop(1, `rgba(105, 125, 255, ${alpha * 0.7})`);

            sctx.strokeStyle = gradient;
            sctx.lineWidth = width;
            sctx.lineCap = 'round';
            sctx.shadowColor = 'rgba(176, 91, 167, 0.6)';
            sctx.shadowBlur = 12 * (1 - t);

            sctx.beginPath();
            sctx.moveTo(p1.x, p1.y);
            sctx.lineTo(p2.x, p2.y);
            sctx.stroke();
        }

        const head = trail[0];
        const glow = sctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 40);
        glow.addColorStop(0, 'rgba(176, 91, 167, 0.45)');
        glow.addColorStop(1, 'rgba(176, 91, 167, 0)');
        sctx.fillStyle = glow;
        sctx.beginPath();
        sctx.arc(head.x, head.y, 40, 0, Math.PI * 2);
        sctx.fill();

        updateTrail();
        requestAnimationFrame(drawSmokeLine);
    }
    drawSmokeLine();
} else {
    console.warn('cursorSpotlight canvas not found in DOM');
}
const constellationCanvas = document.getElementById('constellationCanvas');

if (constellationCanvas) {
    const cctx = constellationCanvas.getContext('2d');
    let featuresSectionEl = document.getElementById('featuresSection');
    let ccW = 0, ccH = 0;
    let constMouseX = -9999, constMouseY = -9999;
    const BLEED = 40;

    function resizeConstellation() {
        const rect = featuresSectionEl.getBoundingClientRect();
        ccW = constellationCanvas.width = rect.width + BLEED * 2;
        ccH = constellationCanvas.height = rect.height + BLEED * 2;
    }
    resizeConstellation();
    window.addEventListener('resize', resizeConstellation);

    featuresSectionEl.addEventListener('mousemove', (e) => {
        const rect = featuresSectionEl.getBoundingClientRect();
        constMouseX = (e.clientX - rect.left) + BLEED;
        constMouseY = (e.clientY - rect.top) + BLEED;
    });
    featuresSectionEl.addEventListener('mouseleave', () => {
        constMouseX = -9999;
        constMouseY = -9999;
    });

    const NODE_COUNT = 55;
    const LINK_DIST = 130;
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * ccW,
        y: Math.random() * ccH,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 1.4 + 1
    }));

    function drawConstellation() {
        cctx.clearRect(0, 0, ccW, ccH);

        nodes.forEach(node => {
            const dx = constMouseX - node.x;
            const dy = constMouseY - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 160) {
                node.x += dx * 0.01;
                node.y += dy * 0.01;
            }

            node.x += node.vx;
            node.y += node.vy;

            if (node.x < 0) node.x = ccW;
            if (node.x > ccW) node.x = 0;
            if (node.y < 0) node.y = ccH;
            if (node.y > ccH) node.y = 0;
        });

 
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i], b = nodes[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < LINK_DIST) {
                    const alpha = (1 - dist / LINK_DIST) * 0.35;
                    cctx.strokeStyle = `rgba(176, 91, 167, ${alpha})`;
                    cctx.lineWidth = 1;
                    cctx.beginPath();
                    cctx.moveTo(a.x, a.y);
                    cctx.lineTo(b.x, b.y);
                    cctx.stroke();
                }
            }
        }

 
        nodes.forEach(node => {
            cctx.beginPath();
            cctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
            cctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            cctx.shadowColor = 'rgba(105, 125, 255, 0.6)';
            cctx.shadowBlur = 4;
            cctx.fill();
        });

        requestAnimationFrame(drawConstellation);
    }
    drawConstellation();
} else {
    console.warn('constellationCanvas not found in DOM');
}
