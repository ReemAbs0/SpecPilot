import { forwardRef } from 'react';
import MuiButton from '@mui/material/Button';
import type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

// Material (MUI) button implementation. Maps the shared Button API onto MUI's <Button> so
// callers keep passing the same `variant`/`size` props. Tailwind utility classes still arrive
// via `className` (e.g. `w-full`, `mt-3`) and apply to the MUI root, so layout stays identical.

const muiVariant: Record<ButtonVariant, 'contained' | 'outlined'> = {
  primary: 'contained',
  secondary: 'outlined',
};

const muiSize: Record<ButtonSize, 'medium' | 'large'> = {
  md: 'medium',
  lg: 'large',
};

export const MaterialButton = forwardRef<HTMLButtonElement, ButtonProps>(function MaterialButton(
  // `color` is pulled out of the rest props: the DOM color attribute from ButtonHTMLAttributes
  // would otherwise clash with MUI's typed `color`. It is unused by callers.
  { variant = 'primary', size = 'md', className, type = 'button', color: _color, children, ...props },
  ref,
) {
  // Secondary maps to an outlined neutral button (matches the Classic white/slate secondary
  // better than a coloured outline).
  const color: 'inherit' | 'primary' = variant === 'secondary' ? 'inherit' : 'primary';
  return (
    <MuiButton
      ref={ref}
      type={type}
      variant={muiVariant[variant]}
      size={muiSize[size]}
      color={color}
      className={className}
      // Keep the small icon/text gap the Classic buttons have (they use `gap-2`).
      sx={{ gap: 0.75 }}
      {...props}
    >
      {children}
    </MuiButton>
  );
});
