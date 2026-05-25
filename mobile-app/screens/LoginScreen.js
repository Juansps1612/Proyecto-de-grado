import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import ENV from '../config';

export const BACKEND = ENV.BACKEND;

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function login() {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Complete todos los campos');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND}/auth/login`,
        { username: username.trim(), password },
        { timeout: 10000 }
      );
      onLogin(res.data.token);
    } catch (e) {
      const msg = e.response?.data?.error || 'Error de conexión';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>QR Auth</Text>
      <TextInput style={s.input} placeholder="Usuario" placeholderTextColor="#888"
        value={username} onChangeText={setUsername} autoCapitalize="none"
        autoCorrect={false} maxLength={30}/>
      <TextInput style={s.input} placeholder="Contraseña" placeholderTextColor="#888"
        value={password} onChangeText={setPassword} secureTextEntry
        maxLength={100}/>
      <TouchableOpacity style={s.btn} onPress={login} disabled={loading}>
        <Text style={s.btnText}>{loading ? 'Entrando...' : 'Iniciar sesión'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0f0f0f', justifyContent:'center', padding:32 },
  title: { color:'#fff', fontSize:28, fontWeight:'bold', textAlign:'center', marginBottom:32 },
  input: { backgroundColor:'#1e1e1e', color:'#fff', borderRadius:8, padding:14, marginBottom:16, fontSize:16 },
  btn: { backgroundColor:'#2ecc71', borderRadius:8, padding:16 },
  btnText: { color:'#fff', textAlign:'center', fontWeight:'bold', fontSize:16 },
});