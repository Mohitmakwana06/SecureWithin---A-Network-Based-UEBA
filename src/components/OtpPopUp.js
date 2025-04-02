import React, { useState ,useEffect,useRef } from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


function OtpPopUp({ open, handleClose, name, email, password,onVerified }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // For success/error messages
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null); // Store interval ID

  useEffect(() => {
    if (open) {
      setResendTimer(60);
      setCanResend(false);
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev === 1) {
            clearInterval(timerRef.current);
            setCanResend(true);
          }
          return prev - 1;
        });
      }, 1000);
      timerRef.current = timer;
      return () => clearInterval(timerRef.current);
    }
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const requestBody = JSON.stringify({name, email, otp, password});
    console.log("Sending Request:",requestBody);

    try {
      
      const response = await fetch('http://localhost:8000/verify-signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      const data = await response.json();

      console.log("Server response:",data);

      if (response.ok) {
        setMessage({ type: 'success', text: 'OTP verified successfully!' });
        setOtp(''); // Clear the input field
        setTimeout(() => {
          handleClose();   // Close the popup
          onVerified();    // Navigate to sign-in
        }, 1000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Invalid OTP. Please try again.' });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setCanResend(false);
    setResendTimer(60);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:8000/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'New OTP sent successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to resend OTP. Try again later.' });
      }
    } catch (error) {
      console.error('Rsend OTP Error:',error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again later.' });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
        sx: { backgroundImage: 'none' },
      }}
    >
      <DialogTitle>Enter OTP</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
      >
        <DialogContentText>
          Enter the 6-digit OTP sent to your registered email to proceed.
        </DialogContentText>

        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <OutlinedInput
          autoFocus
          required
          margin="dense"
          id="otp"
          name="otp"
          label="OTP"
          placeholder="Enter 6-digit OTP"
          type="text"
          fullWidth
          value={otp}
          onChange={(e) => {
            if (/^\d{0,6}$/.test(e.target.value)) {
              setOtp(e.target.value);
            }
          }}
          disabled={loading}
          inputProps={{ maxLength: 6 }}
        />
      </DialogContent>
      <DialogActions sx={{ pb: 3, px: 3, display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
        <Button
            onClick={handleResendOtp}
            disabled={!canResend}
            variant="text"
            color="primary"
          >
            {canResend ? 'Resend OTP' : `Resend OTP in ${resendTimer}s`}
          </Button>
        </DialogActions>  
      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" type="submit" disabled={loading}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

OtpPopUp.propTypes = {
  handleClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  name:PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  password:PropTypes.string.isRequired,
  onVerified:PropTypes.func.isRequired,
};

export default OtpPopUp;
