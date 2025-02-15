import React from "react";
import { Button, Grid, Typography } from "@mui/material";
import AppTheme from "../shared-theme/AppTheme";
import { Link } from "react-router-dom";
import ColorModeSelect from "../shared-theme/ColorModeSelect";
import logo from '../Logo.png'


const OrgSignIn = () => {
  return (
    <AppTheme> 
    <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
        <Grid container justifyContent="center" alignItems="center">  {/*style={{ height: "100vh" }}*/}
            <Grid item xs={12} textAlign="center">
            <Typography sx={{ color: '#4876EE', 
          fontWeight: 'bold',
          fontSize: '30px', 
          //paddingLeft: '40px'
          paddingBottom:'10px' 
        }}>
            <img src={logo}
            alt="Logo"
            style={{
            width: '32px', // Adjust the size
            height: '32px', // Adjust the size
            marginRight: '8px', // Adds spacing between the logo and text
            filter: 'invert(39%) sepia(53%) saturate(1732%) hue-rotate(194deg) brightness(94%) contrast(93%)',
            
          }}/>
            SecureWithin</Typography>
                <Typography variant="h4" gutterBottom>
                Signup for Organization
                </Typography>
                <Button variant="contained" color="secondary" style={{ margin: 10 }}>
                <Link
                    to="/OrgSignUp"
                    style={{ textDecoration: "none",color:"black"}}
                    sx={{ alignSelf: 'center' }}
                >
                Join Organization
                </Link>
                </Button>
                <Button variant="contained" color="secondary" style={{ margin: 10 }}>
                <Link
                    to="/SignUp"
                    style={{ textDecoration: "none",  color:"black"}}
                    sx={{ alignSelf: 'center' }}
                >
                Create Organization
                </Link>
                </Button>
                
            </Grid>
        </Grid>   
    </AppTheme>
  );
};

export default OrgSignIn;