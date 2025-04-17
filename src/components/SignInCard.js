import * as React from 'react';
import Box from '@mui/material/Box';
import { useState } from 'react';
import Button from '@mui/material/Button';
import MuiCard from '@mui/material/Card';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import ForgotPassword from './ForgotPassword';
import {Link, useNavigate} from 'react-router-dom';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '450px',
  },
}));

export default function SignInCard() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    orgCode: '',
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateInputs = () => {
    let newErrors = {};
    let isValid = true;

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
      isValid = false;
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
      isValid = false;
    }

    if (!formData.orgCode.trim() || !/^[A-Za-z]{3}\d{5}$/.test(formData.orgCode)) {
      newErrors.orgCode = 'Organization Code must have 3 letters followed by 5 digits.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (validateInputs()) {
      try {
        const response = await fetch('http://localhost:8000/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            organization_code: formData.orgCode,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Something went wrong');
        }

        const data = await response.json();
        console.log('Login successful:', data);

        // Save token, name, and email to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userEmail', data.email);

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        setErrors({ apiError: error.message || 'Something went wrong' });
      }
    }
  };

  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Card variant="outlined">
      <Typography
        component="h1"
        variant="h4"
        sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
      >
        Sign in
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit} // Use onSubmit here
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}
      >
        <FormControl>
          <FormLabel htmlFor="email">Email</FormLabel>
          <TextField
            error={!!errors.email}
            helperText={errors.email}
            id="email"
            type="text"
            name="email"
            value={formData.email}
            onChange={handleChange} // Use handleChange to update state
            placeholder="Enter your email"
            required
            fullWidth
            variant="outlined"
            color={!!errors.email ? 'error' : 'primary'}
          />
        </FormControl>

        <FormControl>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <FormLabel htmlFor="password">Password</FormLabel>
          </Box>
          <TextField
            error={!!errors.password}
            helperText={errors.password}
            name="password"
            value={formData.password}
            onChange={handleChange} // Use handleChange to update state
            placeholder="••••••"
            type="password"
            id="password"
            required
            fullWidth
            variant="outlined"
            color={!!errors.password ? 'error' : 'primary'}
          />
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="orgCode">Organization Code</FormLabel>
          <TextField
            name="orgCode"
            value={formData.orgCode}
            onChange={handleChange} // Use handleChange to update state
            error={!!errors.orgCode}
            helperText={errors.orgCode}
            required
            fullWidth
            placeholder="ORG12345"
          />
        </FormControl>

        <ForgotPassword open={open} handleClose={handleClose} />

        <Button type="submit" fullWidth variant="contained">
          Sign in
        </Button>

        <Typography sx={{ textAlign: 'center' }}>
          Don&apos;t have an account?{' '}
          <span>
            <Link to="/OrgSignUp" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="white">
                Sign up
              </Typography>
            </Link>
          </span>
        </Typography>

      </Box>
    </Card>
  );
}
