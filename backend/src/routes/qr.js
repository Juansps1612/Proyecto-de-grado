const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const QRToken = require('../models/QRToken');
const jwt = require('jsonwebtoken');
const verifyJWT = require('../middleware/verifyJWT');

// PC solicita un QR
router.get('/generate', async (req, res) => {
  const token = uuidv4();
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + process.env.QR_EXPIRY_SECONDS * 1000);

  await QRToken.create({ token, sessionId, expiresAt });

  const payload = JSON.stringify({ token, sessionId });
  const qrImage = await QRCode.toDataURL(payload);

  res.json({ qrImage, sessionId, expiresAt });
});

// App móvil valida el QR (requiere JWT del usuario)
router.post('/validate', verifyJWT, async (req, res) => {
  const { token, sessionId } = req.body;

  const record = await QRToken.findOne({ token, sessionId });
  if (!record)
    return res.status(404).json({ error: 'QR no encontrado' });
  if (record.used)
    return res.status(409).json({ error: 'QR ya utilizado' });
  if (new Date() > record.expiresAt)
    return res.status(410).json({ error: 'QR expirado' });

  record.used = true;
  record.userId = req.user.id;
  await record.save();

  const sessionToken = jwt.sign(
    { id: req.user.id, username: req.user.username, sessionId },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  // Notificar al PC via socket
  req.io.to(sessionId).emit('session_start', { sessionToken, username: req.user.username });

  res.json({ ok: true, sessionToken });
});

// Cerrar sesión desde la app
router.post('/logout', verifyJWT, (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId requerido' });
  req.io.to(sessionId).emit('session_end');
  res.json({ ok: true });
});

module.exports = router;