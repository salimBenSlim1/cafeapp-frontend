import { useEffect, useState } from 'react';
import cafeApi from '../../api/cafeApiInstance';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Typography,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

const PRINTER_TYPES = ['bar', 'chicha', 'cuisine', 'dessert', 'caisse'];

export default function PrinterManager() {
  const [printers, setPrinters] = useState([]);
  const [form, setForm] = useState({ ipAddress: '', type: 'bar'  });
  const [editingId, setEditingId] = useState(null);

  const fetchPrinters = async () => {
    try {
      const res = await cafeApi.get(`/printers`);
      setPrinters(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPrinters();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await cafeApi.put(`/updatePrinter/${editingId}`, form);
      } else {
        await cafeApi.post('/addPrinter', form);
      }
      setForm({ ipAddress: '', type: 'bar',  });
      setEditingId(null);
      fetchPrinters();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (printer) => {
    setForm({
      ipAddress: printer.ipAddress,
      type: printer.type,
      
    });
    setEditingId(printer.id);
  };

  const handleDelete = async (id) => {
    try {
      await cafeApi.delete(`/deletePrinter/${id}`);
      fetchPrinters();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" mb={2}>Manage Printers</Typography>

      {/* Form */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="IP Address"
          name="ipAddress"
          value={form.ipAddress}
          onChange={handleChange}
        />
        <TextField
          select
          label="Type"
          name="type"
          value={form.type}
          onChange={handleChange}
        >
          {PRINTER_TYPES.map((t) => (
            <MenuItem key={t} value={t}>{t}</MenuItem>
          ))}
        </TextField>
        <Button variant="contained" onClick={handleSubmit}>
          {editingId ? 'Update' : 'Add'}
        </Button>
      </Box>

      {/* Printers List */}
      <Paper>
        <List>
          {printers.map((p) => (
            <ListItem
              key={p.id}
              secondaryAction={
                <Box>
                  <IconButton onClick={() => handleEdit(p)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(p.id)}>
                    <Delete />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={`${p.type} - ${p.ipAddress}`}
              
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
