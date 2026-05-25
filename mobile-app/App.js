import { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import LoginScreen from './screens/LoginScreen';
import ScannerScreen from './screens/ScannerScreen';

export default function App() {
  const [token, setToken] = useState(null);
  const [screen, setScreen] = useState('loading');

  useEffect(() => {
    SecureStore.getItemAsync('userToken')
      .then(savedToken => {
        setToken(savedToken || null);
        setScreen(savedToken ? 'scanner' : 'login');
      })
      .catch(() => setScreen('login'));
  }, []);

  async function handleLogin(t) {
    await SecureStore.setItemAsync('userToken', t);
    setToken(t);
    setScreen('scanner');
  }

  async function handleLogout() {
    await SecureStore.deleteItemAsync('userToken');
    setToken(null);
    setScreen('login');
  }

  if (screen === 'loading') return (
    <View style={s.loading}>
      <ActivityIndicator size="large" color="#2ecc71"/>
    </View>
  );

  if (screen === 'login')
    return <LoginScreen onLogin={handleLogin}/>;

  return <ScannerScreen token={token} onLogout={handleLogout}/>;
}

const s = StyleSheet.create({
  loading: { flex:1, backgroundColor:'#0f0f0f', justifyContent:'center', alignItems:'center' }
});