import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Paper, Grid, Typography } from "@mui/material";
import { styled } from '@mui/material/styles';
import MuiCard from '@mui/material/Card';
import PageViewsBarChart from "./PageViewsBarChart";
import Header from "./Header";
import AppTheme from "../shared-theme/AppTheme";
import ChartUserByCountry from "./ChartUserByCountry";
import ClientTable from './ClientTable';

const Card = styled(MuiCard)(({ theme }) => ({
  gap: theme.spacing(2),
  boxShadow: 'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '450px',
  },
  elevation: 3, padding: 20, width: "100%", paddingBottom: '20px',
}));

const DetailsPage = () => {
  const { client_id } = useParams(); // Get the ID from the URL
  console.log("Client ID:", client_id);
  const [clientData, setClientData] = useState(null); // State to store the client data
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  useEffect(() => {
    if (client_id) {  // Ensure client_id exists before making a request
      const fetchClientData = async () => {
        try {
          console.log("Fetching client data for client_id:", client_id);
          const response = await fetch(`http://localhost:8000/clients/${client_id}`);
          console.log("Response status:", response.status);
          if (!response.ok) {
            throw new Error(`Client not found, status: ${response.status}`);
          }
          const data = await response.json();
          console.log('Fetched data for client:', data);
          setClientData(data);
        } catch (err) {
          console.error('Error fetching client data:', err);
          setError(err.message);
        } finally {
          setLoading(false);  // Ensures loading is set to false regardless of success or failure
        }
      };

      fetchClientData();
    }
  }, [client_id]); 

  if (loading) {
    return <Typography>Loading...</Typography>; // Show loading text while data is being fetched
  }

  if (error) {
    return <Typography style={{ color: 'red' }}>Error: {error}</Typography>; // Show error if the fetch fails
  }

  if (!clientData) {
    return <Typography>No data found for client {client_id}</Typography>; // Show message if no data is found
  }

  return (
    <AppTheme>
      <Grid container  style={{ marginTop: 20 }}>
        <Grid paddingBottom={'20px'} width={'100%'}><Header /></Grid>
        <Grid paddingBottom={'20px'} width={'100%'}>
          <Card style={{ padding: 20, width: "1200px" }} paddingBottom={'20px'}>
            <Typography variant="h5" align="center" gutterBottom>
              Client Details
            </Typography>
            <Grid container spacing={40}>
              {/* First Column */}
              <Grid item xs={4}>
                <Typography variant="body1"><strong>Name:</strong> {clientData.name}</Typography>
                <Typography variant="body1"><strong>ID:</strong> {clientData.id}</Typography>
              </Grid>
              {/* Second Column */}
              <Grid item xs={4}>
                <Typography variant="body1"><strong>Role:</strong> {clientData.role}</Typography>
                <Typography variant="body1"><strong>Status:</strong> {clientData.status}</Typography>   
              </Grid>
            </Grid>
          </Card>
        </Grid>
        <Grid paddingBottom={'20px'} width={'1210px'}>
          <PageViewsBarChart />
        </Grid>
        <Grid paddingBottom={'20px'} width={'1245px'}>
          {/*<ChartUserByCountry />*/}
        </Grid>
        <Grid paddingBottom={'20px'} width={'600px'}>
          {client_id ? (
            <ClientTable clientId={client_id} />
          ) : (
            <Typography variant="body1">Loading clientId...</Typography>
          )}
        </Grid>
      </Grid>
    </AppTheme>
  );
};

export default DetailsPage;