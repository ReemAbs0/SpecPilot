import { cn } from './cn';
import type { TextFieldAppearance, TextFieldProps } from './TextField';

// Classic (Tailwind) text field. Reproduces the exact input/textarea styling the login/signup
// forms and the idea textarea used before theming was introduced, so the Classic theme is
// visually identical.

const control: Record<TextFieldAppearance, string> = {
  outlined:
    'rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-700 dark:text-slate-200 ' +
    'placeholder:text-slate-400 dark:placeholder:text-slate-500 ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-60',
  plain:
    'w-full resize-y rounded-xl border-0 bg-transparent text-slate-700 dark:text-slate-200 ' +
    'placeholder:text-slate-400 dark:placeholder:text-slate-500 ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-60',
};

export function ClassicTextField({
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
  className,
}: TextFieldProps) {
  const controlClassName = cn(control[appearance], className);

  const field = multiline ? (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      aria-invalid={invalid ? true : undefined}
      aria-describedby={describedBy}
      className={controlClassName}
    />
  ) : (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete={autoComplete}
      aria-invalid={invalid ? true : undefined}
      aria-describedby={describedBy}
      className={controlClassName}
    />
  );

  if (labelHidden) {
    return (
      <>
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        {field}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      {field}
    </div>
  );
}
