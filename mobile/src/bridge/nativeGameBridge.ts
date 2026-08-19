import type { AppStateStatus } from 'react-native';

export const NATIVE_LIFECYCLE_EVENT = 'typenihongo:native-lifecycle';

export function buildLifecycleScript(appState: AppStateStatus): string {
  const lifecycleState = appState === 'active' ? 'active' : 'background';

  return `
    window.dispatchEvent(new CustomEvent(${JSON.stringify(NATIVE_LIFECYCLE_EVENT)}, {
      detail: { state: ${JSON.stringify(lifecycleState)} }
    }));
    true;
  `;
}

export const NATIVE_BOOTSTRAP_SCRIPT = `
  window.__TYPENIHONGO_NATIVE__ = Object.freeze({
    platform: 'mobile',
    releaseId: '1.0.2.0'
  });
  true;
`;
