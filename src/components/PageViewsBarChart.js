import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '@mui/material/styles';

export default function PageViewsBarChart() {
  const theme = useTheme();
  const colorPalette = [
    (theme.vars || theme).palette.primary.dark,
    (theme.vars || theme).palette.primary.main,
    (theme.vars || theme).palette.primary.light,
  ];

  const [chartData, setChartData] = React.useState({
    months: [],
    seriesData: [],
  });

  const ws = React.useRef(null);

  React.useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8000/ws/visualizations");

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('✅ Received WebSocket data (PageViewsBarChart):', JSON.stringify(data, null, 2));

        // Handle heartbeat
        if (data?.type === 'ping') {
          ws.current.send(JSON.stringify({ type: 'pong' }));
          console.log('Sent pong (PageViewsBarChart)');
          return;
        }

        // Validate data
        if (!data || typeof data !== 'object' || !Array.isArray(data.most_visited_domains)) {
          console.warn('Unexpected data structure in PageViewsBarChart:', data);
          return;
        }

        console.log('Processing most_visited_domains:', data.most_visited_domains);

        const months = [];
        const domainMap = {};

        data.most_visited_domains.forEach((monthEntry) => {
          const month = monthEntry.month;
          months.push(month);

          // Ensure domains is an array
          const domains = Array.isArray(monthEntry.domains) ? monthEntry.domains : [];
          domains.forEach(({ domain, visits }) => {
            if (!domainMap[domain]) domainMap[domain] = [];
            domainMap[domain].push({ month, visits });
          });
        });

        // Ensure that each domain has data for each month (fill 0s)
        Object.keys(domainMap).forEach((domain) => {
          const monthToVisits = Object.fromEntries(domainMap[domain].map((d) => [d.month, d.visits]));
          domainMap[domain] = months.map((m) => monthToVisits[m] || 0);
        });

        const seriesData = Object.entries(domainMap).map(([domain, data]) => ({
          label: domain,
          data: data,
          stack: 'A',
        }));

        setChartData({ months, seriesData });

      } catch (error) {
        console.error('WebSocket data parsing error in PageViewsBarChart:', error, 'Raw event:', event.data);
      }
    };

    ws.current.onerror = (err) => {
      console.error('WebSocket error in PageViewsBarChart:', err);
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket closed in PageViewsBarChart:', event);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
        console.log('WebSocket closed on PageViewsBarChart unmount');
      }
    };
  }, []);

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography align="center" component="h2" variant="subtitle2" gutterBottom>
          Most Visited Domains
        </Typography>
        <Stack sx={{ justifyContent: 'space-between' }}>
          <Stack
            direction="row"
            sx={{
              alignContent: { xs: 'center', sm: 'flex-start' },
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="h4" component="p">
              {chartData.seriesData.length > 0 ? 'Top Domains' : 'Loading...'}
            </Typography>
            <Chip size="small" color="success" label="Live" />
          </Stack>
          <Typography align="center" variant="caption" sx={{ color: 'text.secondary' }}>
            Domain traffic trends over the last 6 months
          </Typography>
        </Stack>
        <BarChart
          borderRadius={8}
          colors={colorPalette}
          xAxis={[
            {
              scaleType: 'band',
              categoryGapRatio: 0.5,
              data: chartData.months,
            },
          ]}
          series={chartData.seriesData}
          height={250}
          margin={{ left: 50, right: 0, top: 20, bottom: 20 }}
          grid={{ horizontal: true }}
          slotProps={{
            legend: {
              hidden: false,
            },
          }}
        />
      </CardContent>
    </Card>
  );
}