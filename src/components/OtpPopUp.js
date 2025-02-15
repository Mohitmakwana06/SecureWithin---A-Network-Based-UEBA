import React, { useState ,useEffect } from 'react';
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

function OtpPopUp({ open, handleClose }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // For success/error messages
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (open) {
      setResendTimer(60);
      setCanResend(false);
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev === 1) {
            clearInterval(timer);
            setCanResend(true);
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'OTP verified successfully!' });
        setOtp(''); // Clear the input field
        handleClose();
      } else {
        const data = await response.json();
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
      const response = await fetch('/api/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'New OTP sent successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to resend OTP. Try again later.' });
      }
    } catch (error) {
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
          onChange={(e) => setOtp(e.target.value)}
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
};

export default OtpPopUp;
