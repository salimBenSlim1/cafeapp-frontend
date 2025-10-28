import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react'; // or your icon libraryRéessayerClaude n'a pas encore la capacité d'exécuter le code qu'il génère.
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
  ImageList,
  ImageListItem,
  ImageListItemBar,
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
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import SmokingRoomsIcon from '@mui/icons-material/SmokingRooms';
import CasinoIcon from '@mui/icons-material/Casino';
import SuccessMessage from './SuccessAlert';
import './AdminItems.css';
import api from '../../api/axiosInstance';

// Dummy images data - Replace with your actual images
const categoryImages = {
  coffee: [
    '/images/cafecreme.jpg',
    '/images/cappucin.jpg',
    '/images/express.jpg',
    '/images/american.jpg',
    '/images/cafe-turc.jpg',
    '/images/cappucino+.png',
    '/images/latte-noisette.png',
    '/images/latte-vanille.jpg',
    '/images/latte.jpg',
    '/images/latte-caramel.png',
    '/images/latte-glacé-noisette.png',
    '/images/latte-glacé-vanille.png',
    
  ],
  food: [
    '/images/pathé.jpg',
    '/images/painauchocolat.jpg',
    '/images/gauffre.png',
    '/images/sandwish-viande-haché.png',
    '/images/sandwish-salami.png',
    '/images/sandwish-jambon.png',
    '/images/pizza-mexicaine.jpg',
    '/images/pizza-margherita.png',
    '/images/patte-puttanesca.jpg',
    '/images/pates-poulet-alacreme.jpg',
    '/images/pates-bolognaise.jpg',
    '/images/sandwish-thon.jpg',
    '/images/sandwish-escalope-grillé.jpg',
    '/images/salade-poulet-grillé.jpg',
    '/images/salade-poulet-panné.jpg',
    '/images/poisson-dorade.jpg',
    '/images/pizza-vegetarienne.jpg',
    '/images/pizza-poule-champignon.jpg',
    '/images/pizza-neptune.jpeg',
    '/images/pancake-thon-fromage.jpg',
    '/images/pancake-nutella-oreo.jpg',
    '/images/pancake-nutella-fraise.jpg',
    '/images/pancake-nutella-banane.jpg',
    '/images/pancake-mexicaine.jpg',
    '/images/pancake-japonaise.png',
    '/images/pancake-fromage-salami.jpg',
    '/images/pancake-chocolat.jpg',
    '/images/pancake-chocolat-oreo.jpg',
    '/images/pancake-chocolat-fraise.png',
    '/images/pacake-jambon-fromage.jpg',
    '/images/omlette-thon-fromage.jpg',
    '/images/omlette-salami-fromage.jpg',
    '/images/omlette-jambon-fromage.jpg',
    '/images/omlette-jambon-fromage.jpg',
    '/images/mixte-panné.jpg',
    '/images/escalope-panné.jpg',
    '/images/escalope-grillé.jpeg',
    '/images/frites.png',
    '/images/crepe-thon-fromage.jpg',
    '/images/crepe-salami-fromage.jpg',
    '/images/crepe-jambon-fromage.jpg',
    
    
  ],
  drink: [
    '/images/orangejuice.jpg',
    '/images/eau0.5L.png',
    '/images/eau1L.png',
    '/images/boissons-energetique.jpg',
    '/images/thé-vert.jpg',
    '/images/the-infusion.jpg',
    '/images/thé-menthe.png',
    '/images/thé-fruits-sec.jpg',
    '/images/thé-amande.jpeg',
    '/images/sommthie-fruit-rouge.jpg',
    '/images/smoothie-fraise-banane.jpg',
    '/images/mojito-fruitsRouge.png',
    '/images/mojito-energetic.jpg',
    '/images/mojito-blue.jpg',
    '/images/milkshake-nutella.png',
    '/images/milkshake-noisette.png',
    '/images/milkshake-chocolat.jpg',
    '/images/milkshake-caramel.jpg',
    '/images/milkshake-712.jpg',
    '/images/lait-de-poule.jpg',
    '/images/Kiwi-Banana-Smoothie.jpg',
    '/images/frappucino-snickers.jpg',
    '/images/frappucino-nutella.jpg',
    '/images/frappucino-noisette.jpg',
    '/images/frappucino-chocolat.jpg',
    '/images/frappucino-caramel.jpg',
    '/images/frappucino-712.jpg',
    '/images/frappucino-oreo.png',
    
    
  ],
  dessert: [
    '/images/jwejem-classique.jpg',
    '/images/jawjem-712.jpg',
    '/images/jus-kiwi-banane.jpg',
    '/images/jus-fraise-banane.jpg',
    '/images/jus-datte-banane-fruit-sec.jpg',
    '/images/jus-cocktail-fruitDeSaison.jpg',
    '/images/jus-citron-glacé.jpg',
    '/images/jus-fraise.png',
    '/images/glace-712-5boule.jpeg',
    '/images/glace-3boole.jpg',
    '/images/galce-2boole.png',
    '/images/fruits-de-saison.png',
    '/images/gaufres-aux-fruits-sec.jpeg',
    '/images/Gaufre-Oreo.jpg',
    '/images/gauffre-nutella.jpg',
    '/images/gauffre-nutella-spéculoos.jpg',
    '/images/gauffre-nutella-oreo.jpg',
    '/images/gauffre-nutella-fruit-sec.jpg',
    '/images/gauffre-nutella-fraise.jpg',
    '/images/gauffre-chocolat.jpg',
    '/images/gauffre-chocolat-fraise.jpg',
    '/images/gauffre-chocolat-spéculoos.jpeg',
    '/images/gauffre-chocolat-banane.jpeg',
    '/images/gauffre-nutella-banane.png',
    '/images/crepe-nutella.jpg',
    '/images/crepe-nutella-oreo.jpg',
    '/images/crepe-nutella-banane.jpg',
    '/images/crepe-mexicaine.png',
    '/images/crepe-japoniase.png',
    '/images/crepe-chocolat-oreo.jpg',
    '/images/crepe-chocolat-fraise.jpg',
  ],
  games: [
    '/images/belote.jpg',
    
  ],
  smoking: [
    '/images/chicha.jpg',
    '/images/chicha-menthe.png',
    
  ],
};

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
  const [selectedImage, setSelectedImage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    imageUrl: '',
    stock: "",
  });

  useEffect(() => {
    api
      .get('/getItems',{headers:{'x-api-key':localStorage.getItem('token')}})
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
      setSelectedImage(product.imageUrl || '');
    } else {
      setCurrentProduct(null);
      setFormData({
        name: '',
        price: '',
        category: '',
        imageUrl: '',
        stock: "",
      });
      setSelectedImage('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentProduct(null);
    setSelectedImage('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Reset selected image when category changes
    if (name === 'category') {
      setSelectedImage('');
      setFormData({ ...formData, [name]: value, imageUrl: '' });
    }
  };

  

  const handleImageSelect = (imageUrl) => {
    setSelectedImage(imageUrl);
    setFormData({ ...formData, imageUrl: imageUrl });
  };

  const handleSubmit = () => {
    if (currentProduct) {
      api
        .put(`/updateItem/${currentProduct.id}`, formData,{
          headers:{'x-api-key':localStorage.getItem('token')}
        })
        .then((r) => {
          setShowSuccess(true);
          setRefresh(!refresh);
          handleCloseDialog();
        })
        .catch((err) => console.log(err));
    } else {
      api
        .post('/addItem', formData,{
          headers:{'x-api-key':localStorage.getItem('token')}
        })
        .then((r) => {
          setShowSuccess(true);
          setRefresh(!refresh);
          handleCloseDialog();
        })
        .catch((err) => console.log(err));
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    api
      .delete(`/deleteItem/${productToDelete.id}`,{
          headers:{'x-api-key':localStorage.getItem('token')}
        })
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

  // Get available images for selected category
  const availableImages = formData.category ? categoryImages[formData.category] || [] : [];

  return (
    <Box className="products-container">
  <Paper 
  className="products-header" 
  style={{
    background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
    paddingTop: "60px", // Add space for the button
    position: "relative"
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
      Retour
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
                  {!product.stock && (
                    <Chip label="Out of Stock" className="stock-chip" />
                  )}
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
                {categories.filter(cat => cat !== 'all').map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Image Picker Section */}
            {formData.category && (
              <Box className="image-picker-section">
                <Typography variant="subtitle1" className="image-picker-title">
                  Select Product Image
                </Typography>
                <ImageList cols={3} gap={12} className="image-picker-grid">
                  {availableImages.map((imageUrl, index) => (
                    <ImageListItem 
                      key={index} 
                      
                      className={`image-picker-item ${selectedImage === imageUrl ? 'selected' : ''}`}
                      onClick={() => handleImageSelect(imageUrl)}
                    >
                      <img
                        src={imageUrl}
                        alt={`${formData.category} ${index + 1}`}
                        loading="lazy"
                        style={{ cursor: 'pointer', borderRadius: '8px' }}
                      />
                      {selectedImage === imageUrl && (
                        <ImageListItemBar
                          className="image-selected-overlay"
                          actionIcon={
                            <CheckCircleIcon className="check-icon" />
                          }
                        />
                      )}
                    </ImageListItem>
                  ))}
                </ImageList>
              </Box>
            )}

             <TextField
              label="stock"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleInputChange}
              fullWidth
              required
              className="form-field"
              inputProps={{ step: '0.01', min: '0' }}
            />
          </Box>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={handleCloseDialog} className="cancel-btn">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            className="submit-btn"
            disabled={!formData.name || !formData.price || !formData.category || !formData.imageUrl}
          >
            {currentProduct ? 'Update' : 'Add'} Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCancelDelete}>
        <DialogTitle className="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent className="delete-dialog-content">
          <Typography>
            Are you sure you want to delete{' '}
            <strong>{productToDelete?.name}</strong>?
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: '#64748b' }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions className="delete-dialog-actions">
          <Button onClick={handleCancelDelete} className="cancel-delete-btn">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            className="confirm-delete-btn"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminItems;