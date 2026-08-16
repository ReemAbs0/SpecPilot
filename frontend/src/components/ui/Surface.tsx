import { type ComponentPropsWithoutRef, type ElementType, type ReactNode } from 'react';
import Paper from '@mui/material/Paper';
import { useThemeMode } from '../../state/ThemeContext';
import { cn } from './cn';

// Theme-aware content-container surface (feature/material-theme). Lets us route the app's raw
// Tailwind "card"/panel <div>s (and clickable <Link>/<details> panels) through MUI in Material
// mode without changing the Classic markup at all:
//
//   - Classic: renders the given element with `cn(surface, className)` — pass the element's exact
//     original classes so the Classic output is byte-for-byte unchanged.
//   - Material: renders an MUI <Paper> (elevated, rounded Material surface) using the same element
//     via `component`, dropping the Classic `surface` look (Paper supplies bg/elevation/radius)
//     while keeping `className` layout (padding, flex, sizing, hover/focus).
//
// `surface` holds the Classic-only look (border/background/shadow/rounded); `className` holds
// layout applied in both themes. This is presentation only — no business logic.

type SurfaceProps<C extends ElementType> = {
  /** Element (or component, e.g. Link) to render. Defaults to a div. */
  as?: C;
  /** Classic-only Tailwind surface styling. Omitted in Material (Paper provides the surface). */
  surface?: string;
  /** Material elevation for the MUI Paper. Ignored in Classic. */
  elevation?: number;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<C>, 'as' | 'className' | 'children'>;

export function Surface<C extends ElementType = 'div'>({
  as,
  surface,
  elevation = 3,
  className,
  children,
  ...rest
}: SurfaceProps<C>) {
  const { mode } = useThemeMode();
  const Component = (as ?? 'div') as ElementType;

  if (mode === 'material') {
    return (
      <Paper
        component={Component}
        elevation={elevation}
        className={className}
        sx={{ backgroundImage: 'none' }}
        // `rest` carries element-specific props (e.g. a Link's `to`, a <details> `open`) that MUI
        // Paper's base type doesn't know about but forwards to the rendered element at runtime.
        {...(rest as unknown as ComponentPropsWithoutRef<'div'>)}
      >
        {children}
      </Paper>
    );
  }

  return (
    <Component className={cn(surface, className)} {...rest}>
      {children}
    </Component>
  );
}
