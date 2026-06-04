import { useState, useEffect, useCallback, memo } from 'react';
import {
  ArrowLeft, Upload, X, Loader2, CheckCircle,
  AlertCircle, Search, Plus, Coffee, Utensils,
  Wine, Cake, Dices, Cigarette, Package,
} from 'lucide-react';
import SuccessMessage from './SuccessAlert';
import cafeApi from '../../api/cafeApiInstance';
import axios from 'axios';

const CAT_CONFIG = {
  coffee:  { icon: Coffee,    color: '#c87941', bg: 'rgba(200,121,65,.14)',  border: 'rgba(200,121,65,.3)'  },
  food:    { icon: Utensils,  color: '#f59e0b', bg: 'rgba(245,158,11,.14)',  border: 'rgba(245,158,11,.3)'  },
  drink:   { icon: Wine,      color: '#1bcbe0', bg: 'rgba(27,203,224,.14)',  border: 'rgba(27,203,224,.3)'  },
  dessert: { icon: Cake,      color: '#f472b6', bg: 'rgba(244,114,182,.14)', border: 'rgba(244,114,182,.3)' },
  games:   { icon: Dices,     color: '#a78bfa', bg: 'rgba(167,139,250,.14)', border: 'rgba(167,139,250,.3)' },
  smoking: { icon: Cigarette, color: '#94a3b8', bg: 'rgba(148,163,184,.14)', border: 'rgba(148,163,184,.3)' },
};
const CATEGORIES = ['all', 'coffee', 'food', 'drink', 'dessert', 'games', 'smoking'];

function CatBadge({ category }) {
  const cfg  = CAT_CONFIG[category] || { icon: Package, color: '#4a7099', bg: 'rgba(74,112,153,.12)', border: 'rgba(74,112,153,.25)' };
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, letterSpacing: '.05em', whiteSpace: 'nowrap' }}>
      <Icon size={11} /> {category}
    </span>
  );
}

