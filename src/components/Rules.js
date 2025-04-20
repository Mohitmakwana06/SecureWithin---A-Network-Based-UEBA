import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Dialog,
  DialogActions, DialogContent, DialogTitle, TextField,
  FormControl, FormLabel, Box, Typography
} from '@mui/material';
import AppTheme from '../shared-theme/AppTheme'; // Adjust path if needed
import Header from './Header'; // Adjust path if needed
import Copyright from '../internals/components/Copyright'; // Adjust path if needed

export default function Rule() {
  const [rules, setRules] = useState([]);
  const [open, setOpen] = useState(false);
  const [newRule, setNewRule] = useState('');
  const [error, setError] = useState(false);

  // Fetch rules from backend
  const fetchRules = async () => {
    try {
      const response = await axios.get('http://localhost:8000/get-websites');
      setRules(response.data.websites);
    } catch (err) {
      console.error('Error fetching rules:', err);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleAddClick = () => {
    setOpen(true);
    setError(false);
  };

  const handleClose = () => {
    setOpen(false);
    setNewRule('');
    setError(false);
  };

  const handleSave = async () => {
    if (newRule.trim() === '') {
      setError(true);
      return;
    }

    try {
      await axios.post('http://localhost:8000/add-website', {
        url: newRule.trim(),
      });
      fetchRules(); // Refresh list
      handleClose();
    } catch (err) {
      console.error('Error adding rule:', err);
    }
  };

  const handleDelete = async (ruleToDelete) => {
    try {
      await axios.delete('http://localhost:8000/delete-website', {
        data: { url: ruleToDelete },
      });
      fetchRules(); // Refresh list
    } catch (err) {
      console.error('Error deleting rule:', err);
    }
  };

  return (
    <AppTheme>
      <Box sx={{ padding: 4 }}>
        <div style={{ paddingBottom: '20px' }}>
          <Header />
        </div>

        <Typography variant="h4" gutterBottom>
          Rule List
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rule</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule, index) => (
                <TableRow key={index}>
                  <TableCell>{rule}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => handleDelete(rule)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} align="center">
                    No rules added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Button
          variant="contained"
          color="primary"
          onClick={handleAddClick}
          sx={{ mt: 2 }}
        >
          Add Rule
        </Button>

        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Add New Rule</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Box
              component="form"
              noValidate
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
            >
              <FormControl>
                <FormLabel htmlFor="rule">Rule</FormLabel>
                <TextField
                  autoFocus
                  id="rule"
                  name="rule"
                  placeholder="Enter rule"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  fullWidth
                  required
                  variant="outlined"
                  error={error}
                  helperText={error ? 'Rule cannot be empty' : ''}
                />
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">
              Add
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      <Copyright sx={{ my: 4 }} />
    </AppTheme>
  );
}