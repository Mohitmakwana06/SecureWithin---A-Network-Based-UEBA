import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Link } from 'react-router-dom';
import Chip from '@mui/material/Chip'; // To display status as a chip

const GridData = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch clients using async/await
  const fetchClients = async () => {
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
      setClients(data); // Set clients data
    } catch (err) {
      setError('Failed to load client data: ' + err.message); // Set error if failed
    } finally {
      setLoading(false); // Stop loading when done
    }
  };

  // UseEffect to fetch data on component mount
  useEffect(() => {
    fetchClients(); // Trigger fetch on mount
  }, []);

  // Columns configuration for the DataGrid
  const columns = [
    {
      field: 'id',
      headerName: 'Client ID',
      width: 150,
      renderCell: (params) => (
        <Link
          to={{
            pathname: `/details/${params.row.id}`,
            state: params.row, // Pass the entire row data to the DetailsPage
          }}
          style={{ textDecoration: 'none' }}
        >
          {params.value}
        </Link>
      ),
    },
    {
      field: 'client_name',
      headerName: 'Client Name',
      width: 250,
      renderCell: (params) => (
        <Link
          to={{
            pathname: `/details/${params.row.id}`,
            state: params.row, // Pass the entire row data to the DetailsPage
          }}
          style={{ textDecoration: 'none' }}
        >
          {params.value}
        </Link>
      ),
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

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <h1>Client List</h1>

      {loading && <p>Loading...</p>}
      {error && !loading && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <DataGrid
          rows={clients}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
        />
      )}
    </div>
  );
};

export default GridData;
