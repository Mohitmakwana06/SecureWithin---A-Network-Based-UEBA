import * as React from 'react';
import Box from '@mui/material/Box';
import { useState } from 'react';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import AppTheme from '../shared-theme/AppTheme';
import { GoogleIcon, FacebookIcon, SitemarkIcon } from '../CustomIcons';
import ColorModeSelect from '../shared-theme/ColorModeSelect';
import SignInSide from './SignInSide';
import ForgotPassword from './ForgotPassword';
import OtpPopUp from './OtpPopUp';
import Logo from '../Logo.png';


const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  maxHeight: '800px', // Set a max height for scrolling
  overflowY: 'auto', // Enable vertical scrolling
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '450px',
  },
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh', // Full viewport height
  width: '100vw', // Full viewport width
  position: 'relative',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function OrgSignUp(props) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});

  const validateInputs = () => {
    let newErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required.';
      isValid = false;
    }

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
      isValid = false;
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Both passwords must match.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const handleSubmit = (event) => {
    event.preventDefault();
    if (validateInputs()) {
      console.log('Form submitted:', formData);
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
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
      <SignUpContainer direction="column" justifyContent="space-between">
        <Card variant="outlined">
        <Typography sx={{ color: '#4876EE', 
          fontWeight: 'bold',
          fontSize: '24px',  
        }}>
            <img src={Logo}
            alt="Logo"
            style={{
            width: '32px', // Adjust the size
            height: '32px', // Adjust the size
            marginRight: '8px', // Adds spacing between the logo and text
            filter: 'invert(39%) sepia(53%) saturate(1732%) hue-rotate(194deg) brightness(94%) contrast(93%)',
          }}/>
            SecureWithin</Typography>
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            Sign up
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <FormControl>
              <FormLabel htmlFor="name">Full name</FormLabel>
              <TextField
                //autoComplete="name"
                name="name"
                value={formData.name} onChange={handleChange} error={!!errors.name} helperText={errors.name} 
                required
                fullWidth
                id="name"
                placeholder="Jon Snow"
                color={!!errors.name ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                required
                fullWidth
                id="email"
                value={formData.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} 
                placeholder="your@email.com"
                name="email"
                //autoComplete="email"
                variant="outlined"
                color={!!errors.email ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                required
                fullWidth
                name="password"
                value={formData.password} 
                onChange={handleChange} 
                error={!!errors.password} 
                helperText={errors.password} 
                placeholder="••••••"
                type="password"
                id="password"
                //autoComplete="new-password"
                variant="outlined"
                color={!!errors.password ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="Confirmpassword">Confirm Password</FormLabel>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                placeholder="••••••"
                type="password"
                id="confirmPassword"
                //autoComplete="new-password"
                variant="outlined"
                color={!!errors.confirmPassword ? 'error' : 'primary'}
              />

            </FormControl>
            {/*<FormControlLabel
              control={<Checkbox value="allowExtraEmails" color="primary" />}
              label="I want to receive updates via email."
            />*/}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              onClick={() => {
                if (validateInputs()) {
                  handleClickOpen();
                }
              }}
            >
              Sign up
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ textAlign: 'center' }}>
              Already have an account?{' '}
              <Link
                href="/SignInSide"
                variant="body2"
                sx={{ alignSelf: 'center' }}
              >
                Sign in
              </Link>
            </Typography>
            
            <Typography sx={{ textAlign: 'center' }}>
              
              <Link
                href="/"
                variant="body2"
                sx={{ alignSelf: 'center' }}
              >
                Back
              </Link>
            </Typography>
          </Box>
        </Card>
      </SignUpContainer>
      <OtpPopUp open={open} handleClose={handleClose} />
    </AppTheme>
  );
}
