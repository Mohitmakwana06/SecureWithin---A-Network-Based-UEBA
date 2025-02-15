import React from "react";
import { useParams, useLocation } from "react-router-dom";
import { Paper, Grid, Typography } from "@mui/material";
import { styled } from '@mui/material/styles';
import MuiCard from '@mui/material/Card';
import PageViewsBarChart from "./PageViewsBarChart";
import Header from "./Header";
import AppTheme from "../shared-theme/AppTheme";
import ChartUserByCountry from "./ChartUserByCountry";


const Card = styled(MuiCard)(({ theme }) => ({
  //display: 'flex',
  //flexDirection: 'column',
  //alignSelf: 'center',
  //width: '100%',
  //padding: theme.spacing(4),
  gap: theme.spacing(2),
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '450px',
  },
  elevation:3,  padding: 20, width: "100%" , paddingBottom:'20px',
}));


const DetailsPage = () => {
  const { id } = useParams(); // Get the ID from the URL
  const location = useLocation(); // Access the state passed from the Link
  const rowData = location.state; // Extract row data

  if (!rowData) {
    return <Typography align="center">No data found for ID: {id}</Typography>; // Fallback for direct URL access
  }

  return (
    <AppTheme>
      <Grid container justifyContent="center" style={{ marginTop: 20 }}>
        <Grid paddingBottom={'20px'} width={'100%'}><Header/></Grid>
        <Grid paddingBottom={'20px'} width={'100%'}>
          <Card style={{ padding: 20, width: "100%" }} paddingBottom={'20px'}>
            <Typography variant="h5" align="center" gutterBottom>
              Details Page
            </Typography>
            <Grid container spacing={40}>
              {/* First Column */}
              <Grid item xs={4}>
                <Typography variant="body1"><strong>Name:</strong> {rowData.pageTitle}</Typography>
                <Typography variant="body1"><strong>ID:</strong> {id}</Typography>
                <Typography variant="body1"><strong>Status:</strong> {rowData.status}</Typography>
              </Grid>
              {/* Second Column */}
              <Grid item xs={4}>
                <Typography variant="body1"><strong>Event Count:</strong> {rowData.eventCount}</Typography>
                <Typography variant="body1"><strong>Users:</strong> {rowData.users}</Typography>
              </Grid>
              {/* Third Column */}
              <Grid item xs={4}>
                <Typography variant="body1"><strong>Views per User:</strong> {rowData.viewsPerUser}</Typography>
                <Typography variant="body1"><strong>Average Time:</strong> {rowData.averageTime}</Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>
        <Grid paddingBottom={'20px'} width={'100%'}>
          <PageViewsBarChart />
        </Grid>
        <Grid paddingBottom={'20px'} width={'100%'}>
          <ChartUserByCountry />
        </Grid>
      </Grid>
    </AppTheme>
  );
};

export default DetailsPage;
