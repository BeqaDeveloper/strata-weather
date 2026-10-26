import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import type { LogEvent } from '../shared/observability/logger';
import { ApplicationErrorBoundary } from './ApplicationErrorBoundary';

function BrokenScreen({ fail }: { readonly fail: boolean }) {
  if (fail) throw new Error('private city and raw error stack');
  return <Text>Recovered weather screen</Text>;
}

describe('application error boundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('offers recovery and reports only a fixed safe failure code', async () => {
    const log = jest.fn<void, [LogEvent]>();
    const view = await render(
      <ApplicationErrorBoundary logger={{ log }}>
        <BrokenScreen fail />
      </ApplicationErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeOnTheScreen();
    expect(log).toHaveBeenCalledWith({ event: 'app.render_failed', code: 'unexpected-render' });
    expect(JSON.stringify(log.mock.calls)).not.toContain('private');
    await view.rerender(
      <ApplicationErrorBoundary logger={{ log }}>
        <BrokenScreen fail={false} />
      </ApplicationErrorBoundary>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Restart weather screen' }));
    expect(screen.getByText('Recovered weather screen')).toBeOnTheScreen();
  });

  it('keeps the recovery screen available if a reporting adapter throws', async () => {
    const logger = {
      log: () => {
        throw new Error('reporter failed');
      },
    };
    await render(
      <ApplicationErrorBoundary logger={logger}>
        <BrokenScreen fail />
      </ApplicationErrorBoundary>,
    );
    expect(screen.getByRole('button', { name: 'Restart weather screen' })).toBeOnTheScreen();
  });
});
