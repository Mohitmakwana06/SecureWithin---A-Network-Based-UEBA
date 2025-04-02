import React, { useState, useEffect } from 'react';
import AppTheme from '../shared-theme/AppTheme';
import { Typography, Button } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import CssBaseline from '@mui/material/CssBaseline';
import AppNavbar from './AppNavbar';
import Header from './Header';
import AddClient from './AddClient'; // Import the popup component
import ClientsList from './ClientsList'; // Import ClientsList component

function ClientsPage() {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />

      {/* Full-Page Layout */}
      <Box
        sx={{
          display: 'flex',
          flex: '1',
          flexDirection: 'column',
          width: '100%',
        }}
      >
        {/* Header Section */}
        <Stack spacing={1} sx={{ pb: 1, mt: { xs: 8, md: 2 } }}>
          <Header />
          {/* Clients Heading with Add Client Button */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
            }}
          >
            <Typography variant="h3">Clients</Typography>
            <Button variant="contained" color="primary" onClick={handleOpen}>
              Add Client
            </Button>
          </Box>
          {/* Clients List Section */}
          <Box sx={{ height: '100%', width: '100%', px: 2 }}>
            <ClientsList /> {/* Render the ClientsList component */}
          </Box>
        </Stack>
      </Box>

      {/* Add Client Popup */}
      <AddClient open={open} handleClose={handleClose} />
    </AppTheme>
  );
}

export default ClientsPage;
