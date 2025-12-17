# Frontend App

Aplicación móvil/web desarrollada con React Native y Expo.

## ¿Qué necesitas?

- **Node.js** (versión 18 o superior)
- **Backend corriendo** en el puerto 5000

## Instalación

```powershell
cd ProductionApp
npm install
```

## Cómo ejecutar

```powershell
npx expo start
```

Opciones:
- Presiona `w` para abrir en navegador web
- Presiona `a` para emulador Android
- Escanea el QR con la app Expo Go en tu celular

## Carpetas

- **Screens/** - Pantallas de la app
- **Services/** - Conexión con la API
- **App.js** - Configuración principal

## Nota importante

Si pruebas en tu celular o emulador Android, cambia la IP en `Services/api.js`. 
El `localhost` no funciona desde dispositivos externos.
