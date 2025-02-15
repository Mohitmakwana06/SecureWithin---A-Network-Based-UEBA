import React, { useRef, useState } from 'react';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import CustomDatePicker from './CustomDatePicker';
import NavbarBreadcrumbs from './NavbarBreadcrumbs';
import ColorModeIconDropdown from '../shared-theme/ColorModeIconDropdown';
import Search from './Search';
import GiftOutlined from '@ant-design/icons/GiftOutlined';
import MessageOutlined from '@ant-design/icons/MessageOutlined';
import SettingOutlined from '@ant-design/icons/SettingOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';

export default function Header() {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(2);
 
  

  // Toggle notification visibility
  const handleToggle = () => setOpen((prevOpen) => !prevOpen);
  const handleClick = (position) => {
    console.log('Clicked position:', position);};

  // Close notification popper when clicking outside
  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  return (
    <Stack
      direction="row"
      sx={{
        display: { xs: 'none', md: 'flex' },
        width: '100%',
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        
        position:'relative',
        maxWidth: { sm: '100%', md: '100%' },
        pt: 1,
      }}
      spacing={2}
    >
      <div>
      <NavbarBreadcrumbs />
      </div>
      <div direction={'left'}>
        <Stack direction="row" sx={{ gap: 1 }}>
          <Search />
          <CustomDatePicker />

          {/* Notification Icon and Popper */}
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <IconButton
              ref={anchorRef}
              color="inherit"
              aria-label="open notifications"
              onClick={() => {
                handleToggle();
                handleClick('botton');
              }}
            >
              <Badge badgeContent={read} color="primary">
                <NotificationsRoundedIcon />
              </Badge>
            </IconButton>

            {/* Notification Popper */}
            <Popper
              open={open}
              anchorEl={anchorRef.current}
              placement='bottom-end'// Adjusted for top-right corner placement
              /*role={undefined}
              transition*/
              disablePortal
              sx={{ zIndex: 1201 }}
            >
              <Paper 
              sx={{ 
                alignSelf:'flex-end',
                width: 350, 
                maxWidth: '100%', 
                mt: 1.5,
                top:0,
                right:0,
              }}
              >
                <ClickAwayListener onClickAway={handleClose}>
                  <Box sx={{ p: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between',alignItems: 'center', p: 1 }}>
                      <Typography variant="h6" sx={{ pl: 1 }} align='left'>Notification</Typography>
                      <Tooltip title="Mark all as read">
                        <IconButton
                          align='right'
                          size="small"
                          onClick={() => setRead(0)}
                          color="success"
                        >
                          <CheckCircleOutlined />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <List>
                      <ListItemButton>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'success.lighter' }}>
                            <GiftOutlined />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Cristina Danny's birthday today."
                          secondary="2 min ago"
                        />
                      </ListItemButton>
                      <Divider />
                      <ListItemButton>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.lighter' }}>
                            <MessageOutlined />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Aida Burg commented on your post."
                          secondary="5 August"
                        />
                      </ListItemButton>
                      <Divider />
                      <ListItemButton>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'error.lighter' }}>
                            <SettingOutlined />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Profile completion at 60%."
                          secondary="7 hours ago"
                        />
                      </ListItemButton>
                    </List>
                  </Box>
                </ClickAwayListener>
              </Paper>
            </Popper>
          </Box>

          <ColorModeIconDropdown />
        </Stack>
      </div>
    </Stack>
  );
}
