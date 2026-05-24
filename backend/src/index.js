require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Pasar io a las rutas
app.use((req, _, next) => { req.io = io; next(); });

// Rutas
app.use('/auth', require('./routes/auth'));
app.use('/qr',   require('./routes/qr'));

// Socket.io
io.on('connection', socket => {
  socket.on('join_session', sessionId => socket.join(sessionId));
});

// MongoDB + arranque
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado');
    server.listen(process.env.PORT, () =>
      console.log(`Servidor en http://localhost:${process.env.PORT}`)
    );
  })
  .catch(err => console.error('Error MongoDB:', err));