const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 30 }).isAlphanumeric(),
  body('password').isLength({ min: 4, max: 100 }),
], validate, async (req, res) => {
  try {
    const user = await User.create({
      username: req.body.username,
      password: req.body.password
    });
    res.json({ ok: true, id: user._id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/login', [
  body('username').trim().isLength({ min: 3, max: 30 }).isAlphanumeric(),
  body('password').isLength({ min: 4, max: 100 }),
], validate, async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = jwt.sign(
    { id: user._id, username },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
  res.json({ token });
});

module.exports = router;