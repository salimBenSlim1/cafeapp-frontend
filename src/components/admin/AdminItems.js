import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, Loader2, CheckCircle, AlertCircle, Search, Plus, Coffee, Utensils, Wine, Cake, Dices, Cigarette, Package } from 'lucide-react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  LinearProgress, CircularProgress,
} from '@mui/material';
import SuccessMessage from './SuccessAlert';
import cafeApi from '../../api/cafeApiInstance';
import axios from 'axios';

/* ── Category config ── */
const CAT_CONFIG = {
  coffee:  { icon: Coffee,   color: '#c87941', bg: 'rgba(200,121,65,.14)',  border: 'rgba(200,121,65,.3)'  },
  food:    { icon: Utensils, color: '#f59e0b', bg: 'rgba(245,158,11,.14)',  border: 'rgba(245,158,11,.3)'  },
  drink:   { icon: Wine,     color: '#1bcbe0', bg: 'rgba(27,203,224,.14)',  border: 'rgba(27,203,224,.3)'  },
  dessert: { icon: Cake,     color: '#f472b6', bg: 'rgba(244,114,182,.14)', border: 'rgba(244,114,182,.3)' },
  games:   { icon: Dices,    color: '#a78bfa', bg: 'rgba(167,139,250,.14)', border: 'rgba(167,139,250,.3)' },
  smoking: { icon: Cigarette,color: '#94a3b8', bg: 'rgba(148,163,184,.14)', border: 'rgba(148,163,184,.3)' },
};
const CATEGORIES = ['all', 'coffee', 'food', 'drink', 'dessert', 'games', 'smoking'];

function CatBadge({ category }) {
  const cfg = CAT_CONFIG[category] || { icon: Package, color: '#4a7099', bg: 'rgba(74,112,153,.12)', border: 'rgba(74,112,153,.25)' };
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, letterSpacing: '.05em' }}>
      <Icon size={11} /> {category}
    </span>
  );
}

function AdminItems() {
  const [products, setProducts]           = useState([]);
  const [filtered, setFiltered]           = useState([]);
  const [searchTerm, setSearchTerm]       = useState('');
  const [catFilter, setCatFilter]         = useState('all');
  const [openDialog, setOpenDialog]       = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentProduct, setCurrentProduct]     = useState(null);
  const [productToDelete, setProductToDelete]   = useState(null);
  const [showSuccess, setShowSuccess]     = useState(false);
  const [refresh, setRefresh]             = useState(false);
  const [categoryImages, setCategoryImages]     = useState({});

  const [selectedFile, setSelectedFile]   = useState(null);
  const [previewUrl, setPreviewUrl]       = useState('');
  const [uploadProgress, setUploadProgress]     = useState(0);
  const [isUploading, setIsUploading]     = useState(false);
  const [uploadError, setUploadError]     = useState('');

  const [formData, setFormData] = useState({ name: '', price: '', category: '', imageUrl: '', stock: '' });

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + '/api/getPhotosPro', {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    }).then(r => setCategoryImages(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
// In your useEffect that fetches products
cafeApi.get('/getItems').then(r => {
  const items = r.data.data.map(p => ({ ...p, price: parseFloat(p.price) }));
  setProducts(items);
  setFiltered(items);
}).catch(console.log);    
  }, []);

  useEffect(() => {
    let f = products;
    if (searchTerm) f = f.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (catFilter !== 'all') f = f.filter(p => p.category === catFilter);
    setFiltered(f);
  }, [searchTerm, catFilter, products]);

  const handleOpenDialog = (product = null) => {
    if (product) {
      setCurrentProduct(product);
      setFormData({ name: product.name, price: product.price, category: product.category, imageUrl: product.imageUrl || '', stock: product.stock });
      setPreviewUrl(product.imageUrl || '');
    } else {
      setCurrentProduct(null);
      setFormData({ name: '', price: '', category: '', imageUrl: '', stock: '' });
      setPreviewUrl('');
    }
    setSelectedFile(null); setUploadError(''); setUploadProgress(0);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false); setCurrentProduct(null); setSelectedFile(null);
    setPreviewUrl(''); setUploadError(''); setUploadProgress(0);
  };

  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileSelect = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadError('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError('Image size should be less than 5MB'); return; }
    setSelectedFile(file); setUploadError('');
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!selectedFile) return formData.imageUrl;
    setIsUploading(true); setUploadProgress(0); setUploadError('');
    const fd = new FormData();
    fd.append('image', selectedFile);
    try {
      const res = await cafeApi.post('/upload-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => setUploadProgress(Math.round((e.loaded * 100) / e.total)),
      });
      setIsUploading(false);
      return res.data.imageUrl;
    } catch (err) {
      setIsUploading(false); setUploadError('Failed to upload image. Please try again.'); throw err;
    }
  };

