import { Link as RouterLink } from 'react-router-dom';
import { Rocket, ArrowRight } from 'lucide-react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import MuiButton from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../state/AuthContext';
import { UserMenu } from './UserMenu';
import { NAV_LINKS } from './navLinks';

// Material (MUI) top navigation. A coloured, elevated MUI AppBar — the clearest signal that the
// Material theme is active (vs the Classic flat, bordered, near-white header). Same content and
// routing as the Classic navbar; the profile menu (with the theme switcher) reuses the shared
// theme-aware UserMenu. In light mode the bar is indigo and controls use light-on-primary
// colours; in dark mode the bar becomes a dark surface (background.paper) and controls switch to
// standard readable text tokens, so nothing relies on hardcoded light colours.

export function MaterialNavbar() {
  const { user, loading } = useAuth();
  const isDark = useTheme().palette.mode === 'dark';
  // Foreground for items sitting directly on the bar: white on the indigo (light) bar, standard
  // primary text on the dark bar.
  const barForeground = isDark ? 'text.primary' : 'primary.contrastText';

  return (
    <AppBar
      position="sticky"
      elevation={4}
      color="primary"
      sx={{
        bgcolor: isDark ? 'background.paper' : 'primary.main',
        color: barForeground,
        backgroundImage: 'none',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 2, minHeight: { xs: 64, sm: 64 } }}>
          <Box
            component={RouterLink}
            to="/"
            aria-label="SpecPilot home"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              textDecoration: 'none',
              color: barForeground,
            }}
          >
            <Rocket className="h-6 w-6" aria-hidden="true" />
            <Box component="span" sx={{ fontSize: '1.25rem', fontWeight: 700 }}>
              SpecPilot
            </Box>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, ml: 2 }}>
            {NAV_LINKS.map((link) => (
              <MuiButton
                key={link.label}
                href={link.href}
                sx={{ color: barForeground, opacity: 0.85, '&:hover': { opacity: 1 } }}
              >
                {link.label}
              </MuiButton>
            ))}
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* While the first auth-state resolution is pending, render no auth control to avoid a
              signed-out → signed-in flash. */}
          {!loading &&
            (user ? (
              <UserMenu />
            ) : (
              <MuiButton
                component={RouterLink}
                to="/login"
                sx={{ color: barForeground, opacity: 0.9, '&:hover': { opacity: 1 } }}
              >
                Log in
              </MuiButton>
            ))}

          {/* A contrasting CTA that stands out on the bar: a white button on the indigo (light)
              bar, and a filled indigo button on the dark bar. */}
          <MuiButton
            component={RouterLink}
            to="/generate"
            aria-label="Get started — generate a specification"
            variant="contained"
            endIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            sx={{
              bgcolor: isDark ? 'primary.main' : 'common.white',
              color: isDark ? 'primary.contrastText' : 'primary.main',
              boxShadow: 'none',
              '&:hover': { bgcolor: isDark ? 'primary.dark' : 'grey.100', boxShadow: 'none' },
            }}
          >
            Get Started
          </MuiButton>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
