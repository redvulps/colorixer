import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { BottomSheet } from '../BottomSheet';

function sheet(visible: boolean, onClose = jest.fn()) {
  return (
    <BottomSheet
      testID="sheet"
      visible={visible}
      onClose={onClose}
      title="Pôr do sol"
      subtitle="Analogous"
    >
      <Text>Export to Procreate</Text>
    </BottomSheet>
  );
}

describe('BottomSheet', () => {
  it('renders nothing while closed', async () => {
    await render(sheet(false));
    expect(screen.queryByText('Pôr do sol')).toBeNull();
  });

  it('shows its title and content when opened', async () => {
    await render(sheet(true));
    expect(screen.getByText('Pôr do sol')).toBeOnTheScreen();
    expect(screen.getByText('Export to Procreate')).toBeOnTheScreen();
  });

  it('stays mounted while it animates out, then goes away', async () => {
    const { rerender } = await render(sheet(true));
    await rerender(sheet(false));
    expect(screen.getByText('Export to Procreate')).toBeOnTheScreen();
    await waitFor(() => expect(screen.queryByText('Export to Procreate')).toBeNull());
  });

  it('asks to close when the scrim is pressed', async () => {
    const onClose = jest.fn();
    await render(sheet(true, onClose));
    await fireEvent.layout(screen.getByTestId('sheet'), { height: 320 });
    // The native driver animates the scrim's opacity outside the test tree, where it stays 0
    await fireEvent.press(screen.getByLabelText('Close', { includeHiddenElements: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
