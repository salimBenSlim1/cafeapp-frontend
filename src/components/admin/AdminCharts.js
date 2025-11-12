
import  { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { ArrowLeft } from 'lucide-react'; // or your icon libraryRéessayerClaude n'a pas encore la capacité d'exécuter le code qu'il génère.
import cafeApi from "../../api/cafeApiInstance";
import {
  Box,
  Button,
} from '@mui/material';

export default function AdminCharts() {
  const responsiveStyles = `
  @media (max-width: 768px) {
    .charts-container {
      padding: 16px !important;
    }
    
    .header-section {
      padding: 20px !important;
      margin-bottom: 20px !important;
    }
    
    .header-section h1 {
      font-size: 1.75rem !important;
    }
    
    .stats-grid {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }
    
    .stat-card {
      padding: 16px !important;
    }
    
    .stat-card .stat-title {
      font-size: 2rem !important;
    }
    
    .charts-grid {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }
    
    .chart-card {
      padding: 16px !important;
    }
    
    .chart-card h2 {
      font-size: 1.125rem !important;
    }
  }
  
  @media (max-width: 500px) {
    .header-section h1 {
      font-size: 1.5rem !important;
    }
    
    .stat-card .stat-title {
      font-size: 1.5rem !important;
    }
  }
`;

  const [salesData, setSalesData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    
    cafeApi.get("/stats/sales-by-item")
      .then(res => {
        const formattedData = res.data.map(d => ({
          name: d.Item.name,
          totalSold: parseInt(d.totalSold),
          totalRevenue: parseFloat(d.totalRevenue)
        }));
        setSalesData(formattedData);
        setTotalRevenue(formattedData.reduce((acc, item) => acc + item.totalRevenue, 0));
        setTotalItems(formattedData.reduce((acc, item) => acc + item.totalSold, 0));
      })
      .catch(err => console.error(err));
      
    cafeApi.get("/stats/daily-revenue")
      .then(res => {
        const formattedData = res.data.map(d => ({
          date: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
          revenue: parseFloat(d.revenue)
        }));
        setRevenueData(formattedData);
      })
      .catch(err => console.error(err));
  }, []);
  
  const COLORS = ['#3b82f6', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

 const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.98)',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
          <p style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px', fontSize: '14px', margin: 0 }}>{label}</p>
          <p style={{ color: '#3b82f6', fontWeight: '700', fontSize: '16px', margin: 0 }}>
            {payload[0].value} {payload[0].dataKey === 'revenue' ? 'DT' : 'unités'}
          </p>
        </div>
      );
    }
    return null;
  };
  return (
    
    <div style={{
      padding: '32px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
      minHeight: '100vh'
    }}>
      {/* Header Section */}
      <div style={{
        padding: '32px',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
          <Button
    onClick={() => window.history.back()}
    startIcon={<ArrowLeft size={20} />}
    sx={{
      position: "absolute",
      top: 36,
      left: 36,
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
        <div className="relative top-6 left-6 z-50 text-white">
     
      </div>
        <h1 style={{
          color: '#f1f5f9',
          fontSize: '2.5rem',
          fontWeight: '700',
          letterSpacing: '-0.5px',
          marginBottom: '8px',
          margin: 0
        }}>
          Tableau de Bord Analytics
        </h1>
        <p style={{
          color: '#cbd5e1',
          fontSize: '1rem',
          fontWeight: '400',
          margin: 0
        }}>
          Aperçu des performances de votre commerce
        </p>
      </div>

      {/* Stats Cards */}
     <div className="stats-grid" style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '24px',
  marginBottom: '32px'
}}>
        {/* Card 1 - Revenu Total */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.3)';
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.875rem', opacity: '0.9', marginBottom: '8px', margin: 0 }}>Revenu Total</p>
              <p style={{ fontSize: '2.25rem', fontWeight: '700', margin: 0 }}>{totalRevenue.toFixed(2)} DT</p>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '16px',
              borderRadius: '50%',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2 - Articles Vendus */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3)';
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.875rem', opacity: '0.9', marginBottom: '8px', margin: 0 }}>Articles Vendus</p>
              <p style={{ fontSize: '2.25rem', fontWeight: '700', margin: 0 }}>{totalItems}</p>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '16px',
              borderRadius: '50%',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 3 - Produits Actifs */}
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(245, 158, 11, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.3)';
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.875rem', opacity: '0.9', marginBottom: '8px', margin: 0 }}>Produits Actifs</p>
              <p style={{ fontSize: '2.25rem', fontWeight: '700', margin: 0 }}>{salesData.length}</p>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '16px',
              borderRadius: '50%',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
     <div className="charts-grid" style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '24px',
  marginBottom: '24px'
}}>
        {/* Bar Chart - Ventes par produit */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
          transition: 'box-shadow 0.3s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.08)'}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              padding: '12px',
              borderRadius: '12px',
              marginRight: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" fill="none" stroke="#3b82f6" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 style={{ color: '#1e293b', fontSize: '1.25rem', fontWeight: '700', margin: 0, marginBottom: '4px' }}>
                Ventes par Produit
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Quantités vendues</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <defs>
                <linearGradient id="colorSold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="totalSold" fill="url(#colorSold)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart - Revenus quotidiens */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
          transition: 'box-shadow 0.3s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.08)'}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
              padding: '12px',
              borderRadius: '12px',
              marginRight: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" fill="none" stroke="#10b981" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h2 style={{ color: '#1e293b', fontSize: '1.25rem', fontWeight: '700', margin: 0, marginBottom: '4px' }}>
                Revenus Quotidiens
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Évolution sur 7 jours</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
                fill="url(#colorRevenue)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart - Répartition des revenus */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
        transition: 'box-shadow 0.3s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.08)'}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            padding: '12px',
            borderRadius: '12px',
            marginRight: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="24" height="24" fill="none" stroke="#f59e0b" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <div>
            <h2 style={{ color: '#1e293b', fontSize: '1.25rem', fontWeight: '700', margin: 0, marginBottom: '4px' }}>
              Répartition des Revenus
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Par produit</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={salesData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="totalRevenue"
            >
              {salesData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry) => `${entry.payload.name} (${entry.payload.totalRevenue} DT)`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
    </div>
  );
}