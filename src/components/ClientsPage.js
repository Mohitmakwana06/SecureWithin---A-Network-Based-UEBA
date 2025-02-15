import React from 'react';
import AppTheme from '../shared-theme/AppTheme';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import CssBaseline from '@mui/material/CssBaseline';
import AppNavbar from './AppNavbar';
import Header from './Header';
import { DataGrid } from '@mui/x-data-grid';
import { columns } from './Columns';
import { rows } from './Data';

function ClientsPage() {
  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      
      {/* Full-Page Layout */}
      <Box 
        sx={{
          display: 'flex',
          flex:'1',
          flexDirection: 'column',
          width:'100%',
        }}
      >
        {/* Navigation Bar */}
        
        
        {/* Header Section */}
        <Stack
          spacing={1}
          sx={{
            pb: 1,
            mt: { xs: 8, md: 2 },
            
          }}
        >
          <Header />
          <div>
            <Typography variant="h3" padding={2} >
              Clients
            </Typography>
          </div>
          <div style={{ height: '100%', width: '100%' }}>
          <DataGrid rows={rows} columns={columns} pageSize={5} />
          </div>
        </Stack>

        {/* Main Content Section */}
        
      </Box>
    </AppTheme>
  );
}

export default ClientsPage;