/* uncontrolled text/number field — zero parent re-renders on keystroke */
function Field({ label, name, type = 'text', defaultValue, inputProps = {} }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold tracking-widest uppercase" style={{ color: '#4a7099' }}>{label}</label>
      <input
        name={name} type={type} defaultValue={defaultValue ?? ''}
        {...inputProps}
        className="w-full rounded-xl px-4 py-3 outline-none text-sm font-medium"
        style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(27,203,224,.18)', color: '#e8f4ff', fontFamily: 'inherit' }}
        onFocus={e => e.target.style.borderColor = '#1bcbe0'}
        onBlur={e  => e.target.style.borderColor = 'rgba(27,203,224,.18)'}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ISOLATED FORM — only state inside here re-renders this subtree
   The parent grid is completely unaffected by typing
══════════════════════════════════════════════════════════════ */
const ProductForm = memo(function ProductForm({ product, categoryImages, onSave, onClose }) {
  const [selectedFile, setSelectedFile]     = useState(null);
  const [previewUrl, setPreviewUrl]         = useState(product?.imageUrl || '');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading]       = useState(false);
  const [uploadError, setUploadError]       = useState('');
  const [category, setCategory]             = useState(product?.category || '');

  const handleFileSelect = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadError('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024)     { setUploadError('Image size must be under 5 MB'); return; }
    setSelectedFile(file); setUploadError('');
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const form = document.getElementById('product-form');
    const data = {
      name:        form.elements.name.value.trim(),
      price:       form.elements.price.value,
      description: form.elements.description.value.trim(),
      stock:       form.elements.stock.value,
      category,
      imageUrl:    previewUrl,
    };

    if (!data.name || !data.price || !data.category || !data.imageUrl) {
      setUploadError('Please fill in all required fields and add an image.');
      return;
    }

    let imageUrl = previewUrl;

    if (selectedFile) {
      setIsUploading(true); setUploadProgress(0); setUploadError('');
      const fd = new FormData();
      fd.append('image', selectedFile);
      try {
        const res = await cafeApi.post('/upload-image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: e => setUploadProgress(Math.round((e.loaded * 100) / e.total)),
        });
        imageUrl = res.data.imageUrl;
        setIsUploading(false);
      } catch {
        setIsUploading(false);
        setUploadError('Upload failed. Please try again.');
        return;
      }
    }

    onSave({ ...data, imageUrl });
  };

  const canSubmit = !!category && !!previewUrl && !isUploading;

  return (
    <div className="ai-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ai-modal ai-scroll">

        <div className="ai-modal-head">
          <span>{product ? 'Edit Product' : 'Add New Product'}</span>
          <button onClick={onClose} className="ai-close-btn"><X size={16}/></button>
        </div>

        {/* uncontrolled form — reads values on submit only */}
        <form id="product-form" className="ai-modal-body flex flex-col gap-5" onSubmit={e => e.preventDefault()}>
          <Field label="Product Name *" name="name"        defaultValue={product?.name}        />
          <Field label="Price (TND) *"  name="price"       defaultValue={product?.price}       type="number" inputProps={{ step:'.01', min:0 }} />
          <Field label="Description"    name="description" defaultValue={product?.description} />
          <Field label="Stock"          name="stock"       defaultValue={product?.stock}       type="number" inputProps={{ step:1, min:0 }} />

          {/* Category — needs state to show the right gallery panel */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold tracking-widest uppercase" style={{ color: '#4a7099' }}>Category *</label>
            <select
              value={category} onChange={e => setCategory(e.target.value)}
              className="w-full rounded-xl px-4 py-3 outline-none text-sm font-medium"
              style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(27,203,224,.18)', color: category ? '#e8f4ff' : '#4a7099', fontFamily:'inherit', appearance:'none', cursor:'pointer' }}
              onFocus={e => e.target.style.borderColor = '#1bcbe0'}
              onBlur={e  => e.target.style.borderColor = 'rgba(27,203,224,.18)'}>
              <option value="" disabled style={{ background:'#0d1f3c' }}>Select category…</option>
              {CATEGORIES.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat} style={{ background:'#0d1f3c', color:'#e8f4ff' }}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Image section */}
          <div className="rounded-xl p-4" style={{ border:'1px solid rgba(27,203,224,.16)', background:'rgba(255,255,255,.02)' }}>
            <p className="text-xs font-bold mb-3 tracking-widest uppercase" style={{ color:'#7a9dc0' }}>Product Image *</p>

            {previewUrl && (
              <div className="relative rounded-xl overflow-hidden mb-3" style={{ height:180 }}>
                <img src={previewUrl} alt="Preview" className="w-full h-full" style={{ objectFit:'cover' }}/>
                <button type="button" onClick={() => { setSelectedFile(null); setPreviewUrl(''); }}
                  className="absolute top-2 right-2 flex items-center justify-center rounded-full"
                  style={{ width:28,height:28,background:'rgba(0,0,0,.7)',border:'none',cursor:'pointer',color:'#fff' }}>
                  <X size={14}/>
                </button>
                {selectedFile && !isUploading && (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background:'rgba(52,211,153,.15)', color:'#34d399', border:'1px solid rgba(52,211,153,.3)' }}>
                    <CheckCircle size={11}/> Ready to upload
                  </div>
                )}
              </div>
            )}

            <label className="ai-upload-label flex items-center justify-center gap-2 w-full py-3 rounded-xl cursor-pointer font-bold text-sm mb-3"
              style={{ background:'rgba(27,203,224,.07)', border:'2px dashed rgba(27,203,224,.25)', color:'#1bcbe0' }}>
              <Upload size={15}/> {selectedFile ? 'Change image' : 'Upload image'}
              <input type="file" hidden accept="image/*" onChange={handleFileSelect} disabled={isUploading}/>
            </label>

            {category && categoryImages[category] && (
              <div>
                <p className="mb-2 text-xs font-bold tracking-widest uppercase" style={{ color:'#4a7099' }}>Or choose existing:</p>
                <div className="ai-scroll" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, maxHeight:180, overflowY:'auto', padding:4 }}>
                  {categoryImages[category].map((url, i) => (
                    <div key={i}
                      onClick={() => { setPreviewUrl(url); setSelectedFile(null); setUploadError(''); }}
                      className="relative rounded-xl overflow-hidden cursor-pointer"
                      style={{ aspectRatio:'1', border: previewUrl === url ? '2px solid #1bcbe0' : '1px solid rgba(27,203,224,.14)' }}>
                      <img src={url} alt="" className="w-full h-full" style={{ objectFit:'cover' }}/>
                      {previewUrl === url && (
                        <div className="absolute top-1 right-1 flex items-center justify-center rounded-full"
                          style={{ width:18,height:18,background:'#1bcbe0' }}>
                          <CheckCircle size={11} color="#fff"/>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isUploading && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 size={14} color="#1bcbe0" className="ai-spin"/>
                  <span style={{ fontSize:'.75rem', color:'#7a9dc0' }}>Uploading… {uploadProgress}%</span>
                </div>
                <div className="w-full rounded-full overflow-hidden" style={{ height:4, background:'rgba(27,203,224,.1)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width:`${uploadProgress}%`, background:'linear-gradient(90deg,#1bcbe0,#1a6dd4)' }}/>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-xl"
                style={{ background:'rgba(248,113,113,.08)', border:'1px solid rgba(248,113,113,.25)' }}>
                <AlertCircle size={14} color="#f87171"/>
                <span style={{ fontSize:'.78rem', color:'#f87171' }}>{uploadError}</span>
              </div>
            )}
            <p className="mt-2" style={{ fontSize:'.7rem', color:'#2a4a6a' }}>JPG, PNG, WEBP · Max 5 MB</p>
          </div>
        </form>

        <div className="ai-modal-foot flex justify-end gap-3">
          <button onClick={onClose} disabled={isUploading} className="ai-btn-secondary px-5 py-2.5 rounded-xl text-sm font-bold">Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit} className="ai-btn-primary px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
            {isUploading && <Loader2 size={14} className="ai-spin"/>}
            {isUploading ? 'Uploading…' : product ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE — grid state is completely isolated from form state
══════════════════════════════════════════════════════════════ */
export default function AdminItems() {
  const [products, setProducts]             = useState([]);
  const [filtered, setFiltered]             = useState([]);
  const [searchTerm, setSearchTerm]         = useState('');
  const [catFilter, setCatFilter]           = useState('all');
  const [editTarget, setEditTarget]         = useState(undefined); // undefined=closed, null=new, obj=edit
  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [showSuccess, setShowSuccess]       = useState(false);
  const [categoryImages, setCategoryImages] = useState({});

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + '/api/getPhotosPro', {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    }).then(r => setCategoryImages(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    cafeApi.get('/getItems').then(r => {
      const items = r.data.data.map(p => ({ ...p, price: parseFloat(p.price) }));
      setProducts(items); setFiltered(items);
    }).catch(console.log);
  }, []);

  useEffect(() => {
    let f = products;
    if (searchTerm) f = f.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (catFilter !== 'all') f = f.filter(p => p.category === catFilter);
    setFiltered(f);
  }, [searchTerm, catFilter, products]);

  const handleSave = useCallback(async (data) => {
    try {
      if (editTarget) {
        await cafeApi.put(`/updateItem/${editTarget.id}`, data);
        setProducts(prev => prev.map(p => p.id === editTarget.id ? { ...editTarget, ...data, price: parseFloat(data.price) } : p));
      } else {
        const res = await cafeApi.post('/addItem', data);
        const created = { ...res.data.data, price: parseFloat(res.data.data.price) };
        setProducts(prev => [created, ...prev]);
      }
      setShowSuccess(true);
      setEditTarget(undefined);
    } catch { console.error('Save failed'); }
  }, [editTarget]);

  const handleConfirmDelete = useCallback(() => {
    cafeApi.delete(`/deleteItem/${deleteTarget.id}`).then(() => {
      setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
      setShowSuccess(true); setDeleteTarget(null);
    }).catch(console.log);
  }, [deleteTarget]);

  return (
    <>
      <style>{CSS}</style>
      <div className="ai-root min-h-screen" style={{ background: '#0d1f3c', paddingBottom: 100 }}>

        {/* Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <div className="absolute rounded-full" style={{ width:520,height:520,background:'#1bcbe0',opacity:.07,filter:'blur(90px)',top:-120,right:-80 }}/>
          <div className="absolute rounded-full" style={{ width:420,height:420,background:'#1a6dd4',opacity:.07,filter:'blur(80px)',bottom:-80,left:-60 }}/>
          <div className="absolute inset-0" style={{ backgroundImage:'radial-gradient(rgba(27,203,224,.1) 1px,transparent 1px)',backgroundSize:'38px 38px' }}/>
        </div>

        <div className="relative" style={{ zIndex:1, maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>

          {/* Header */}
          <div className="flex items-center justify-between pt-7 pb-6 mb-8" style={{ borderBottom:'1px solid rgba(27,203,224,.1)' }}>
            <div className="flex items-center gap-4">
              <button onClick={() => window.history.back()} className="ai-back-btn flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold">
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

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="relative flex-1" style={{ minWidth:240 }}>
              <Search size={16} className="absolute" style={{ left:14, top:'50%', transform:'translateY(-50%)', color:'#2a4a6a', pointerEvents:'none' }}/>
              <input
                type="text" placeholder="Search items…" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-xl py-3 pl-10 pr-4 outline-none text-sm"
                style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(27,203,224,.16)', color:'#e8f4ff', fontFamily:'inherit' }}
                onFocus={e => e.target.style.borderColor='rgba(27,203,224,.5)'}
                onBlur={e  => e.target.style.borderColor='rgba(27,203,224,.16)'}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const cfg = CAT_CONFIG[cat]; const active = catFilter === cat; const Icon = cfg?.icon;
                return (
                  <button key={cat} onClick={() => setCatFilter(cat)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all"
                    style={{ fontFamily:'inherit', cursor:'pointer', background: active ? 'linear-gradient(135deg,#1bcbe0,#1a6dd4)' : 'rgba(255,255,255,.04)', color: active ? '#fff' : '#4a7099', boxShadow: active ? '0 4px 14px rgba(27,203,224,.3)' : 'none', border: active ? '1px solid transparent' : '1px solid rgba(27,203,224,.12)' }}>
                    {Icon && <Icon size={12}/>} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Package size={48} color="rgba(27,203,224,.18)"/>
              <p style={{ color:'#2a4a6a', fontSize:'.95rem' }}>No products found</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:20 }}>
              {filtered.map((product, idx) => (
                <div key={product.id} className="ai-card-enter ai-prod-card rounded-2xl overflow-hidden"
                  style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(27,203,224,.12)', animationDelay:`${idx*0.05}s` }}>
                  <div className="relative overflow-hidden" style={{ height:200, background:'#0a1628' }}>
                    <img src={product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'} alt={product.name}
                      className="ai-prod-img w-full h-full" style={{ objectFit:'cover' }}/>
                    {!product.stock && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background:'rgba(13,31,60,.75)', backdropFilter:'blur(4px)' }}>
                        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background:'rgba(248,113,113,.15)', color:'#f87171', border:'1px solid rgba(248,113,113,.3)' }}>Out of Stock</span>
                      </div>
                    )}
                    <div className="ai-prod-overlay absolute inset-0 flex items-center justify-center gap-3" style={{ background:'rgba(13,31,60,.8)', backdropFilter:'blur(4px)' }}>
                      <button onClick={() => setEditTarget(product)} className="ai-action-btn ai-edit-btn flex items-center justify-center rounded-xl" style={{ width:42,height:42 }}>✏️</button>
                      <button onClick={() => setDeleteTarget(product)} className="ai-action-btn ai-del-btn flex items-center justify-center rounded-xl" style={{ width:42,height:42 }}>🗑️</button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold leading-snug" style={{ color:'#e8f4ff', fontSize:'.95rem', flex:1 }}>{product.name}</h3>
                      <CatBadge category={product.category}/>
                    </div>
                    {product.description && (
                      <p className="text-xs mb-2 line-clamp-2" style={{ color:'#4a7099', lineHeight:1.5 }}>{product.description}</p>
                    )}
                    <p className="font-extrabold" style={{ fontSize:'1.2rem', background:'linear-gradient(135deg,#34d399,#059669)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                      {product.price.toFixed(2)} TND
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FAB */}
        <button onClick={() => setEditTarget(null)}
          className="ai-fab fixed flex items-center justify-center rounded-full"
          style={{ bottom:32, right:32, width:60, height:60, background:'linear-gradient(135deg,#1bcbe0,#1a6dd4)', border:'none', cursor:'pointer', zIndex:100, boxShadow:'0 8px 28px rgba(27,203,224,.45)' }}>
          <Plus size={28} color="#fff"/>
        </button>

        {/* Edit/Add modal — isolated subtree, typing here never touches the grid */}
        {editTarget !== undefined && (
          <ProductForm
            product={editTarget}
            categoryImages={categoryImages}
            onSave={handleSave}
            onClose={() => setEditTarget(undefined)}
          />
        )}

        {/* Delete modal */}
        {deleteTarget && (
          <div className="ai-modal-backdrop" onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
            <div className="ai-modal" style={{ maxWidth:420 }}>
              <div className="ai-modal-head">
                <span style={{ color:'#f87171' }}>Delete product?</span>
                <button onClick={() => setDeleteTarget(null)} className="ai-close-btn"><X size={16}/></button>
              </div>
              <div className="ai-modal-body">
                <p style={{ color:'#7a9dc0', fontSize:'.9rem', lineHeight:1.65 }}>
                  Are you sure you want to delete <strong style={{ color:'#e8f4ff' }}>{deleteTarget?.name}</strong>? This cannot be undone.
                </p>
              </div>
              <div className="ai-modal-foot flex justify-end gap-3">
                <button onClick={() => setDeleteTarget(null)} className="ai-btn-secondary px-5 py-2.5 rounded-xl text-sm font-bold">Cancel</button>
                <button onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background:'linear-gradient(135deg,#ef4444,#dc2626)', border:'none', cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(239,68,68,.3)' }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  .ai-root { font-family: 'Plus Jakarta Sans', sans-serif; }
  @keyframes ai-slideup  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ai-spin     { to{transform:rotate(360deg)} }
  @keyframes ai-fab-pulse{ 0%{box-shadow:0 0 0 0 rgba(27,203,224,.5)} 70%{box-shadow:0 0 0 16px rgba(27,203,224,0)} 100%{box-shadow:0 0 0 0 rgba(27,203,224,0)} }
  @keyframes ai-modal-in { from{opacity:0;transform:translateY(24px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  .ai-spin       { animation: ai-spin .8s linear infinite; }
  .ai-card-enter { animation: ai-slideup .45s ease-out both; }
  .ai-fab        { animation: ai-fab-pulse 2.5s ease-out infinite; transition: transform .2s; }
  .ai-fab:hover  { transform: rotate(90deg) scale(1.1) !important; }
  .ai-prod-card  { transition: all .35s cubic-bezier(.16,1,.3,1); }
  .ai-prod-card:hover { transform: translateY(-7px); box-shadow: 0 16px 40px rgba(0,0,0,.4); }
  .ai-prod-img   { transition: transform .4s ease; }
  .ai-prod-card:hover .ai-prod-img { transform: scale(1.07); }
  .ai-prod-overlay { transition: opacity .3s; opacity: 0; }
  .ai-prod-card:hover .ai-prod-overlay { opacity: 1; }
  @media(max-width:768px){ .ai-prod-overlay { opacity: 1 !important; } }
  .ai-edit-btn { background:rgba(26,109,212,.2); border:1px solid rgba(26,109,212,.4); color:#1a6dd4; cursor:pointer; transition:background .15s; }
  .ai-edit-btn:hover { background:rgba(26,109,212,.4); }
  .ai-del-btn  { background:rgba(248,113,113,.15); border:1px solid rgba(248,113,113,.3); color:#f87171; cursor:pointer; transition:background .15s; }
  .ai-del-btn:hover  { background:rgba(248,113,113,.32); }
  .ai-back-btn { background:rgba(255,255,255,.04); border:1px solid rgba(27,203,224,.15); color:#7a9dc0; font-size:.82rem; cursor:pointer; transition:all .2s; }
  .ai-back-btn:hover { border-color:rgba(27,203,224,.4); color:#1bcbe0; }
  .ai-modal-backdrop { position:fixed; inset:0; z-index:200; background:rgba(5,12,26,.85); backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center; padding:20px; }
  .ai-modal { width:100%; max-width:560px; max-height:90svh; background:#0d1f3c; border:1px solid rgba(27,203,224,.2); border-radius:20px; overflow-y:auto; animation:ai-modal-in .28s cubic-bezier(.16,1,.3,1); display:flex; flex-direction:column; }
  .ai-modal-head { display:flex; align-items:center; justify-content:space-between; padding:18px 22px; border-bottom:1px solid rgba(27,203,224,.12); background:rgba(27,203,224,.04); font-size:1rem; font-weight:800; color:#e8f4ff; position:sticky; top:0; z-index:1; flex-shrink:0; }
  .ai-modal-body { padding:22px; flex:1; }
  .ai-modal-foot { padding:14px 22px; border-top:1px solid rgba(27,203,224,.1); background:rgba(255,255,255,.02); position:sticky; bottom:0; flex-shrink:0; }
  .ai-close-btn  { width:30px; height:30px; border-radius:9px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); color:#7a9dc0; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; }
  .ai-close-btn:hover { background:rgba(255,255,255,.12); color:#e8f4ff; }
  .ai-btn-secondary { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); color:#7a9dc0; cursor:pointer; font-family:inherit; transition:background .15s; }
  .ai-btn-secondary:hover { background:rgba(255,255,255,.09); }
  .ai-btn-primary { background:linear-gradient(135deg,#1bcbe0,#1a6dd4); border:none; color:#fff; cursor:pointer; font-family:inherit; box-shadow:0 4px 16px rgba(27,203,224,.35); transition:opacity .15s; }
  .ai-btn-primary:disabled { opacity:.35; cursor:not-allowed; box-shadow:none; }
  .ai-upload-label { transition:border-color .2s; }
  .ai-upload-label:hover { border-color:rgba(27,203,224,.5) !important; }
  .ai-scroll::-webkit-scrollbar { width:4px; }
  .ai-scroll::-webkit-scrollbar-track { background:rgba(255,255,255,.04); border-radius:99px; }
  .ai-scroll::-webkit-scrollbar-thumb { background:rgba(27,203,224,.25); border-radius:99px; }
`;