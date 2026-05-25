const BACKEND = window.ENV?.BACKEND_URL || 'http://localhost:3000';
let countdownInterval;

function sanitize(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

function setStatus(text) {
  document.getElementById('status').textContent = sanitize(text);
}

function setTimer(text) {
  document.getElementById('timer').textContent = sanitize(text);
}

function setWelcome(username) {
  document.getElementById('welcome').textContent = sanitize(username);
}

const socket = io(BACKEND, {
  auth: { token: 'pc-public-client' },
  transports: ['polling']
});

socket.on('connect', () => {
  console.log('Socket conectado');
  loadQR();
});

socket.on('connect_error', (err) => {
  console.log('Error socket:', err.message);
  setStatus('Error de conexión con el servidor. Reintentando...');
});

socket.on('session_start', ({ username }) => {
  if (typeof username !== 'string') return;
  clearInterval(countdownInterval);
  document.getElementById('qr-box').classList.add('hidden');
  document.getElementById('status').classList.add('hidden');
  document.getElementById('timer').classList.add('hidden');
  document.getElementById('session-info').classList.remove('hidden');
  setWelcome(`Bienvenido, ${username}`);
});

socket.on('session_end', () => {
  clearInterval(countdownInterval);
  document.getElementById('session-info').classList.add('hidden');
  document.getElementById('qr-box').classList.remove('hidden');
  document.getElementById('status').classList.remove('hidden');
  document.getElementById('timer').classList.remove('hidden');
  loadQR();
});

socket.on('disconnect', () => {
  clearInterval(countdownInterval);
  setStatus('Conexión perdida. Reconectando...');
});

window.addEventListener('beforeunload', () => {
  clearInterval(countdownInterval);
});

async function loadQR() {
  setStatus('Generando QR...');
  setTimer('');

  try {
    const res = await fetch(`${BACKEND}/qr/generate`, {
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});
    if (!res.ok) throw new Error('Error al generar QR');
    const data = await res.json();

    if (!data.qrImage || !data.sessionId || !data.expiresAt)
      throw new Error('Respuesta del servidor inválida');

    document.getElementById('qr-img').src = data.qrImage;
    setStatus('Escanea el QR con la app');

    socket.emit('join_session', data.sessionId);

    clearInterval(countdownInterval);
    const expiry = new Date(data.expiresAt).getTime();

    countdownInterval = setInterval(() => {
      const left = Math.max(0, Math.round((expiry - Date.now()) / 1000));
      setTimer(`Expira en ${left}s`);
      if (left === 0) {
        clearInterval(countdownInterval);
        setStatus('QR expirado. Recargando...');
        setTimeout(loadQR, 2000);
      }
    }, 1000);

  } catch (e) {
    console.log('Error loadQR:', e.message);
    setStatus('Error al cargar QR. Reintentando...');
    setTimeout(loadQR, 3000);
  }
}