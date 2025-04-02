import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import Chip from '@mui/material/Chip'; // For displaying the status as a Chip component

export default function CustomizedDataGrid() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]); // State to hold the rows data
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  // Fetch data from the backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/clients', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setRows(data); // Set rows with the fetched data
      } catch (err) {
        setError('Failed to load client data: ' + err.message);
      } finally {
        setLoading(false); // Stop loading once data is fetched or error occurs
      }
    };

    fetchData(); // Call fetchData when the component mounts
  }, []); // Empty dependency array ensures it only runs once when the component mounts

  // Handle row click to navigate to the details page
  const handleRowClick = (params) => {
    navigate(`/details/${params.row.id}`); // Navigate to the details page of the clicked row
  };

  // Column definitions
  const columns = [
    {
      field: 'id',
      headerName: 'Client ID',
      width: 150,
      renderCell: (params) => params.value, // Display client ID
    },
    {
      field: 'client_name',
      headerName: 'Client Name',
      width: 250,
      renderCell: (params) => params.value, // Display client name
    },
    {
      field: 'client_role',
      headerName: 'Client Role',
      width: 200,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => {
        const status = params.value;
        const statusColor = status === 'Online' ? 'success' : 'default';
        return <Chip label={status} color={statusColor} size="small" />;
      },
    },
  ];

  // If data is still loading
  if (loading) {
    return <div>Loading...</div>; // Show loading message while fetching data
  }

  // If there was an error fetching the data
  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>; // Show error message if there's an error
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      {/* DataGrid Component */}
      <DataGrid
        checkboxSelection
        rows={rows} // Use the dynamic rows state
        columns={columns}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd' // Alternate row classes for styling
        }
        initialState={{
          pagination: { paginationModel: { pageSize: 20 } }, // Initial pagination state
        }}
        pageSizeOptions={[10, 20, 50]} // Options for page size
        disableColumnResize // Disable resizing columns
        density="compact" // Compact density for the grid
        onRowClick={handleRowClick} // Handle row click here
        slotProps={{
          filterPanel: {
            filterFormProps: {
              logicOperatorInputProps: {
                variant: 'outlined',
                size: 'small',
              },
              columnInputProps: {
                variant: 'outlined',
                size: 'small',
                sx: { mt: 'auto' },
              },
              operatorInputProps: {
                variant: 'outlined',
                size: 'small',
                sx: { mt: 'auto' },
              },
              valueInputProps: {
                InputComponentProps: {
                  variant: 'outlined',
                  size: 'small',
                },
              },
            },
          },
        }}
      />
    </div>
  );
}
