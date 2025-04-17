import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { LineChart } from '@mui/x-charts/LineChart';

function AreaGradient({ color, id }) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.5} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

export default function LogCountsChart() {
  const theme = useTheme();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;
  const wsUrls = [
    'ws://localhost:8000/ws/visualizations',
    'ws://127.0.0.1:8000/ws/visualizations',
    'ws://localhost:5000/ws/visualizations',
  ];

  const connectWebSocket = (urlIndex = 0) => {
    if (urlIndex >= wsUrls.length) {
      setError(`Failed to connect after trying all URLs: ${wsUrls.join(', ')}`);
      setLoading(false);
      return null;
    }

    const ws = new WebSocket(wsUrls[urlIndex]);

    ws.onopen = () => {
      console.log(`WebSocket connected to ${wsUrls[urlIndex]}`);
      setRetryCount(0);
      setError(null); // Clear error on successful connection
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('✅ Received WebSocket data:', data);

        // Handle heartbeat
        if (data?.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          console.log('Sent pong');
          return;
        }

        // Handle visualization data
        if (
          data &&
          typeof data === 'object' &&
          'record_counts_over_time' in data &&
          Array.isArray(data.record_counts_over_time)
        ) {
          console.log('Setting chart data:', data.record_counts_over_time);
          setChartData(data.record_counts_over_time);
          setLoading(false);
          setError(null);
        } else {
          console.warn('Unexpected data structure:', data);
          setError('Invalid data format received');
          setLoading(false);
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
        setError('Failed to parse data from server');
        setLoading(false);
      }
    };

    ws.onerror = (err) => {
      console.error(`WebSocket error on ${wsUrls[urlIndex]}:`, err);
      ws.close();
    };

    ws.onclose = (event) => {
      console.log(`WebSocket closed on ${wsUrls[urlIndex]}:`, event);
      if (retryCount < maxRetries) {
        setRetryCount(retryCount + 1);
        console.log(`Attempting reconnect (${retryCount + 1}/${maxRetries}) to next URL...`);
        setTimeout(() => connectWebSocket(urlIndex + 1), 2000);
      } else {
        setError(`Failed to reconnect after ${maxRetries} attempts across ${wsUrls.length} URLs`);
        setLoading(false);
      }
    };

    return ws;
  };

  useEffect(() => {
    const ws = connectWebSocket();
    return () => {
      if (ws) {
        ws.close();
        console.log('WebSocket closed on component unmount');
      }
    };
  }, []);

  if (loading) {
    return <Typography align="center">📊 Loading log count data...</Typography>;
  }

  if (error) {
    return (
      <Typography align="center" color="error">
        ❌ {error}
        <br />
        <Typography variant="caption" color="text.secondary">
          Check if backend is running on {wsUrls.join(', ')} or see Console for details.
        </Typography>
      </Typography>
    );
  }

  // Safe check for chartData
  if (!chartData || chartData.length === 0) {
    return <Typography align="center">📊 No data available</Typography>;
  }

  const xAxisData = chartData.map((item) => {
    const date = new Date(item.date);
    const day = date.getDate();
    const suffix = ['th', 'st', 'nd', 'rd'][(day % 10 > 3) ? 0 : (day % 10)] || 'th';
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}${suffix} ${month} ${year}`;
  });

  const logCountData = chartData.map((item) => item.count);
  const totalCount = chartData.reduce((acc, curr) => acc + curr.count, 0);

  // Debugging: Log data points
  console.log('Chart Data Points:', { xAxisData, logCountData });

  return (
    <Card
      variant="outlined"
      sx={{
        width: '100%',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
      }}
    >
      <CardContent>
        <Typography
          align="center"
          component="h2"
          variant="subtitle2"
          gutterBottom
          sx={{ color: '#ffffff' }}
        >
          Log Counts
        </Typography>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={1}
          mb={1}
          sx={{ color: '#ffffff' }}
        >
          <Typography variant="h4" sx={{ color: '#ffffff' }}>
            {totalCount}
          </Typography>
          <Typography variant="subtitle2" color="success.main">
            +35% {/* Adjust dynamically if needed */}
          </Typography>
        </Stack>

        <Typography
          align="center"
          variant="caption"
          sx={{ color: '#bbbbbb', mb: 2 }}
        >
          Log counts per 12 hours
        </Typography>

        <LineChart
          height={250}
          xAxis={[
            {
              scaleType: 'point',
              data: xAxisData,
              tickMinStep: 1,
              tickLabelStyle: { fill: '#ffffff' },
            },
          ]}
          yAxis={[
            {
              label: 'Log counts per 12 hours',
              labelStyle: { fill: '#ffffff' },
            },
          ]}
          series={[
            {
              id: 'logCounts',
              label: 'Log Counts',
              data: logCountData,
              area: true,
              curve: 'linear',
              showMark: true,
              stack: 'total',
              color: '#4CAF50',
            },
          ]}
          margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
          grid={{ horizontal: true, vertical: false }}
          sx={{
            '& .MuiAreaElement-series-logCounts': {
              fill: "url('#logCounts-gradient')",
            },
            '& .MuiChartsTooltip-root': {
              backgroundColor: '#333333',
              color: '#ffffff',
            },
          }}
          slotProps={{
            legend: { hidden: true },
            tooltip: { trigger: 'item' },
          }}
        >
          <AreaGradient color="#4CAF50" id="logCounts-gradient" />
        </LineChart>
      </CardContent>
    </Card>
  );
}