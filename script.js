// Select DOM elements
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input #send-btn");
const chatbox = document.querySelector(".chatbox");
const chatbotToggler = document.getElementById("toggle-btn");
const chatbotCloseBtn = document.getElementById("close-btn");
const imageInput = document.getElementById("image-input");
const chatbot = document.getElementById("chatbot"); // Added this line to select the chatbot container

// Variables
let userMessage;
const API_KEY = "sk-30Eo1hJzzSDtvohMIwrvENTXCcdw3igXZD2lhZlXtsT3BlbkFJmr0-mQuZicDOACQExHiK5iy6ZaRv2JaA6HkA96_zsA"; 
const inputInitHeight = chatInput.scrollHeight;

// Web Speech API: Speech Recognition and Speech Synthesis
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false; // Single-shot recognition
recognition.lang = "en-US"; // Set language

const synth = window.speechSynthesis;

// Knowledge base extracted from images (portfolio)
const knowledgeBase = {
    "mitchell": "Mitchell is a Web Developer. He creates beautiful, responsive websites, working on a variety of projects from blogs to e-commerce platforms.",
    "mustakim": "Mustakim is a UI/UX Designer with a passion for user-friendly design. He has worked on several projects including blogs and e-commerce websites.",
    "rishabh mishra": "Rishabh Mishra is a Senior Data Analyst specializing in analytics solutions. His expertise spans across several data projects.",
    "john doe": "John Doe is a professional with expertise across various fields. His portfolio reflects a versatile skill set with projects in web development and design."
};

// Function to get relevant response from the knowledge base
const getRelevantResponse = (query) => {
    for (let [key, value] of Object.entries(knowledgeBase)) {
        if (query.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }
    return null; // Return null if no match found
};

// Combined Function to generate chatbot response
const generateChatbotResponse = (incomingChatLi) => {
    const messageElement = incomingChatLi.querySelector("p");
    const relevantResponse = getRelevantResponse(userMessage);

    if (relevantResponse) {
        // If query matches the knowledge base, use it
        messageElement.textContent = relevantResponse;
        speakResponse(relevantResponse);
        chatbox.scrollTo(0, chatbox.scrollHeight);
    } else {
        // Otherwise, use OpenAI API
        const API_URL = "https://api.openai.com/v1/chat/completions";
        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: userMessage }]
            })
        };

        fetch(API_URL, requestOptions)
            .then(res => res.json())
            .then(data => {
                const response = data.choices[0].message.content;
                messageElement.textContent = response;
                speakResponse(response);
            })
            .catch((error) => {
                messageElement.classList.add("error");
                messageElement.textContent = "Oops! Something went wrong. Please try again.";
            })
            .finally(() => chatbox.scrollTo(0, chatbox.scrollHeight));
    }
};

// Function to create chat messages
const createChatLi = (message, className, isImage = false) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", className);

    if (isImage) {
        if (className === "incoming") {
            chatLi.innerHTML = `<span class="material-symbols-outlined">smart_toy</span><img src="${message}" alt="Image from user"/>`;
        } else if (className === "outgoing") {
            chatLi.innerHTML = `<p></p><img src="${message}" alt="User uploaded image"/>`;
        }
    } else {
        chatLi.innerHTML = `<p>${message}</p>`;
        if (className === "incoming") {
            speakResponse(message);
        }
    }

    return chatLi;
};

// Function to handle OCR (Optical Character Recognition)
const performOCR = (imageUrl, incomingChatLi) => {
    const OCR_API_URL = "https://api.ocr.space/parse/imageurl";
    const requestOptions = {
        method: "POST",
        headers: {
            "apikey": "K83745742288957" // Replace with your OCR.Space API key
        },
        body: new URLSearchParams({
            "url": imageUrl,
            "language": "eng",
            "isOverlayRequired": "false"
        })
    };

    fetch(OCR_API_URL, requestOptions)
        .then(res => res.json())
        .then(data => {
            if (data.IsErroredOnProcessing) {
                incomingChatLi.querySelector("p").textContent = "Failed to extract text from the image.";
            } else {
                const extractedText = data.ParsedResults[0].ParsedText;
                incomingChatLi.querySelector("p").textContent = `Extracted Text: ${extractedText}`;
                speakResponse(extractedText);
            }
        })
        .catch(() => {
            incomingChatLi.querySelector("p").textContent = "Error occurred during OCR processing.";
        })
        .finally(() => chatbox.scrollTo(0, chatbox.scrollHeight));
};

// Function to handle chat (text)
const handleChat = () => {
    userMessage = chatInput.value.trim();
    if (!userMessage) return;
    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;

    // Append user's message
    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);

    // Append incoming "Thinking..." message
    setTimeout(() => {
        const incomingChatLi = createChatLi("Thinking...", "incoming");
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);

        // Generate response (from knowledge base or OpenAI)
        generateChatbotResponse(incomingChatLi);
    }, 600);
};

// Function to handle image upload
const handleImageUpload = () => {
    const file = imageInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const imageUrl = event.target.result;
        chatbox.appendChild(createChatLi(imageUrl, "outgoing", true));
        chatbox.scrollTo(0, chatbox.scrollHeight);

        setTimeout(() => {
            const incomingChatLi = createChatLi("Analyzing your image...", "incoming", true);
            chatbox.appendChild(incomingChatLi);
            chatbox.scrollTo(0, chatbox.scrollHeight);

            // Perform OCR
            performOCR(imageUrl, incomingChatLi);
        }, 600);
    };
    reader.readAsDataURL(file);
};

// Function to speak the chatbot's response
const speakResponse = (response) => {
    if (!synth) return; // Check if speechSynthesis is supported
    const utterance = new SpeechSynthesisUtterance(response);
    const voices = synth.getVoices();
    if (voices.length > 0) {
        utterance.voice = voices[0]; // You can choose a different voice if preferred
    }
    synth.speak(utterance);
};

// Function to start speech recognition
const startSpeechRecognition = () => {
    recognition.start();
};

// Handle Speech Recognition result
recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    chatInput.value = transcript;
    handleChat(); // Send the recognized voice message as chat
};

// Event Listeners

// Adjust textarea height on input
chatInput.addEventListener("input", () => {
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

// Send message on Enter key press (without Shift)
chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleChat();
    }
});

// Send message on button click
sendChatBtn.addEventListener("click", handleChat);

// Handle image upload
imageInput.addEventListener("change", handleImageUpload);

// **Corrected: Toggle chatbot visibility by adding/removing 'active' class on the chatbot container**
chatbotToggler.addEventListener("click", () => chatbot.classList.toggle("active"));
chatbotCloseBtn.addEventListener("click", () => chatbot.classList.remove("active"));

// Start speech recognition when the user clicks on the chat input area
chatInput.addEventListener("click", startSpeechRecognition);

// Optional: Handle speech recognition errors
recognition.onerror = (event) => {
    console.error("Speech recognition error detected: " + event.error);
};

// Optional: Stop recognition after result
recognition.onend = () => {
    // You can restart recognition here if you want continuous listening
    // recognition.start();
};
