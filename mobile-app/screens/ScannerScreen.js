import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import { BACKEND } from './LoginScreen';

const SAFE_ERRORS = {
  'QR no encontrado': 'El código QR no es válido',
  'QR ya utilizado': 'Este código QR ya fue usado',
  'QR expirado': 'El código QR ha expirado',
  'Token requerido': 'Sesión no válida, inicia sesión nuevamente',
  'Token inválido o expirado': 'Sesión expirada, inicia sesión nuevamente',
};

function getSafeError(error) {
  if (!error) return 'Ocurrió un error, intenta nuevamente';
  return SAFE_ERRORS[error] || 'Ocurrió un error, intenta nuevamente';
}

export default function ScannerScreen({ token, onLogout }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!permission) return <View style={s.container}><Text style={s.txt}>Cargando...</Text></View>;
  if (!permission.granted) return (
  <View style={s.container}>
    <Text style={s.title}>Permiso de cámara</Text>
    <Text style={s.permissionText}>
      Esta app necesita acceso a la cámara únicamente para escanear
      códigos QR y autenticar tu sesión de forma segura.{'\n\n'}
      No se grabará ni almacenará ninguna imagen.
    </Text>
    <TouchableOpacity style={s.btn} onPress={requestPermission}>
      <Text style={s.btnText}>Permitir acceso a cámara</Text>
    </TouchableOpacity>
  </View>
);

  async function handleScan({ data }) {
    if (scanned) return;
    setScanned(true);
    try {
      const parsed = JSON.parse(data);
      if (!parsed.token || !parsed.sessionId) {
        setResult('❌ Código QR inválido');
        setSuccess(false);
        return;
      }
      setSessionId(parsed.sessionId);
      await axios.post(`${BACKEND}/qr/validate`,
        { token: parsed.token, sessionId: parsed.sessionId },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );
      setResult('✅ Sesión iniciada en el PC');
      setSuccess(true);
    } catch (e) {
      const serverError = e.response?.data?.error;
      setResult(`❌ ${getSafeError(serverError)}`);
      setSuccess(false);
    }
  }

  async function handleLogout() {
    if (sessionId) {
      try {
        await axios.post(`${BACKEND}/qr/logout`,
          { sessionId },
          { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
        );
      } catch (e) {
  console.warn('Error al cerrar sesión:', e.message);
}
    }
    onLogout();
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Escanea el QR</Text>
      {!scanned && (
        <CameraView style={s.scanner} facing="back" onBarcodeScanned={handleScan}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}/>
      )}
      {result && (
        <Text style={[s.result, success ? s.resultOk : s.resultErr]}>{result}</Text>
      )}
      {scanned && (
        <TouchableOpacity style={s.btn} onPress={() => { setScanned(false); setResult(null); setSuccess(false); }}>
          <Text style={s.btnText}>Escanear otro QR</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={s.logout} onPress={handleLogout}>
        <Text style={s.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0f0f0f', alignItems:'center', justifyContent:'center', padding:24 },
  title: { color:'#fff', fontSize:22, fontWeight:'bold', marginBottom:24 },

  permissionText: {
    color:'#aaa',
    fontSize:15,
    textAlign:'center',
    marginBottom:32,
    lineHeight:22
  },

  scanner: { width:280, height:280, borderRadius:12, overflow:'hidden', marginBottom:24 },
  result: { fontSize:18, marginBottom:24, textAlign:'center' },
  resultOk: { color:'#2ecc71' },
  resultErr: { color:'#e74c3c' },
  btn: { backgroundColor:'#3498db', borderRadius:8, padding:14, width:'100%', marginBottom:12 },
  btnText: { color:'#fff', textAlign:'center', fontWeight:'bold', fontSize:16 },
  logout: { marginTop:8 },
  logoutText: { color:'#e74c3c', fontSize:14 },
  txt: { color:'#fff', marginBottom:16 },
});