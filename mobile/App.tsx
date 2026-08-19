import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameShellScreen } from './src/screens/GameShellScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#04101f" />
      <GameShellScreen />
    </SafeAreaProvider>
  );
}
