const textarea = document.getElementById('textarea');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const registerButton = document.getElementById('register');
const loginButton = document.getElementById('login');

let ws;
let token;

registerButton.addEventListener('click', async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    if (response.ok) {
        alert('Registered successfully!');
    }
});

loginButton.addEventListener('click', async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    if (response.ok) {
        const data = await response.json();
        token = data.token;
        startWebSocket();
        loadNote();
    } else {
        alert('Login failed!');
    }
});

function startWebSocket() {
    ws = new WebSocket('ws://localhost:3000');
    ws.onmessage = (event) => {
        textarea.value = event.data;
    };
}

textarea.addEventListener('input', () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(textarea.value);
    }
});

async function loadNote() {
    const response = await fetch('/note', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const note = await response.json();
    textarea.value = note.content;
}
