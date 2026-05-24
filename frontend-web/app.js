const BACKEND = 'http://localhost:3000';
let countdownInterval;

async function loadQR() {
  document.getElementById('status').textContent = 'Generando QR...';
  document.getElementById('timer').textContent = '';

  const res = await fetch(`${BACKEND}/qr/generate`);
  const data = await res.json();

  document.getElementById('qr-img').src = data.qrImage;
  document.getElementById('status').textContent = 'Escanea el QR con la app';

  // Unirse a la sesión via socket
  socket.emit('join_session', data.sessionId);

  // Countdown
  clearInterval(countdownInterval);
  const expiry = new Date(data.expiresAt).getTime();
  countdownInterval = setInterval(() => {
    const left = Math.max(0, Math.round((expiry - Date.now()) / 1000));
    document.getElementById('timer').textContent = `Expira en ${left}s`;
    if (left === 0) {
      clearInterval(countdownInterval);
      document.getElementById('status').textContent = 'QR expirado. Recargando...';
      setTimeout(loadQR, 2000);
    }
  }, 1000);
}

const socket = io(BACKEND);

socket.on('session_start', ({ username }) => {
  clearInterval(countdownInterval);
  document.getElementById('qr-box').classList.add('hidden');
  document.getElementById('status').classList.add('hidden');
  document.getElementById('timer').classList.add('hidden');
  document.getElementById('session-info').classList.remove('hidden');
  document.getElementById('welcome').textContent = `Bienvenido, ${username}`;
});

socket.on('session_end', () => {
  document.getElementById('session-info').classList.add('hidden');
  document.getElementById('qr-box').classList.remove('hidden');
  document.getElementById('status').classList.remove('hidden');
  document.getElementById('timer').classList.remove('hidden');
  loadQR();
});

loadQR();