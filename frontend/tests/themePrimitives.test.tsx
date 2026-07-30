import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeModeProvider } from '../src/state/ThemeContext';
import { Button, Card, Surface } from '../src/components/ui';

// Verifies the theme-aware primitives dispatch to the right implementation per mode
// (feature/material-theme): Classic renders plain Tailwind elements, Material renders MUI
// components (identifiable by their MUI root classes). ThemeModeProvider reads the initial mode
// from localStorage, so we seed it before rendering.

function renderInMode(mode: 'classic' | 'material', ui: React.ReactNode) {
  localStorage.setItem('specpilot.theme', mode);
  return render(<ThemeModeProvider>{ui}</ThemeModeProvider>);
}

beforeEach(() => {
  localStorage.clear();
});

describe('theme-aware primitives', () => {
  it('renders plain Tailwind elements in Classic mode', () => {
    const { container } = renderInMode(
      'classic',
      <>
        <Button>Go</Button>
        <Card>card</Card>
        <Surface surface="rounded-2xl border bg-white">panel</Surface>
      </>,
    );

    expect(container.querySelector('.MuiButton-root')).toBeNull();
    expect(container.querySelector('.MuiPaper-root')).toBeNull();
    // The Classic surface keeps its exact pass-through classes.
    expect(container.querySelector('.rounded-2xl.border.bg-white')).not.toBeNull();
  });

  it('renders MUI components in Material mode', () => {
    const { container } = renderInMode(
      'material',
      <>
        <Button>Go</Button>
        <Card>card</Card>
        <Surface surface="rounded-2xl border bg-white">panel</Surface>
      </>,
    );

    expect(container.querySelector('.MuiButton-root')).not.toBeNull();
    // Card (Paper) + Surface (Paper) → at least two MUI Paper surfaces.
    expect(container.querySelectorAll('.MuiPaper-root').length).toBeGreaterThanOrEqual(2);
    // The Classic-only surface styling is dropped in Material (Paper supplies the surface).
    expect(container.querySelector('.rounded-2xl.border.bg-white')).toBeNull();
  });
});
