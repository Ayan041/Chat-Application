const socket = io('http://localhost:8000');

const form = document.getElementById('send-container');
const messageInput = document.getElementById('messageInp');
const messageContainer = document.querySelector('.container');
const sendButton = document.querySelector('.btn');
const logoutBtn = document.getElementById('logoutBtn');

// Sound for new messages
const audio = new Audio('ting.mp3');

// Append messages to container
const append = (message, position) => {
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageElement.classList.add('message', position);
    messageContainer.appendChild(messageElement);

    if (position === 'left') {
        audio.play();
    }

    messageContainer.scrollTop = messageContainer.scrollHeight;
};

// Check for existing user
const name = localStorage.getItem('username');
if (!name) {
    window.location.href = 'login.html';
} else {
    socket.emit('new-user-joined', name);
    append(`You joined the chat as ${name}`, 'right');
}

// Handle message input changes
messageInput.addEventListener('input', () => {
    const message = messageInput.value.trim();
    sendButton.disabled = message === '';

    // Limit message length
    if (messageInput.value.length > 500) {
        messageInput.value = messageInput.value.substring(0, 500);
    }
});

// Form submission handler
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message === "") {
        messageInput.focus();
        return;
    }

    append(`You: ${message}`, 'right');
    socket.emit('send', message);
    messageInput.value = '';
    sendButton.disabled = true;
    messageInput.focus();
});

// Handle Enter key press
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
    }
});

// Logout button
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('username');
    window.location.href = 'login.html';
});

// Socket event handlers
socket.on('user-joined', (name) => {
    append(`${name} joined the chat`, 'right');
});

socket.on('receive', (data) => {
    append(`${data.name}: ${data.message}`, 'left');
});

socket.on('left', (name) => {
    append(`${name} left the chat`, 'right');
});

socket.on('connect_error', (err) => {
    append('Connection error. Please refresh the page.', 'left');
});

socket.on('disconnect', () => {
    append('Disconnected from server. Trying to reconnect...', 'left');
});