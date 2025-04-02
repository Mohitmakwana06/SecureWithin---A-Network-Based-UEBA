import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, OutlinedInput, MenuItem, Select, FormControl, InputLabel, Box } from '@mui/material';
import AppTheme from '../shared-theme/AppTheme';

function AddClient({ open, handleClose }) {
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // API base URL (adjust to your actual backend URL)
  const apiUrl = 'http://localhost:8000/client-input/';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const requestBody = JSON.stringify({
      id: clientId,
      client_name: clientName,
      client_role: role,
    });

    console.log("Sending Request:", requestBody);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      const data = await response.json();

      console.log("Server response:", data);

      if (response.ok) {
        setMessage({ type: 'success', text: 'Client added successfully!' });
        setClientId('');
        setClientName('');
        setRole('');
        setTimeout(() => {
          handleClose(); // Close the popup
        }, 1000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to add client. Please try again.' });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppTheme>
      <Dialog 
        open={open}
        onClose={handleClose}
        PaperProps={{
          component: 'form',
          sx: { backgroundImage: 'none' },
        }}
      >
        <DialogTitle>Add Client</DialogTitle>
        <DialogContent>
          {/* Client ID */}
          <Box sx={{ mb: 2 }}>
            <OutlinedInput
              autoFocus
              required
              margin="dense"
              id="clientId"
              name="clientId"
              placeholder="Client ID"
              type="text"
              fullWidth
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={loading}
            />
          </Box>

          {/* Client Name */}
          <Box sx={{ mb: 2 }}>
            <OutlinedInput
              required
              margin="dense"
              id="clientName"
              name="clientName"
              placeholder="Client Name"
              type="text"
              fullWidth
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              disabled={loading}
            />
          </Box>

          {/* Role Dropdown */}
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth margin="dense">
              <InputLabel>Role</InputLabel>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Manager">Manager</MenuItem>
                <MenuItem value="Employee">Employee</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Message */}
          {message && (
            <Box sx={{ color: message.type === 'error' ? 'red' : 'green', mb: 2 }}>
              {message.text}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="secondary" disabled={loading}>Cancel</Button>
          {/* Call handleSubmit on Add button click */}
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading}>Add</Button>
        </DialogActions>
      </Dialog>
    </AppTheme>
  );
}

export default AddClient;
