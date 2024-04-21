const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
const photoUpload = document.getElementById("photo-upload");
let userMessage = null;
const API_KEY = "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";
const inputInitHeight = chatInput.scrollHeight;




const createChatLi = (content, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", className);
    let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").appendChild(content);
    return chatLi;
}

const handleImageUpload = () => {
    const fileInput = photoUpload;
    const file = fileInput.files[0];

    if (file) {
        const fileName = file.name;
        const fileSize = file.size;

        // Create an image element
        const imageElement = document.createElement("img");
        imageElement.src = URL.createObjectURL(file);
        imageElement.alt = fileName;
        imageElement.style.width = "250px";
        imageElement.style.height = "250px";

        // Create a chat list item with the image
        const content = document.createElement("div");
        content.appendChild(imageElement);

        // Display additional information about the image if needed
        const fileInfo = document.createElement("span");
        fileInfo.textContent = `${fileName} (${fileSize} bytes)`;
        content.appendChild(fileInfo);

        chatbox.appendChild(createChatLi(content, "outgoing"));
        chatbox.scrollTo(0, chatbox.scrollHeight);

        // Clear the file input after processing
        fileInput.value = "";

        // Handle file upload to WebSocket
        handleFileUpload(file);
    }
}

const handleFileUpload = (file) => {
    // Read the file as a Blob
    const reader = new FileReader();
    reader.onload = function (event) {
        // Send the photo data to the server
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = 30;
            canvas.height = 30;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 30, 30);
            const resizedData = canvas.toDataURL('image/jpeg');

            console.log('Sent photo to the server');
            websocket.send(resizedData); // Send the resized photo data
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

const generateResponse = (chatElement) => {
    const API_URL = "https://api.openai.com/v1/chat/completions";
    const messageElement = chatElement.querySelector("p");

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: userMessage }],
        })
    }
    fetch(API_URL, requestOptions)
        .then(res => res.json())
        .then(data => {
            messageElement.textContent = data.choices[0].message.content.trim();
        })
        .catch(() => {
            messageElement.classList.add("error");
            messageElement.textContent = "Oops! Something went wrong. Please try again.";
        })
        .finally(() => chatbox.scrollTo(0, chatbox.scrollHeight));
}

const handleChat = () => {
    userMessage = chatInput.value.trim();
    if (!userMessage && !photoUpload.files.length) return;

    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;

    if (userMessage) {
        chatbox.appendChild(createChatLi(document.createTextNode(userMessage), "outgoing"));
    }

    if (photoUpload.files.length) {
        handleImageUpload();
        return; // Do not proceed to API call for image uploads
    }

    chatbox.scrollTo(0, chatbox.scrollHeight);

    setTimeout(() => {
        const incomingChatLi = createChatLi(document.createTextNode("Thinking..."), "incoming");
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);

        // Handle API calls for text messages
        if (userMessage) {
            generateResponse(incomingChatLi);
        }
    }, 600);
}

chatInput.addEventListener("input", () => {
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleChat();
    }
});

sendChatBtn.addEventListener("click", handleChat);
closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
photoUpload.addEventListener("change", handleChat);
