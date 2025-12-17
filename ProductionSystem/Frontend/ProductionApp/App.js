// Polyfills for React Native (jspdf/jszip support)
const TextEncodingPolyfill = require('text-encoding');
const BigInt = require('big-integer'); // Common dep safe to ignore if missing, but just in case
global.Buffer = global.Buffer || require('buffer').Buffer;

// FORCE overwrite of built-in TextEncoder/Decoder if they exist but don't support latin1
// We assume we want the polyfill version.
global.TextEncoder = TextEncodingPolyfill.TextEncoder;
global.TextDecoder = TextEncodingPolyfill.TextDecoder;

import { decode, encode } from 'base-64';

if (!global.btoa) {
  global.btoa = encode;
}
if (!global.atob) {
  global.atob = decode;
}

// DIAGNOSTIC
try {
  new global.TextDecoder('latin1');
  console.log('✅ TextDecoder supports latin1');
} catch (e) {
  console.error('❌ TextDecoder DOES NOT support latin1:', e);
}

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity } from 'react-native';
import { ThemeProvider } from './Contexts/ThemeContext'; // Import Context

import CaptureGridScreen from './Screens/CaptureGridScreen';
import DashboardScreen from './Screens/DashboardScreen';
import HistoryScreen from './Screens/HistoryScreen';
import MachineParamsScreen from './Screens/MachineParamsScreen';
import ListsScreen from './Screens/ListsScreen';
import CartasScreen from './Screens/CartasScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarStyle: { display: 'none' }, // Hide bottom tab bar
            // Custom button to avoid <a> tag href tooltip on web
            tabBarButton: ({ href, ...props }) => (
              <TouchableOpacity
                {...props}
                onPress={(e) => {
                  // Prevent default link behavior if any, just navigate
                  props.onPress(e);
                }}
              />
            ),
          })}
        >
          <Tab.Screen name="Captura Mensual" component={CaptureGridScreen} options={{ headerShown: false }} />
          <Tab.Screen name="Tablero Semáforos" component={DashboardScreen} />
          <Tab.Screen name="Historial" component={HistoryScreen} />
          <Tab.Screen name="Config Máquinas" component={MachineParamsScreen} />
          <Tab.Screen name="Listas (Operarios)" component={ListsScreen} />
          <Tab.Screen name="Cartas" component={CartasScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
