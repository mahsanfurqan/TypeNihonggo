# TypeNihongo Mobile Foundation

This Expo app is the native shell for the existing Phaser/Vite game. Release label `1.0.2.0` maps to the store-compatible app version `1.0.2` and native build number `1`.

## Local development

Run the Phaser server from the repository root:

```powershell
npm run dev:mobile-game
```

Then start Expo in a second terminal:

```powershell
npm run mobile:start
```

When Expo uses a LAN connection, the app derives the computer hostname from Metro and opens port `5173`. If discovery fails, copy `.env.example` to `.env.local`, replace the example address with the computer's LAN address, and restart Expo.

```text
EXPO_PUBLIC_GAME_URL=http://192.168.1.100:5173
```

The phone and computer must be on the same network, and Vite must be allowed through the local firewall.

## Production

Set `EXPO_PUBLIC_GAME_URL` to an HTTPS deployment before building for a store. The first mobile foundation intentionally contains only the native WebView shell, safe-area handling, loading/error states, and application lifecycle messaging. Home, store, asset selection, and purchases belong to later `1.0.2.x` releases.

## Verification

```powershell
npm run mobile:typecheck
npm run mobile:doctor
```
