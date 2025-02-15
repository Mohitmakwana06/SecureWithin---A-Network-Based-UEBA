// TableColumns.js
import React from 'react';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { Link } from 'react-router-dom';

export const getDaysInMonth = (month, year) => {
  const date = new Date(year, month, 0);
  const monthName = date.toLocaleDateString('en-US', { month: 'short' });
  const daysInMonth = date.getDate();
  const days = [];
  let i = 1;
  while (days.length < daysInMonth) {
    days.push(`${monthName} ${i}`);
    i += 1;
  }
  return days;
};

export const renderSparklineCell = (params) => {
  const data = getDaysInMonth(4, 2024);
  const { value, colDef } = params;
  if (!value || value.length === 0) return null;

  return (
    <div style={{ display: 'flex', flex: '1', alignItems: 'center', height: '100%', width:'100%' }}>
      <SparkLineChart
        data={value}
        width={colDef.computedWidth || 100}
        height={32}
        plotType="bar"
        showHighlight
        showTooltip
        colors={['hsl(210, 98%, 42%)']}
        xAxis={{ scaleType: 'band', data }}
      />
    </div>
  );
};

export const renderStatus = (status) => {
  const colors = {
    Online: 'success',
    Offline: 'default',
  };
  return <Chip label={status} color={colors[status]} size="small" />;
};

export const renderAvatar = (params) => {
  if (params.value == null) return '';
  return (
    <Avatar
      sx={{
        backgroundColor: params.value.color,
        width: '24px',
        height: '24px',
        fontSize: '0.85rem',
      }}
    >
      {params.value.name.toUpperCase().substring(0, 1)}
    </Avatar>
  );
};

export const columns = [
  {
    field: 'pageTitle',
    headerName: 'Page Title',
    flex: 1.5,
    minWidth: 300,
    renderCell: (params) => (
      <Link
      to={`/details/${params.row.id}`} // Navigate using the row's ID
      state={{ ...params.row }} // Pass the entire row data as state
      style={{ textDecoration: 'none', color: 'white' }}
      >
        {params.value}
      </Link>
    ),
  },
  {
    field: 'status',
    headerName: 'Status',
    flex: 0.5,
    minWidth: 150,
    renderCell: (params) => renderStatus(params.value),
  },
  {
    field: 'users',
    headerName: 'Users',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 150,
  },
  {
    field: 'eventCount',
    headerName: 'Event Count',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 150,
  },
  {
    field: 'viewsPerUser',
    headerName: 'Views per User',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 150,
  },
  {
    field: 'averageTime',
    headerName: 'Average Time',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 150,
  },
  {
    field: 'conversions',
    headerName: 'Daily Conversions',
    flex: 1,
    minWidth: 150,
    renderCell: renderSparklineCell,
  },
];
