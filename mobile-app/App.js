import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import ScannerScreen from './screens/ScannerScreen';

export default function App() {
  const [token, setToken] = useState(null);
  const [screen, setScreen] = useState('login');

  if (screen === 'login')
    return <LoginScreen onLogin={t => { setToken(t); setScreen('scanner'); }} />;

  return <ScannerScreen token={token} onLogout={() => { setToken(null); setScreen('login'); }} />;
}