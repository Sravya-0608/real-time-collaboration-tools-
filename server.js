const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

mongoose.connect('mongodb://localhost:27017/collaborative_notes', {
    useUnifiedTopology: true,
});

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
});

const NoteSchema = new mongoose.Schema({
    content: String,
});

const User = mongoose.model('User', UserSchema);
const Note = mongoose.model('Note', NoteSchema);

app.use(express.json());

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.sendStatus(201);
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
        const token = jwt.sign({ userId: user._id }, 'your_jwt_secret');
        res.json({ token });
    } else {
        res.sendStatus(401);
    }
});

app.get('/note', async (req, res) => {
    const notes = await Note.find();
    res.json(notes[0]);
});

app.put('/note', async (req, res) => {
    const { content } = req.body;
    const note = await Note.findOne();
    if (note) {
        note.content = content;
        await note.save();
    } else {
        const newNote = new Note({ content });
        await newNote.save();
    }
    res.sendStatus(200);
});

wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        await Note.updateOne({}, { content: message }, { upsert: true });
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});

app.use(express.static('public'));

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
