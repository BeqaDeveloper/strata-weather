import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

interface NetworkStatus {
  readonly isConnected: boolean | null;
  readonly isInternetReachable: boolean | null;
}

export interface QueryLifecycleBridge {
  readonly platform: 'native' | 'web';
  currentAppState(): string | null;
  subscribeAppState(listener: (state: string) => void): () => void;
  subscribeNetwork(listener: (state: NetworkStatus) => void): () => void;
  setFocused(value: boolean | undefined): void;
  setOnline(value: boolean): void;
}

const nativeBridge: QueryLifecycleBridge = {
  platform: Platform.OS === 'web' ? 'web' : 'native',
  currentAppState: () => AppState.currentState ?? null,
  subscribeAppState: (listener) => {
    const subscription = AppState.addEventListener('change', listener);
    return () => subscription.remove();
  },
  subscribeNetwork: (listener) => NetInfo.addEventListener(listener),
  setFocused: (value) => focusManager.setFocused(value),
  setOnline: (value) => onlineManager.setOnline(value),
};

export function connectQueryLifecycle(bridge: QueryLifecycleBridge = nativeBridge): () => void {
  if (bridge.platform === 'web') return () => {};
  let active = true;
  const updateFocus = (state: string) => {
    if (active && ['active', 'background', 'inactive'].includes(state)) {
      bridge.setFocused(state === 'active');
    }
  };
  const initialState = bridge.currentAppState();
  if (initialState) updateFocus(initialState);
  const unsubscribeAppState = bridge.subscribeAppState(updateFocus);
  const unsubscribeNetwork = bridge.subscribeNetwork((state) => {
    if (!active) return;
    if (state.isConnected === false || state.isInternetReachable === false) {
      bridge.setOnline(false);
    } else if (state.isConnected === true || state.isInternetReachable === true) {
      bridge.setOnline(true);
    }
  });
  return () => {
    if (!active) return;
    active = false;
    unsubscribeAppState();
    unsubscribeNetwork();
    bridge.setFocused(undefined);
  };
}