const handleSubmit = async () => {
  try {
    const imageUrl = selectedFile ? await uploadImage() : formData.imageUrl;
    const data = { ...formData, imageUrl };

    if (currentProduct) {
      const res = await cafeApi.put(`/updateItem/${currentProduct.id}`, data);
 const updated = { ...currentProduct, ...data, price: parseFloat(data.price) };
  setProducts(prev => prev.map(p => p.id === currentProduct.id ? updated : p));
    } else {
      const res = await cafeApi.post('/addItem', data);
const created = { ...res.data.data, price: parseFloat(res.data.data.price) };
      setProducts(prev => [created, ...prev]);
    }

    setShowSuccess(true);
    handleCloseDialog();
  } catch (err) {
    setUploadError('Failed to save product. Please try again.');
  }
};
const handleConfirmDelete = () => {
  cafeApi.delete(`/deleteItem/${productToDelete.id}`)
    .then(() => {
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setShowSuccess(true);
      setOpenDeleteDialog(false);
      setProductToDelete(null);
    })
    .catch(console.log);
};

  const canSubmit = formData.name && formData.price && formData.category && (formData.imageUrl || selectedFile) && !isUploading;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .ai-root { font-family:'Plus Jakarta Sans',sans-serif; }
        @keyframes ai-slideup { from{opacity:0;transform:translateY(18px);} to{opacity:1;transform:translateY(0);} }
        .ai-card-enter { animation: ai-slideup .45s ease-out both; }
        @keyframes ai-spin { to{transform:rotate(360deg);} }
        .ai-spin { animation: ai-spin .8s linear infinite; }
        @keyframes ai-blink { 0%,100%{opacity:1;} 50%{opacity:.2;} }

        /* MUI Dialog overrides */
        .ai-root .MuiDialog-paper {
          background: #0d1f3c !important; border: 1px solid rgba(27,203,224,.2) !important;
          border-radius: 20px !important; color: #e8f4ff !important;
          font-family: 'Plus Jakarta Sans',sans-serif !important;
        }
        .ai-root .MuiDialogTitle-root {
          background: rgba(27,203,224,.05) !important; border-bottom: 1px solid rgba(27,203,224,.12) !important;
          color: #e8f4ff !important; font-family: 'Plus Jakarta Sans',sans-serif !important;
          font-weight: 800 !important;
        }
        .ai-root .MuiDialogContent-root { background: transparent !important; padding: 24px !important; }
        .ai-root .MuiDialogActions-root {
          background: rgba(255,255,255,.02) !important; border-top: 1px solid rgba(27,203,224,.1) !important;
          padding: 14px 20px !important;
        }
        .ai-root .MuiTextField-root .MuiOutlinedInput-root,
        .ai-root .MuiFormControl-root .MuiOutlinedInput-root {
          background: rgba(255,255,255,.04) !important; border-radius: 12px !important;
          color: #e8f4ff !important; font-family: 'Plus Jakarta Sans',sans-serif !important;
        }
        .ai-root .MuiTextField-root .MuiOutlinedInput-notchedOutline,
        .ai-root .MuiFormControl-root .MuiOutlinedInput-notchedOutline {
          border-color: rgba(27,203,224,.18) !important;
        }
        .ai-root .MuiTextField-root .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline,
        .ai-root .MuiFormControl-root .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
          border-color: rgba(27,203,224,.4) !important;
        }
        .ai-root .MuiTextField-root .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline,
        .ai-root .MuiFormControl-root .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
          border-color: #1bcbe0 !important;
        }
        .ai-root .MuiInputLabel-root { color: #4a7099 !important; font-family: 'Plus Jakarta Sans',sans-serif !important; }
        .ai-root .MuiInputLabel-root.Mui-focused { color: #1bcbe0 !important; }
        .ai-root .MuiSelect-icon { color: #4a7099 !important; }
        .ai-root .MuiMenuItem-root { font-family: 'Plus Jakarta Sans',sans-serif !important; }
        .ai-root .MuiLinearProgress-root { background: rgba(27,203,224,.1) !important; border-radius:999px !important; }
        .ai-root .MuiLinearProgress-bar { background: linear-gradient(90deg,#1bcbe0,#1a6dd4) !important; }

        /* Product card image hover */
        .ai-prod-card:hover .ai-prod-img { transform: scale(1.07); }
        .ai-prod-card:hover .ai-prod-overlay { opacity: 1; }
        .ai-prod-card { transition: all .35s cubic-bezier(.16,1,.3,1); }
        .ai-prod-card:hover { transform: translateY(-7px); }
        .ai-prod-img { transition: transform .4s ease; }
        .ai-prod-overlay { transition: opacity .3s; opacity: 0; }

        /* Mobile: always show overlay */
        @media (max-width:768px) { .ai-prod-overlay { opacity: 1 !important; } }

        /* Scrollbar */
        .ai-scroll::-webkit-scrollbar { width:4px; }
        .ai-scroll::-webkit-scrollbar-track { background:rgba(255,255,255,.04); border-radius:99px; }
        .ai-scroll::-webkit-scrollbar-thumb { background:rgba(27,203,224,.25); border-radius:99px; }

        /* FAB pulse */
        @keyframes ai-fab-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(27,203,224,.5); }
          70%  { box-shadow: 0 0 0 16px rgba(27,203,224,0); }
          100% { box-shadow: 0 0 0 0 rgba(27,203,224,0); }
        }
        .ai-fab { animation: ai-fab-pulse 2.5s ease-out infinite; }
        .ai-fab:hover { transform: rotate(90deg) scale(1.1) !important; }
      `}</style>

      <div className="ai-root min-h-screen" style={{ background: '#0d1f3c', paddingBottom: 100 }}>

        {/* ── Background ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <div className="absolute rounded-full" style={{ width:520,height:520,background:'#1bcbe0',opacity:.07,filter:'blur(90px)',top:-120,right:-80 }}/>
          <div className="absolute rounded-full" style={{ width:420,height:420,background:'#1a6dd4',opacity:.07,filter:'blur(80px)',bottom:-80,left:-60 }}/>
          <div className="absolute inset-0" style={{ backgroundImage:'radial-gradient(rgba(27,203,224,.1) 1px,transparent 1px)',backgroundSize:'38px 38px' }}/>
        </div>

        <div className="relative" style={{ zIndex:1, maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>

          {/* ── HEADER ── */}
          <div className="flex items-center justify-between pt-7 pb-6 mb-8"
            style={{ borderBottom:'1px solid rgba(27,203,224,.1)' }}>
            <div className="flex items-center gap-4">
              <button onClick={() => window.history.back()}
                className="flex items-center gap-2 px-4 py-2 rounded-full transition-all"
                style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(27,203,224,.15)', color:'#7a9dc0', fontSize:'.82rem', fontWeight:600, cursor:'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(27,203,224,.4)'; e.currentTarget.style.color='#1bcbe0'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(27,203,224,.15)'; e.currentTarget.style.color='#7a9dc0'; }}>
                <ArrowLeft size={16}/> Back
              </button>
              <div className="flex items-center gap-3">
                <img src="/images/coffai1.png" alt="CoffAI" style={{ width:36 }}/>
                <div>
                  <h1 className="font-extrabold" style={{ fontSize:'1.5rem', letterSpacing:'-.02em', lineHeight:1.1, background:'linear-gradient(135deg,#1bcbe0,#1a6dd4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                    Menu Items
                  </h1>
                  <p style={{ fontSize:'.75rem', color:'#4a7099', marginTop:2 }}>Manage your café's menu</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background:'rgba(27,203,224,.07)', border:'1px solid rgba(27,203,224,.18)', color:'#1bcbe0', fontSize:'.78rem', fontWeight:700 }}>
              <Package size={14}/> {products.length} items
            </div>
          </div>

          {showSuccess && <SuccessMessage setShowSuccess={setShowSuccess}/>}

          {/* ── FILTERS ── */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            {/* Search */}
            <div className="relative flex-1" style={{ minWidth:240 }}>
              <Search size={16} className="absolute" style={{ left:14, top:'50%', transform:'translateY(-50%)', color:'#2a4a6a', pointerEvents:'none' }}/>
              <input
                type="text" placeholder="Search items…" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-xl py-3 pl-10 pr-4 outline-none transition-all"
                style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(27,203,224,.16)', color:'#e8f4ff', fontFamily:'inherit', fontSize:'.88rem' }}
                onFocus={e => e.target.style.borderColor='rgba(27,203,224,.5)'}
                onBlur={e  => e.target.style.borderColor='rgba(27,203,224,.16)'}
              />
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const cfg = CAT_CONFIG[cat];
                const active = catFilter === cat;
                const Icon = cfg?.icon;
                return (
                  <button key={cat} onClick={() => setCatFilter(cat)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all"
                    style={{
                      fontFamily:'inherit', cursor:'pointer', border:'none',
                      background: active ? 'linear-gradient(135deg,#1bcbe0,#1a6dd4)' : 'rgba(255,255,255,.04)',
                      color:      active ? '#fff' : '#4a7099',
                      boxShadow:  active ? '0 4px 14px rgba(27,203,224,.3)' : 'none',
                      border:     active ? 'none' : '1px solid rgba(27,203,224,.12)',
                    }}>
                    {Icon && <Icon size={12}/>}
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── PRODUCT GRID ── */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Package size={48} color="rgba(27,203,224,.18)"/>
              <p style={{ color:'#2a4a6a', fontSize:'.95rem' }}>No products found</p>
              <p style={{ color:'#1a3a5a', fontSize:'.8rem' }}>Try adjusting your filters or add a new item</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:20 }}>
              {filtered.map((product, idx) => (
                <div key={product.id} className="ai-card-enter ai-prod-card rounded-2xl overflow-hidden"
                  style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(27,203,224,.12)', animationDelay:`${idx*0.05}s` }}>

                  {/* Image */}
                  <div className="relative overflow-hidden" style={{ height:200, background:'#0a1628' }}>
                    <img src={product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'} alt={product.name}
                      className="ai-prod-img w-full h-full" style={{ objectFit:'cover' }}/>

                    {/* Out of stock overlay */}
                    {!product.stock && (
                      <div className="absolute inset-0 flex items-center justify-center"
                        style={{ background:'rgba(13,31,60,.75)', backdropFilter:'blur(4px)' }}>
                        <span className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{ background:'rgba(248,113,113,.15)', color:'#f87171', border:'1px solid rgba(248,113,113,.3)' }}>
                          Out of Stock
                        </span>
                      </div>
                    )}

                    {/* Hover actions */}
                    <div className="ai-prod-overlay absolute inset-0 flex items-center justify-center gap-3"
                      style={{ background:'rgba(13,31,60,.8)', backdropFilter:'blur(4px)' }}>
                      <button onClick={() => handleOpenDialog(product)}
                        className="flex items-center justify-center rounded-xl transition-all"
                        style={{ width:42,height:42,background:'rgba(26,109,212,.2)',border:'1px solid rgba(26,109,212,.4)',color:'#1a6dd4',cursor:'pointer' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(26,109,212,.4)'}
                        onMouseLeave={e=>e.currentTarget.style.background='rgba(26,109,212,.2)'}>
                        ✏️
                      </button>
                      <button onClick={() => { setProductToDelete(product); setOpenDeleteDialog(true); }}
                        className="flex items-center justify-center rounded-xl transition-all"
                        style={{ width:42,height:42,background:'rgba(248,113,113,.15)',border:'1px solid rgba(248,113,113,.3)',color:'#f87171',cursor:'pointer' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(248,113,113,.32)'}
                        onMouseLeave={e=>e.currentTarget.style.background='rgba(248,113,113,.15)'}>
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold leading-snug" style={{ color:'#e8f4ff', fontSize:'.95rem', flex:1 }}>{product.name}</h3>
                      <CatBadge category={product.category}/>
                    </div>
                    <p className="font-extrabold" style={{ fontSize:'1.2rem', background:'linear-gradient(135deg,#34d399,#059669)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                      {product.price.toFixed(2)} TND
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── FAB ── */}
        <button onClick={() => handleOpenDialog()}
          className="ai-fab fixed flex items-center justify-center rounded-full transition-all"
          style={{ bottom:32, right:32, width:60, height:60, background:'linear-gradient(135deg,#1bcbe0,#1a6dd4)', border:'none', cursor:'pointer', zIndex:100, boxShadow:'0 8px 28px rgba(27,203,224,.45)' }}>
          <Plus size={28} color="#fff"/>
        </button>

        {/* ══════════════ ADD / EDIT DIALOG ══════════════ */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth className="ai-root">
          <DialogTitle>{currentProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogContent>
            <div className="flex flex-col gap-4 pt-1">
              <TextField label="Product Name" name="name" value={formData.name} onChange={handleInputChange} fullWidth required/>
              <TextField label="Price (TND)" name="price" type="number" value={formData.price} onChange={handleInputChange} fullWidth required inputProps={{ step:'.01', min:0 }}/>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select name="category" value={formData.category} onChange={handleInputChange} label="Category">
                  {CATEGORIES.filter(c => c !== 'all').map(cat => (
                    <MenuItem key={cat} value={cat} style={{ fontFamily:'Plus Jakarta Sans,sans-serif' }}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Stock" name="stock" type="number" value={formData.stock} onChange={handleInputChange} fullWidth required inputProps={{ step:1, min:0 }}/>

              {/* ── Image section ── */}
              <div className="rounded-xl p-4" style={{ border:'1px solid rgba(27,203,224,.16)', background:'rgba(255,255,255,.02)' }}>
                <p className="font-bold mb-3 text-sm" style={{ color:'#7a9dc0', letterSpacing:'.06em', textTransform:'uppercase' }}>Product Image</p>

                {/* Preview */}
                {previewUrl && (
                  <div className="relative rounded-xl overflow-hidden mb-3" style={{ height:200 }}>
                    <img src={previewUrl} alt="Preview" className="w-full h-full" style={{ objectFit:'cover' }}/>
                    <button onClick={() => { setSelectedFile(null); setPreviewUrl(''); setFormData({...formData, imageUrl:''}); }}
                      className="absolute top-2 right-2 flex items-center justify-center rounded-full"
                      style={{ width:30,height:30,background:'rgba(0,0,0,.65)',border:'none',cursor:'pointer',color:'#fff' }}>
                      <X size={15}/>
                    </button>
                    {/* Selected checkmark */}
                    {selectedFile && !isUploading && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ background:'rgba(52,211,153,.15)', color:'#34d399', border:'1px solid rgba(52,211,153,.3)' }}>
                        <CheckCircle size={12}/> Ready to upload
                      </div>
                    )}
                  </div>
                )}

                {/* Upload button */}
                <label className="flex items-center justify-center gap-2 w-full py-3 rounded-xl cursor-pointer font-bold text-sm transition-all mb-3"
                  style={{ background:'rgba(27,203,224,.07)', border:'2px dashed rgba(27,203,224,.25)', color:'#1bcbe0' }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(27,203,224,.5)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(27,203,224,.25)'}>
                  <Upload size={16}/> {selectedFile ? 'Change image' : 'Upload new image'}
                  <input type="file" hidden accept="image/*" onChange={handleFileSelect} disabled={isUploading}/>
                </label>

                {/* Gallery from categoryImages */}
                {formData.category && categoryImages[formData.category] && (
                  <div>
                    <p className="mb-2 text-xs" style={{ color:'#4a7099', letterSpacing:'.06em', textTransform:'uppercase', fontWeight:700 }}>
                      Or choose existing:
                    </p>
                    <div className="ai-scroll" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, maxHeight:200, overflowY:'auto', padding:4 }}>
                      {categoryImages[formData.category].map((url, i) => (
                        <div key={i} onClick={() => { setPreviewUrl(url); setFormData({...formData, imageUrl:url}); setSelectedFile(null); setUploadError(''); }}
                          className="relative rounded-xl overflow-hidden cursor-pointer transition-all"
                          style={{ aspectRatio:'1', border: previewUrl === url ? '2.5px solid #1bcbe0' : '1px solid rgba(27,203,224,.14)', boxShadow: previewUrl === url ? '0 0 0 1px rgba(27,203,224,.2)' : 'none' }}>
                          <img src={url} alt={`opt${i}`} className="w-full h-full" style={{ objectFit:'cover' }}/>
                          {previewUrl === url && (
                            <div className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-full"
                              style={{ width:20,height:20,background:'#1bcbe0' }}>
                              <CheckCircle size={13} color="#fff"/>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress */}
                {isUploading && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Loader2 size={15} color="#1bcbe0" className="ai-spin"/>
                      <span style={{ fontSize:'.78rem', color:'#7a9dc0' }}>Uploading… {uploadProgress}%</span>
                    </div>
                    <LinearProgress variant="determinate" value={uploadProgress}/>
                  </div>
                )}

                {/* Error */}
                {uploadError && (
                  <div className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-xl"
                    style={{ background:'rgba(248,113,113,.08)', border:'1px solid rgba(248,113,113,.25)' }}>
                    <AlertCircle size={15} color="#f87171"/>
                    <span style={{ fontSize:'.78rem', color:'#f87171' }}>{uploadError}</span>
                  </div>
                )}

                <p className="mt-2 text-xs" style={{ color:'#2a4a6a' }}>JPG, PNG, WEBP · Max 5 MB</p>
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <button onClick={handleCloseDialog} disabled={isUploading}
              className="px-5 py-2 rounded-xl font-bold text-sm transition-all"
              style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', color:'#7a9dc0', cursor:'pointer', fontFamily:'inherit' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.09)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.05)'}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={!canSubmit}
              className="px-6 py-2 rounded-xl font-bold text-sm text-white transition-all flex items-center gap-2"
              style={{
                background: canSubmit ? 'linear-gradient(135deg,#1bcbe0,#1a6dd4)' : 'rgba(255,255,255,.08)',
                border:'none', cursor: canSubmit ? 'pointer' : 'not-allowed', fontFamily:'inherit',
                boxShadow: canSubmit ? '0 4px 16px rgba(27,203,224,.35)' : 'none',
                color: canSubmit ? '#fff' : '#2a4a6a',
              }}>
              {isUploading && <Loader2 size={15} className="ai-spin"/>}
              {isUploading ? 'Uploading…' : currentProduct ? 'Update Product' : 'Add Product'}
            </button>
          </DialogActions>
        </Dialog>

        {/* ══════════════ DELETE DIALOG ══════════════ */}
        <Dialog open={openDeleteDialog} onClose={() => { setOpenDeleteDialog(false); setProductToDelete(null); }} className="ai-root">
          <DialogTitle><span style={{ color:'#f87171', fontWeight:800 }}>Delete product?</span></DialogTitle>
          <DialogContent>
            <p style={{ color:'#7a9dc0', fontSize:'.9rem', lineHeight:1.6, paddingTop:8 }}>
              Are you sure you want to delete{' '}
              <strong style={{ color:'#e8f4ff' }}>{productToDelete?.name}</strong>?{' '}
              This action cannot be undone.
            </p>
          </DialogContent>
          <DialogActions>
            <button onClick={() => { setOpenDeleteDialog(false); setProductToDelete(null); }}
              className="px-5 py-2 rounded-xl font-bold text-sm transition-all"
              style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', color:'#7a9dc0', cursor:'pointer', fontFamily:'inherit' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.09)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.05)'}>
              Cancel
            </button>
            <button onClick={handleConfirmDelete}
              className="px-5 py-2 rounded-xl font-bold text-sm text-white transition-all"
              style={{ background:'linear-gradient(135deg,#ef4444,#dc2626)', border:'none', cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(239,68,68,.3)' }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 6px 20px rgba(239,68,68,.5)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(239,68,68,.3)'}>
              Delete
            </button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
}

export default AdminItems;