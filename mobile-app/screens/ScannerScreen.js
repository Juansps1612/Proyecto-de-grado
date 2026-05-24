import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import { BACKEND } from './LoginScreen';

export default function ScannerScreen({ token, onLogout }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  if (!permission) return <View style={s.container}><Text style={s.txt}>Cargando...</Text></View>;
  if (!permission.granted) return (
    <View style={s.container}>
      <Text style={s.txt}>Se necesita acceso a la cámara</Text>
      <TouchableOpacity style={s.btn} onPress={requestPermission}>
        <Text style={s.btnText}>Dar permiso</Text>
      </TouchableOpacity>
    </View>
  );

  async function handleScan({ data }) {
  if (scanned) return;
  setScanned(true);
  try {
    const { token: qrToken, sessionId: sid } = JSON.parse(data);
    setSessionId(sid); // ← mueve esto ANTES del await
    await axios.post(`${BACKEND}/qr/validate`,
      { token: qrToken, sessionId: sid },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setResult('✅ Sesión iniciada en el PC');
  } catch (e) {
    const msg = e.response?.data?.error || 'Error al validar';
    setResult(`❌ ${msg}`);
  }
}

  async function handleLogout() {
    if (sessionId) {
      try {
        await axios.post(`${BACKEND}/qr/logout`,
          { sessionId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch {}
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
      {result && <Text style={s.result}>{result}</Text>}
      {scanned && (
        <TouchableOpacity style={s.btn} onPress={() => { setScanned(false); setResult(null); setSessionId(null); }}>
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
  scanner: { width:280, height:280, borderRadius:12, overflow:'hidden', marginBottom:24 },
  result: { color:'#fff', fontSize:18, marginBottom:24, textAlign:'center' },
  btn: { backgroundColor:'#3498db', borderRadius:8, padding:14, width:'100%', marginBottom:12 },
  btnText: { color:'#fff', textAlign:'center', fontWeight:'bold', fontSize:16 },
  logout: { marginTop:8 },
  logoutText: { color:'#e74c3c', fontSize:14 },
  txt: { color:'#fff', marginBottom:16 },
});