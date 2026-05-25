require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');

const app = express();

const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  'http://127.0.0.1:5500',
  'https://127.0.0.1:5500',
  'null'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Permitir cualquier puerto de localhost
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
      return callback(null, true);
    }
    callback(new Error('Origen no permitido por CORS'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
  credentials: true
};

const io = new Server(server, {
  cors: corsOptions,
  transports: ['polling'],
  allowEIO3: true
});

app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // Lo manejamos en el frontend
}));

app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});
app.use(express.json());

app.use((req, _, next) => { req.io = io; next(); });

app.use('/auth', require('./routes/auth'));
app.use('/qr',   require('./routes/qr'));

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  console.log('Socket intento conexion, token:', token);
  if (!token) return next(new Error('Token requerido'));

  if (token === 'pc-public-client') return next();

  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error('Token inválido'));
  }
});

io.on('connection', socket => {
  socket.on('join_session', sessionId => {
    socket.join(sessionId);
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado');
    server.listen(process.env.PORT, () =>
      console.log(`Servidor en http://localhost:${process.env.PORT}`)
    );
  })
  .catch(err => console.error('Error MongoDB:', err));