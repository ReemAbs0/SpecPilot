import MuiTextField from '@mui/material/TextField';
import type { TextFieldProps } from './TextField';

// Material (MUI) text field. Maps the shared TextField API onto MUI's <TextField>: 'outlined'
// appearance uses the boxed variant with a floating label (login/signup), 'plain' uses the
// underlined standard variant that blends into a surface (the idea textarea). Validation and
// field state stay with the caller; this only renders the control.

export function MaterialTextField({
  id,
  label,
  labelHidden = false,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
  multiline = false,
  rows,
  autoComplete,
  invalid,
  describedBy,
  appearance = 'outlined',
}: TextFieldProps) {
  return (
    <MuiTextField
      id={id}
      // A visible label uses MUI's floating label; a hidden one is exposed via aria-label only.
      label={labelHidden ? undefined : label}
      variant={appearance === 'plain' ? 'standard' : 'outlined'}
      value={value}
      onChange={onChange}
      type={multiline ? undefined : type}
      placeholder={placeholder}
      disabled={disabled}
      multiline={multiline}
      rows={rows}
      autoComplete={autoComplete}
      error={invalid}
      fullWidth
      slotProps={{
        htmlInput: {
          'aria-label': labelHidden ? label : undefined,
          'aria-describedby': describedBy,
        },
      }}
    />
  );
}
