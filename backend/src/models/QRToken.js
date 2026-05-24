const mongoose = require('mongoose');

const qrTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  sessionId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

// TTL: MongoDB borra el documento automáticamente al expirar
qrTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('QRToken', qrTokenSchema);