import { useState, type MouseEvent } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { ChevronDown, FolderOpen, LogOut } from 'lucide-react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { useUserMenu } from './userMenu.shared';
import { ThemeSwitcher } from './ThemeSwitcher';
import { ColorModeToggle } from './ColorModeToggle';

// Material (MUI) profile menu. Same account actions and behaviour as the Classic dropdown, built
// from MUI's Avatar / Menu / MenuItem. Auth wiring is shared via useUserMenu, so only the
// presentation differs.

export function MaterialUserMenu() {
  const { user, label, initial, onLibrary, signOutAndGoHome } = useUserMenu();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  if (!user) {
    return null;
  }

  function handleClose() {
    setAnchorEl(null);
  }

  async function handleSignOut() {
    handleClose();
    await signOutAndGoHome();
  }

  return (
    <>
      <Button
        onClick={(event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={open}
        color="inherit"
        sx={{
          textTransform: 'none',
          borderRadius: 999,
          border: 1,
          // Trigger sits on the coloured (indigo) AppBar, so use light-on-primary colours.
          borderColor: 'rgba(255, 255, 255, 0.5)',
          pl: 0.5,
          pr: 1.5,
          color: 'primary.contrastText',
        }}
        startIcon={
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: 'common.white',
              color: 'primary.main',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            {initial}
          </Avatar>
        }
        endIcon={<ChevronDown className="h-4 w-4" aria-hidden="true" />}
      >
        <Box
          component="span"
          sx={{
            display: { xs: 'none', sm: 'inline' },
            maxWidth: '16ch',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 224, mt: 1 } } }}
      >
        <Typography
          variant="caption"
          aria-hidden="true"
          sx={{ display: 'block', px: 2, pt: 1, pb: 0.5, color: 'text.secondary' }}
        >
          {user.email}
        </Typography>

        <MenuItem
          component={RouterLink}
          to="/library"
          onClick={handleClose}
          selected={onLibrary}
          aria-current={onLibrary ? 'page' : undefined}
        >
          <ListItemIcon>
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
          </ListItemIcon>
          My Specifications
        </MenuItem>

        <Divider />

        <Box sx={{ px: 2, py: 1 }}>
          <Typography
            variant="caption"
            sx={{ display: 'block', color: 'text.secondary', pb: 0.75 }}
          >
            Theme
          </Typography>
          <ThemeSwitcher />
        </Box>

        <Divider />

        <Box sx={{ px: 2, py: 1 }}>
          <Typography
            variant="caption"
            sx={{ display: 'block', color: 'text.secondary', pb: 0.75 }}
          >
            Appearance
          </Typography>
          <ColorModeToggle />
        </Box>

        <Divider />

        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
