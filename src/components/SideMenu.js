import * as React from 'react';
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
import Logo from '../Logo.png'


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
          <img src={Logo}
            alt="Logo"
            style={{
            width: '32px', // Adjust the size
            height: '32px', // Adjust the size
            marginRight: '8px', // Adds spacing between the logo and text
            filter: 'invert(39%) sepia(53%) saturate(1732%) hue-rotate(194deg) brightness(94%) contrast(93%)',
          }}/>
          <Typography fontSize={25} 
            variant="h4" color={'#4876EE'} 
          >SecureWithin</Typography>
        </Box>
        <Divider />
        <MenuContent />
        {/*<CardAlert />*/}
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
            alt="preet dudhat"
            src="/static/images/avatar/7.jpg"
            sx={{ width: 36, height: 36 }}
          />
          <Box sx={{ mr: 'auto' }}>
            <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: '16px' }}>
              preet dudhat
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              preet@email.com
            </Typography>
          </Box>
          <OptionsMenu />
        </Stack>
      </Drawer>
      </AppTheme>
  );
}
