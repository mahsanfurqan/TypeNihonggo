import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { buildLifecycleScript, NATIVE_BOOTSTRAP_SCRIPT } from '../bridge/nativeGameBridge';
import { SystemStatusPanel } from '../components/SystemStatusPanel';
import { isTrustedGameRequest, resolveGameUrl } from '../config/gameUrl';
import { mobileTheme } from '../theme/mobileTheme';

type LoadError = {
  title: string;
  message: string;
};

type WebViewProps = ComponentProps<typeof WebView>;
type WebViewErrorEvent = Parameters<NonNullable<WebViewProps['onError']>>[0];
type WebViewHttpErrorEvent = Parameters<NonNullable<WebViewProps['onHttpError']>>[0];

export function GameShellScreen() {
  const gameUrl = useMemo(resolveGameUrl, []);
  const webViewRef = useRef<WebView>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(gameUrl));
  const [loadError, setLoadError] = useState<LoadError | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      webViewRef.current?.injectJavaScript(buildLifecycleScript(nextState));
    });

    return () => subscription.remove();
  }, []);

  const retry = () => {
    setLoadError(null);
    setIsLoading(true);
    setReloadKey((currentKey) => currentKey + 1);
  };

  const handleWebViewError = (event: WebViewErrorEvent) => {
    setIsLoading(false);
    setLoadError({
      title: 'LINK FAILED',
      message: event.nativeEvent.description || 'The Phaser game could not be reached.',
    });
  };

  const handleHttpError = (event: WebViewHttpErrorEvent) => {
    setIsLoading(false);
    setLoadError({
      title: `HTTP ${event.nativeEvent.statusCode}`,
      message: 'The game server responded with an error. Check the configured game URL.',
    });
  };

  if (!gameUrl) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
        <SystemStatusPanel
          danger
          title="GAME URL REQUIRED"
          message="Set EXPO_PUBLIC_GAME_URL to the deployed TypeNihongo web address before creating a production build."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
      <View style={styles.gameFrame}>
        <WebView
          key={reloadKey}
          ref={webViewRef}
          source={{ uri: gameUrl }}
          style={styles.webView}
          originWhitelist={['http://*', 'https://*']}
          onShouldStartLoadWithRequest={(request) => isTrustedGameRequest(request.url, gameUrl)}
          injectedJavaScriptBeforeContentLoaded={NATIVE_BOOTSTRAP_SCRIPT}
          applicationNameForUserAgent="TypeNihongoMobile/1.0.2.0"
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          bounces={false}
          overScrollMode="never"
          scrollEnabled={false}
          setSupportMultipleWindows={false}
          mixedContentMode={gameUrl.startsWith('http://') ? 'always' : 'never'}
          onLoadStart={() => {
            setLoadError(null);
            setIsLoading(true);
          }}
          onLoadEnd={() => setIsLoading(false)}
          onError={handleWebViewError}
          onHttpError={handleHttpError}
          androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
        />

        {isLoading ? (
          <SystemStatusPanel title="INITIALIZING" message="Connecting to the TypeNihongo game core..." />
        ) : null}

        {loadError ? (
          <SystemStatusPanel
            danger
            title={loadError.title}
            message={loadError.message}
            actionLabel="RETRY CONNECTION"
            onAction={retry}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: mobileTheme.colors.background,
  },
  gameFrame: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: mobileTheme.colors.background,
  },
  webView: {
    flex: 1,
    backgroundColor: mobileTheme.colors.background,
  },
});
