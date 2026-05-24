const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Registro (solo para pruebas)
router.post('/register', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json({ ok: true, id: user._id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Login con usuario/contraseña
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = jwt.sign({ id: user._id, username }, process.env.JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
});

module.exports = router;