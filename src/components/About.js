import React from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  CardHeader,
  Box,
  Divider,
} from '@mui/material';
import AppTheme from '../shared-theme/AppTheme';
import Preet from '../Preet.jpg'; // Adjust the path to your image
import Mohit from '../Mohit.jpg'; // Adjust the path to your image
import Copyright from '../internals/components/Copyright';

const developers = [
  {
    name: 'Preet Dudhat',
    position: 'Frontend Developer',
    qualification: 'Diploma in IT',
    bio: 'Specializes in React, UI/UX design, and performance optimization.',
    photo: Preet,
  },
  {
    name: 'Mohit Makwana',
    position: 'Backend Developer',
    qualification: 'Diploma in IT',
    bio: 'Expert in Node.js, FastAPI, and database management.',
    photo: Mohit,
  },
  {
    name: 'Ram Gori',
    position: 'Backend Developer',
    qualification: 'Diploma in IT',
    bio: 'Passionate about ethical hacking, VAPT, and log analysis using ELK stack.',
    photo: '', // Add a placeholder or actual photo
  },
];

const About = () => {
  return (
    <AppTheme>
      <Container sx={{ py: 6 }}>
        {/* About Project Section */}
        <Typography variant="h4" align="center" gutterBottom>
          About Our Project
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" maxWidth="md" mx="auto" paragraph fontSize={'20px'}>
          Our project is a <strong>Web-based UEBA (User and Entity Behavior Analytics) System</strong> built to enhance cybersecurity
          within organizations by monitoring user activities and detecting anomalies in real-time. It focuses on traditional rule-based
          threat detection using logs collected from client machines. The system is designed to be secure, scalable, and user-friendly with
          role-based access and powerful real-time analytics.
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" maxWidth="md" mx="auto" paragraph fontSize={'20px'}>
          The platform helps admins detect unauthorized behaviors, such as visiting restricted websites or performing suspicious
          activities, all visualized through real-time dashboards.
        </Typography>

        <Divider sx={{ my: 4 }} />

        {/* Developer Profiles */}
        <Typography variant="h4" align="center" gutterBottom>
          Meet Our Developers
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {developers.map((dev, index) => (
            <Grid item key={index} xs={12} sm={6} md={4}>
              <Card elevation={4} sx={{ borderRadius: 3 }}>
                <CardHeader
                  avatar={
                    <Avatar
                      src={dev.photo || 'https://via.placeholder.com/150'}
                      sx={{ width: 56, height: 56 }}
                    />
                  }
                  title={<Typography variant="h6">{dev.name}</Typography>}
                  subheader={dev.position}
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Qualification:</strong> {dev.qualification}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    <strong>About:</strong> {dev.bio}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
      <Copyright sx={{ my: 4 }} />
    </AppTheme>
  );
};

export default About;
