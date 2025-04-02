import React, { useEffect, useState, useRef } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Chip from '@mui/material/Chip'; // To display status as a chip

const ClientsList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const wsRef = useRef(null); // Use ref to store WebSocket instance
  const navigate = useNavigate(); // For navigation

  // Function to fetch clients
  const fetchClients = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('http://localhost:8000/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to load client data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients(); // Fetch initial data

    // WebSocket connection
    const connectWebSocket = () => {
      wsRef.current = new WebSocket('ws://localhost:8000/ws');

      wsRef.current.onopen = () => {
        console.log("WebSocket connection established");
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "connection", message: "Client connected" }));
        }
      };

      wsRef.current.onmessage = (event) => {
        console.log("Received from server:", event.data);
        try {
          const update = JSON.parse(event.data);
          
          // If we received a status update for a specific client
          if (update.client_id && update.status !== undefined) {
            setClients(prevClients => 
              prevClients.map(client => 
                client.id === update.client_id ? 
                  {...client, status: update.status} : 
                  client
              )
            );
          }
          // If we received a full clients list (for future compatibility)
          else if (Array.isArray(update)) {
            setClients(update);
          }
        } catch (err) {
          console.error("Error processing WebSocket message:", err);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error("WebSocket Error:", error);
      };

      wsRef.current.onclose = (event) => {
        console.log("WebSocket connection closed", event);
        // Reconnect after 3 seconds if the connection is closed
        setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket(); // Start WebSocket connection

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(); // Close WebSocket on component unmount
      }
    };
  }, []);

  const columns = [
    {
      field: 'id',
      headerName: 'Client ID',
      width: 150,
      renderCell: (params) => (
        <Link to={`/details/${params.row.id}`} style={{ textDecoration: 'none' }}>
          {params.value}
        </Link>
      ),
    },
    {
      field: 'client_name',
      headerName: 'Client Name',
      width: 250,
      renderCell: (params) => (
        <Link to={`/details/${params.row.id}`} style={{ textDecoration: 'none' }}>
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
        const status = params.value || 'Offline';
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
          autoHeight
          disableSelectionOnClick
        />
      )}
    </div>
  );
};

export default ClientsList;