// App.tsx
import React from 'react';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  // Semua UI aplikasi, termasuk StatusBar, kini di-handle di AppNavigator
  return (
    <AppNavigator />
  );
}
// Stylesheet di App.tsx tidak lagi diperlukan, bisa dihapus.