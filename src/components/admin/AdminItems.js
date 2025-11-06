import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Box,
  Paper,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Fab,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  LocalCafe as CoffeeIcon,
  Fastfood as FoodIcon,
  LocalBar as DrinkIcon,
  Cake as DessertIcon,
} from '@mui/icons-material';
import SmokingRoomsIcon from '@mui/icons-material/SmokingRooms';
import CasinoIcon from '@mui/icons-material/Casino';
import SuccessMessage from './SuccessAlert';
import './AdminItems.css';
import cafeApi from '../../api/cafeApiInstance';
import axios from 'axios';

function AdminItems() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [refresh, setRefresh] = useState(false);
  
  // Upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const[categoryImages,setCategoryImages]=useState({})
 
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    imageUrl: '',
    stock: '',
  });
  useEffect(()=>{
    axios.get(process.env.REACT_APP_API_URL+'/api/getPhotosPro',{
      headers:{'Authorization':'Bearer '+localStorage.getItem('token')}
    }).then(r=>{
      console.log(r.data)
      setCategoryImages(r.data)})
    .catch(err=>console.log(err))
  },[])
  useEffect(() => {
    cafeApi
      .get('/getItems')
      .then((r) => {
        setProducts(r.data);
        setFilteredProducts(r.data);
      })
      .catch((err) => console.log(err));
  }, [refresh]);

  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  }, [searchTerm, categoryFilter, products]);

  const handleOpenDialog = (product = null) => {
    if (product) {
      setCurrentProduct(product);
      setFormData({
        name: product.name,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl || '',
        stock: product.stock,
      });
      setPreviewUrl(product.imageUrl || '');
    } else {
      setCurrentProduct(null);
      setFormData({
        name: '',
        price: '',
        category: '',
        imageUrl: '',
        stock: '',
      });
      setPreviewUrl('');
    }
    setSelectedFile(null);
    setUploadError('');
    setUploadProgress(0);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentProduct(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadError('');
    setUploadProgress(0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Gérer la sélection de fichier
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setUploadError('');
    
    // Créer preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Uploader l'image vers Cloudinary
  const uploadImageToCloudinary = async () => {
    if (!selectedFile) return formData.imageUrl;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');

    const uploadFormData = new FormData();
    uploadFormData.append('image', selectedFile);

    try {
      const response = await cafeApi.post(
        '/upload-image',
        uploadFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          },
        }
      );

      setIsUploading(false);
      return response.data.imageUrl;
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadError('Failed to upload image. Please try again.');
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      // Upload image first if there's a new file
      let imageUrl = formData.imageUrl;
      if (selectedFile) {
        imageUrl = await uploadImageToCloudinary();
      }

      const dataToSubmit = {
        ...formData,
        imageUrl,
      };

      if (currentProduct) {
        await cafeApi.put(`/updateItem/${currentProduct.id}`, dataToSubmit);
      } else {
        await cafeApi.post('/addItem', dataToSubmit);
      }

      setShowSuccess(true);
      setRefresh(!refresh);
      handleCloseDialog();
    } catch (err) {
      console.error('Error submitting:', err);
      setUploadError('Failed to save product. Please try again.');
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    cafeApi
      .delete(`/deleteItem/${productToDelete.id}`)
      .then((r) => {
        setShowSuccess(true);
        setRefresh(!refresh);
        setOpenDeleteDialog(false);
        setProductToDelete(null);
      })
      .catch((err) => console.log(err));
  };

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
    setProductToDelete(null);
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'coffee':
        return <CoffeeIcon />;
      case 'food':
        return <FoodIcon />;
      case 'drink':
        return <DrinkIcon />;
      case 'dessert':
        return <DessertIcon />;
      case 'games':
        return <CasinoIcon />;
      case 'smoking':
        return <SmokingRoomsIcon />;
      default:
        return <CoffeeIcon />;
    }
  };

  const categories = ['all', 'coffee', 'food', 'drink', 'dessert', 'games', 'smoking'];

  return (
    <Box className="products-container">
      <Paper
        className="products-header"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          paddingTop: '60px',
          position: 'relative',
        }}
        elevation={0}
      >
       <Button
    onClick={() => window.history.back()}
    startIcon={<ArrowLeft size={20} />}
    sx={{
      position: "absolute",
      top: 16,
      left: 16,
      backdropFilter: "blur(10px)",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      color: "white",
      borderRadius: "50px",
      px: 2,
      py: 1,
      textTransform: "none",
      transition: "transform 0.2s",
      zIndex: 10,
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        transform: "scale(1.05)",
      },
      "& .MuiButton-startIcon": {
        marginRight: { xs: 0, sm: 1 },
      },
    }}
  >
    <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
      Back
    </Box>
  </Button>

        <Typography variant="h4" className="products-title">
          Products Management
        </Typography>
        <Typography variant="subtitle1" className="products-subtitle">
          Manage your café menu items
        </Typography>
      </Paper>

      {showSuccess && <SuccessMessage setShowSuccess={setShowSuccess} />}

      <Paper className="filters-paper" elevation={0}>
        <Box className="filters-container">
          <TextField
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-field"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl className="category-select">
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Category"
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Grid container spacing={3} className="products-grid">
        {filteredProducts.length === 0 ? (
          <Grid item xs={12}>
            <Paper className="empty-state">
              <Typography variant="h6">No products found</Typography>
              <Typography variant="body2">
                Try adjusting your filters or add a new product
              </Typography>
            </Paper>
          </Grid>
        ) : (
          filteredProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card className={`product-card ${!product.stock ? 'out-of-stock' : ''}`}>
                <Box className="product-image-container">
                  <CardMedia
                    component="img"
                    height="220"
                    image={product.imageUrl || 'https://via.placeholder.com/300x220?text=No+Image'}
                    alt={product.name}
                    className="product-image"
                  />
                  {!product.stock && <Chip label="Out of Stock" className="stock-chip" />}
                  <Box className="product-actions">
                    <IconButton
                      className="action-btn edit-btn"
                      onClick={() => handleOpenDialog(product)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteClick(product)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <CardContent className="product-content">
                  <Box className="product-header">
                    <Typography variant="h6" className="product-name">
                      {product.name}
                    </Typography>
                    <Chip
                      icon={getCategoryIcon(product.category)}
                      label={product.category}
                      size="small"
                      className="category-chip"
                    />
                  </Box>
                  <Typography variant="h6" className="product-price">
                    {product.price.toFixed(2)} TnD
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Fab className="add-fab" color="primary" onClick={() => handleOpenDialog()}>
        <AddIcon />
      </Fab>

      {/* Add/Edit Product Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title">
          {currentProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent className="dialog-content">
          <Box className="form-container">
            <TextField
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
              required
              className="form-field"
            />
            <TextField
              label="Price (TnD)"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleInputChange}
              fullWidth
              required
              className="form-field"
              inputProps={{ step: '0.01', min: '0' }}
            />
            <FormControl fullWidth className="form-field">
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                label="Category"
                required
              >
                {categories
                  .filter((cat) => cat !== 'all')
                  .map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {/* Image Upload Section */}
           {/* Image Upload Section */}
<Box className="image-upload-section" sx={{ mt: 3 }}>
  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
    Product Image
  </Typography>

  {/* Preview */}
  {previewUrl && (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: 250,
        mb: 2,
        borderRadius: 2,
        overflow: 'hidden',
        border: '2px solid #e2e8f0',
      }}
    >
      <img
        src={previewUrl}
        alt="Preview"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      <IconButton
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          bgcolor: 'rgba(0,0,0,0.6)',
          color: 'white',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
        }}
        onClick={() => {
          setSelectedFile(null);
          setPreviewUrl('');
          setFormData({ ...formData, imageUrl: '' });
        }}
      >
        <X size={20} />
      </IconButton>
    </Box>
  )}

  {/* Choose from existing images OR upload new */}
  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
    <Button
      variant="outlined"
      component="label"
      fullWidth
      startIcon={<Upload />}
      sx={{
        py: 2,
        borderStyle: 'dashed',
        borderWidth: 2,
        '&:hover': {
          borderStyle: 'dashed',
          borderWidth: 2,
        },
      }}
      disabled={isUploading}
    >
      {selectedFile ? 'Change Image' : 'Upload New'}
      <input
        type="file"
        hidden
        accept="image/*"
        onChange={handleFileSelect}
      />
    </Button>
  </Box>

  {/* Image Gallery from categoryImages */}
  {formData.category && categoryImages[formData.category] && (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, color: '#64748b' }}>
        Or choose from existing images:
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 2,
          maxHeight: 300,
          overflowY: 'auto',
          p: 1,
          border: '1px solid #e2e8f0',
          borderRadius: 2,
        }}
      >
        {categoryImages[formData.category].map((imageUrl, index) => (
          <Box
            key={index}
            sx={{
              position: 'relative',
              paddingBottom: '100%',
              cursor: 'pointer',
              borderRadius: 1,
              overflow: 'hidden',
              border: previewUrl === imageUrl ? '3px solid #3b82f6' : '2px solid #e2e8f0',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
            }}
            onClick={() => {
              setPreviewUrl(imageUrl);
              setFormData({ ...formData, imageUrl });
              setSelectedFile(null);
              setUploadError('');
            }}
          >
            <img
              src={imageUrl}
              alt={`Option ${index + 1}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {previewUrl === imageUrl && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  bgcolor: '#3b82f6',
                  borderRadius: '50%',
                  p: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle size={16} color="white" />
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  )}

  {/* Upload Progress */}
  {isUploading && (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Loader2 className="animate-spin" size={20} />
        <Typography variant="body2">Uploading... {uploadProgress}%</Typography>
      </Box>
      <LinearProgress variant="determinate" value={uploadProgress} />
    </Box>
  )}

  {/* Upload Success */}
  {!isUploading && selectedFile && previewUrl && (
    <Box
      sx={{
        mt: 2,
        p: 2,
        bgcolor: '#ecfdf5',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <CheckCircle size={20} color="#10b981" />
      <Typography variant="body2" sx={{ color: '#059669' }}>
        Image ready to upload
      </Typography>
    </Box>
  )}

  {/* Upload Error */}
  {uploadError && (
    <Box
      sx={{
        mt: 2,
        p: 2,
        bgcolor: '#fef2f2',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <AlertCircle size={20} color="#ef4444" />
      <Typography variant="body2" sx={{ color: '#dc2626' }}>
        {uploadError}
      </Typography>
    </Box>
  )}

  <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#64748b' }}>
    Upload new image (JPG, PNG, WEBP - Max 5MB) or choose from existing images
  </Typography>
</Box>

            <TextField
              label="Stock"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleInputChange}
              fullWidth
              required
              className="form-field"
              inputProps={{ step: '1', min: '0' }}
            />
          </Box>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={handleCloseDialog} className="cancel-btn" disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            className="submit-btn"
            disabled={
              !formData.name ||
              !formData.price ||
              !formData.category ||
              (!formData.imageUrl && !selectedFile) ||
              isUploading
            }
            startIcon={isUploading ? <CircularProgress size={20} /> : null}
          >
            {isUploading
              ? 'Uploading...'
              : currentProduct
              ? 'Update Product'
              : 'Add Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCancelDelete}>
        <DialogTitle className="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent className="delete-dialog-content">
          <Typography>
            Are you sure you want to delete <strong>{productToDelete?.name}</strong>?
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: '#64748b' }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions className="delete-dialog-actions">
          <Button onClick={handleCancelDelete} className="cancel-delete-btn">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" className="confirm-delete-btn">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Box>
  );
}

export default AdminItems;