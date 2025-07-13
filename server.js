const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const fs = require('fs');
const path = require('path');

const users = {};
let registeredUsers = {};
const usersFile = 'users.json';

// Load existing users
if (fs.existsSync(usersFile)) {
    try {
        registeredUsers = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    } catch (err) {
        console.error('Error reading users file:', err);
    }
}

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    if (registeredUsers[username]) {
        return res.status(409).send('Username already exists');
    }

    registeredUsers[username] = { password };

    fs.writeFile(usersFile, JSON.stringify(registeredUsers), (err) => {
        if (err) {
            console.error('Error saving users:', err);
            return res.status(500).send('Registration failed');
        }
        res.status(201).send('Registered successfully');
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = registeredUsers[username];

    if (!user || user.password !== password) {
        return res.status(401).send('Invalid credentials');
    }

    res.status(200).json({ username });
});

// Socket.IO
io.on('connection', (socket) => {
    console.log('New user connected');

    socket.on('new-user-joined', (name) => {
        users[socket.id] = name;
        socket.broadcast.emit('user-joined', name);
    });

    socket.on('send', (message) => {
        socket.broadcast.emit('receive', {
            message,
            name: users[socket.id]
        });
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            socket.broadcast.emit('left', users[socket.id]);
            delete users[socket.id];
        }
    });
});

// Start server
const PORT = process.env.PORT || 8000;
http.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});