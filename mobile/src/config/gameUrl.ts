import Constants from 'expo-constants';

const DEVELOPMENT_GAME_PORT = 5173;

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/$/, '');
}

export function extractHostname(hostUri?: string | null): string | null {
  if (!hostUri) {
    return null;
  }

  const withoutProtocol = hostUri.replace(/^https?:\/\//, '');
  const hostname = withoutProtocol.split(':')[0]?.trim();
  return hostname || null;
}

export function resolveGameUrl(): string | null {
  const configuredUrl = process.env.EXPO_PUBLIC_GAME_URL;

  if (configuredUrl?.trim()) {
    return normalizeUrl(configuredUrl);
  }

  if (!__DEV__) {
    return null;
  }

  const expoHostname = extractHostname(Constants.expoConfig?.hostUri);
  return expoHostname ? `http://${expoHostname}:${DEVELOPMENT_GAME_PORT}` : null;
}

export function isTrustedGameRequest(requestUrl: string, gameUrl: string): boolean {
  if (requestUrl === 'about:blank') {
    return true;
  }

  try {
    return new URL(requestUrl).origin === new URL(gameUrl).origin;
  } catch {
    return false;
  }
}
