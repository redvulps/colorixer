import { layoutFor } from '../useLayout';

describe('layoutFor', () => {
  it('gives phones their tabs, upright or sideways', () => {
    expect(layoutFor(411, 914)).toBe('phone');
    expect(layoutFor(914, 411)).toBe('phone');
  });

  it('gives an upright tablet the tablet layout', () => {
    expect(layoutFor(800, 1280)).toBe('tablet');
    expect(layoutFor(600, 960)).toBe('tablet');
  });

  it('gives a sideways tablet or a wide browser the workspace', () => {
    expect(layoutFor(1280, 800)).toBe('wide');
    expect(layoutFor(1024, 500)).toBe('wide');
  });
});
