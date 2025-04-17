import * as React from 'react';
import { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SelectContent from './SelectContent';
import MenuContent from './MenuContent';
import OptionsMenu from './OptionsMenu';
import AppTheme from '../shared-theme/AppTheme';
import Logo from '../Logo.png';
import axios from 'axios';

// Drawer styling
const drawerWidth = 240;

const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  mt: 10,
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
  },
});

export default function SideMenu() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const storedName = localStorage.getItem('userName');

    if (storedEmail && storedName) {
      setUser({ email: storedEmail, name: storedName });
    }

    setLoading(false);
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    setUser(null);
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <AppTheme>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          [`& .${drawerClasses.paper}`]: {
            backgroundColor: 'background.paper',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            mt: 'calc(var(--template-frame-height, 0px) + 4px)',
            p: 1.5,
          }}
        >
          <img
            src={Logo}
            alt="Logo"
            style={{
              width: '32px',
              height: '32px',
              marginRight: '8px',
              filter:
                'invert(39%) sepia(53%) saturate(1732%) hue-rotate(194deg) brightness(94%) contrast(93%)',
            }}
          />
          <Typography fontSize={25} variant="h4" color={'#4876EE'}>
            SecureWithin
          </Typography>
        </Box>
        <Divider />
        <MenuContent />
        {user ? (
          <Stack
            direction="row"
            sx={{
              p: 2,
              gap: 1,
              alignItems: 'center',
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Avatar
              sizes="small"
              alt={user.name}
              src="/static/images/avatar/7.jpg"
              sx={{ width: 36, height: 36 }}
            />
            <Box sx={{ mr: 'auto' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: '16px' }}>
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {user.email}
              </Typography>
            </Box>
            <OptionsMenu onLogout={handleLogout} />
          </Stack>
        ) : (
          <Typography sx={{ p: 2 }}>Please log in</Typography>
        )}
      </Drawer>
    </AppTheme>
  );
}
