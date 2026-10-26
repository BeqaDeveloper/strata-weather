import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { AppState } from 'react-native';

import { connectQueryLifecycle, type QueryLifecycleBridge } from './queryLifecycle';

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  NetInfoStateType: { unknown: 'unknown' },
}));

function createBridge(
  platform: 'web' | 'native' = 'native',
  initialState: string | null = 'active',
) {
  let appListener: (state: string) => void = () => {};
  let networkListener: Parameters<QueryLifecycleBridge['subscribeNetwork']>[0] = () => {};
  const removeAppState = jest.fn();
  const removeNetwork = jest.fn();
  const bridge = {
    platform,
    currentAppState: jest.fn(() => initialState),
    subscribeAppState: jest.fn((listener: typeof appListener) => {
      appListener = listener;
      return removeAppState;
    }),
    subscribeNetwork: jest.fn((listener: typeof networkListener) => {
      networkListener = listener;
      return removeNetwork;
    }),
    setFocused: jest.fn(),
    setOnline: jest.fn(),
  } satisfies QueryLifecycleBridge;
  return {
    bridge,
    removeAppState,
    removeNetwork,
    appState: (state: string) => appListener(state),
    network: (connected: boolean | null, reachable: boolean | null) =>
      networkListener({ isConnected: connected, isInternetReachable: reachable }),
  };
}

describe('native query lifecycle', () => {
  it('connects the real native bridge ports and removes their subscriptions', () => {
    const removeFocus = jest.fn();
    const removeNetwork = jest.fn();
    const subscribeFocus = jest
      .spyOn(AppState, 'addEventListener')
      .mockReturnValue({ remove: removeFocus });
    jest.mocked(NetInfo.addEventListener).mockReturnValue(removeNetwork);
    const focused = jest.spyOn(focusManager, 'setFocused').mockImplementation(() => {});
    const online = jest.spyOn(onlineManager, 'setOnline').mockImplementation(() => {});
    const dispose = connectQueryLifecycle();
    const focusListener = subscribeFocus.mock.calls[0]?.[1];
    focusListener?.('background');
    expect(focused).toHaveBeenLastCalledWith(false);
    const networkListener = jest.mocked(NetInfo.addEventListener).mock.calls[0]?.[0];
    networkListener?.({
      type: NetInfoStateType.unknown,
      isConnected: true,
      isInternetReachable: null,
      details: null,
    });
    expect(online).toHaveBeenLastCalledWith(true);
    dispose();
    expect(removeFocus).toHaveBeenCalledTimes(1);
    expect(removeNetwork).toHaveBeenCalledTimes(1);
    expect(focused).toHaveBeenLastCalledWith(undefined);
  });

  it('maps foreground and background state into query focus', () => {
    const runtime = createBridge();
    const dispose = connectQueryLifecycle(runtime.bridge);
    expect(runtime.bridge.setFocused).toHaveBeenLastCalledWith(true);
    runtime.appState('background');
    expect(runtime.bridge.setFocused).toHaveBeenLastCalledWith(false);
    runtime.appState('inactive');
    expect(runtime.bridge.setFocused).toHaveBeenLastCalledWith(false);
    runtime.appState('active');
    expect(runtime.bridge.setFocused).toHaveBeenLastCalledWith(true);
    dispose();
  });

  it('does not guess the focus when initial app state is unknown', () => {
    const { bridge, appState } = createBridge('native', null);
    const dispose = connectQueryLifecycle(bridge);
    appState('unknown');
    expect(bridge.setFocused).not.toHaveBeenCalled();
    dispose();
  });

  it.each([
    [false, null, false],
    [true, false, false],
    [true, null, true],
    [null, true, true],
    [true, true, true],
  ] as const)(
    'maps connectivity %s and reachability %s to online=%s',
    (connected, reachable, online) => {
      const { bridge, network } = createBridge();
      const dispose = connectQueryLifecycle(bridge);
      network(connected, reachable);
      expect(bridge.setOnline).toHaveBeenCalledWith(online);
      dispose();
    },
  );

  it('preserves the current online state while connectivity is unknown', () => {
    const { bridge, network } = createBridge();
    const dispose = connectQueryLifecycle(bridge);
    network(null, null);
    expect(bridge.setOnline).not.toHaveBeenCalled();
    dispose();
  });

  it('removes subscriptions exactly once and ignores late events', () => {
    const runtime = createBridge();
    const dispose = connectQueryLifecycle(runtime.bridge);
    dispose();
    dispose();
    expect(runtime.removeAppState).toHaveBeenCalledTimes(1);
    expect(runtime.removeNetwork).toHaveBeenCalledTimes(1);
    expect(runtime.bridge.setFocused).toHaveBeenLastCalledWith(undefined);
    runtime.appState('active');
    runtime.network(true, true);
    expect(runtime.bridge.setFocused).toHaveBeenLastCalledWith(undefined);
    expect(runtime.bridge.setOnline).not.toHaveBeenCalled();
  });

  it('preserves TanStack Query browser lifecycle handling on web', () => {
    const { bridge } = createBridge('web');
    connectQueryLifecycle(bridge)();
    expect(bridge.subscribeAppState).not.toHaveBeenCalled();
    expect(bridge.subscribeNetwork).not.toHaveBeenCalled();
    expect(bridge.setFocused).not.toHaveBeenCalled();
  });
});
