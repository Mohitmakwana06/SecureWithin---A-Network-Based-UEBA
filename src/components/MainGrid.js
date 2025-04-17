import * as React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Copyright from '../internals/components/Copyright';
import ChartUserByCountry from './ChartUserByCountry';
import CustomizedTreeView from './CustomizedTreeView';
import CustomizedDataGrid from './CustomizedDataGrid';
import PageViewsBarChart from './PageViewsBarChart';
import SessionsChart from './SessionsChart';
import StatCard from './StatCard';

export default function MainGrid() {
  const [statData, setStatData] = React.useState([]);

  React.useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/visualizations');

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('✅ Received WebSocket data (MainGrid):', JSON.stringify(data, null, 2));

        // Handle heartbeat
        if (data?.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          console.log('Sent pong (MainGrid)');
          return;
        }

        // Validate data
        if (
          !data ||
          typeof data !== 'object' ||
          !Array.isArray(data.top_clients) ||
          !Array.isArray(data.network_trend) ||
          !Array.isArray(data.protocol_usage)
        ) {
          console.warn('Unexpected data structure in MainGrid:', data);
          return;
        }

        console.log('Processing stat data:', {
          topClients: data.top_clients,
          networkTrend: data.network_trend,
          protocolUsage: data.protocol_usage,
        });

        const newData = [
          {
            title: 'Top Clients',
            value: `${data.top_clients.length}`,
            interval: 'Every minute',
            trend: 'up',
            data: data.top_clients.slice(0, 30).map((client) => ({
              x: client.ip || client.client_id || 'Unknown',
              y: client.bytes || 0,
            })),
          },
          {
            title: 'Network Trend',
            value: `${data.network_trend.reduce((a, b) => a + (b.bytes || 0), 0)}`,
            interval: 'Every minute',
            trend: 'neutral',
            data: data.network_trend.slice(0, 30).map((point, index) => ({
              x: point.timestamp || `T${index + 1}`,
              y: point.bytes || 0,
            })),
          },
          {
            title: 'Protocol Usage',
            value: `${data.protocol_usage.length}`,
            interval: 'Every minute',
            trend: 'down',
            data: data.protocol_usage.slice(0, 30).map((proto, index) => ({
              x: proto.protocol || `P${index + 1}`,
              y: proto.bytes || 0,
            })),
          },
        ];

        setStatData(newData);
      } catch (error) {
        console.error('WebSocket data parsing error in MainGrid:', error, 'Raw event:', event.data);
      }
    };

    ws.onerror = (error) => console.error('WebSocket Error in MainGrid:', error);
    ws.onclose = (event) => console.log('WebSocket closed in MainGrid:', event);

    return () => {
      ws.close();
      console.log('WebSocket closed on MainGrid unmount');
    };
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: { sm: '100%', md: '1700px' },
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'auto',
        p: 2,
      }}
    >
      <Typography component="h2" variant="h6" sx={{ mb: 2 }} align="center">
        Overview
      </Typography>

      <Grid container spacing={2}>
        {statData.map((card, index) => (
          <Grid item key={index} xs={12} sm={6} lg={4}>
            <StatCard {...card} />
          </Grid>
        ))}

        <Grid item xs={12} md={6}>
          <SessionsChart />
        </Grid>
        <Grid item xs={12} md={6}>
          <PageViewsBarChart />
        </Grid>
      </Grid>

      <Typography component="h2" variant="h6" sx={{ mt: 4, mb: 2 }} align="center">
        Details
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={9}>
          <CustomizedDataGrid />
        </Grid>
        <Grid item xs={12} lg={3}>
          <Stack gap={2} direction={{ xs: 'column', sm: 'row', lg: 'column' }}>
            <CustomizedTreeView />
            <ChartUserByCountry />
          </Stack>
        </Grid>
      </Grid>

      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}