import { type ChangeEventHandler } from 'react';
import { useThemeMode } from '../../state/ThemeContext';
import { ClassicTextField } from './TextField.classic';
import { MaterialTextField } from './TextField.material';

// Theme-aware text input primitive (feature/material-theme). Owns the label + control so both
// themes stay accessible and consistent: Classic renders the original Tailwind input/textarea,
// Material renders an MUI <TextField>. Callers keep their own field state and validation and pass
// values in/out via `value`/`onChange` — no business logic lives here.

export type TextFieldAppearance =
  // Bordered field with a visible label above it (login/signup fields).
  | 'outlined'
  // Borderless field that blends into its surrounding surface (the idea textarea in its card).
  | 'plain';

export interface TextFieldProps {
  id: string;
  /** Accessible label. Rendered visibly unless `labelHidden` is set. */
  label: string;
  /** Hide the label visually while keeping it for screen readers. */
  labelHidden?: boolean;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  /** Input type (ignored when `multiline`). */
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  autoComplete?: string;
  /** Marks the field invalid for assistive tech (and error styling in Material). */
  invalid?: boolean;
  /** id of an external element describing the field (e.g. an error message). */
  describedBy?: string;
  appearance?: TextFieldAppearance;
  /** Extra classes merged onto the underlying control (Classic only). */
  className?: string;
}

export function TextField(props: TextFieldProps) {
  const { mode } = useThemeMode();
  return mode === 'material' ? <MaterialTextField {...props} /> : <ClassicTextField {...props} />;
}
