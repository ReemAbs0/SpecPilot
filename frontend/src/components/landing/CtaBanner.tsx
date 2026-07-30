import { Link } from 'react-router-dom';
import MuiButton from '@mui/material/Button';
import { Button } from '../ui';
import { useThemeMode } from '../../state/ThemeContext';

// Full-width call-to-action banner (T033), matching the indigo band near the foot of the
// landing page. The "Get Started" button routes into the generator.

export function CtaBanner() {
  const { mode, colorMode } = useThemeMode();

  return (
    <section className="bg-brand-700">
      <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Ready to Build Your Next Software Project?
        </h2>
        <p className="mt-3 text-brand-100">
          Generate your first professional specification in seconds with Fetch AI.
        </p>
        <Link to="/generate" className="mt-8 inline-block">
          {mode === 'material' ? (
            // On the indigo band: a white button with indigo text in light mode, and — matching
            // the Classic secondary dark button (slate-800/slate-200/slate-700) — a slate/grey
            // button in dark mode, so it doesn't read as a glaring white block. Classic (below) is
            // unchanged.
            <MuiButton
              component="span"
              variant="contained"
              size="large"
              sx={{
                bgcolor: colorMode === 'dark' ? '#1e293b' : 'common.white', // slate-800 / white
                color: colorMode === 'dark' ? '#e2e8f0' : 'primary.main', // slate-200 / indigo
                border: colorMode === 'dark' ? '1px solid #334155' : 'none', // slate-700
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: colorMode === 'dark' ? '#334155' : 'grey.100', // slate-700 / grey-100
                  boxShadow: 'none',
                },
              }}
            >
              Get Started
            </MuiButton>
          ) : (
            <Button variant="secondary" size="lg">
              Get Started
            </Button>
          )}
        </Link>
      </div>
    </section>
  );
}
