import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { ArrowLeft } from 'lucide-react';
import cafeApi from "../../api/cafeApiInstance";
import { Box, Button } from '@mui/material';

export default function AdminCharts() {
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
  
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(30, 41, 59, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
        }}>
          <p style={{ fontWeight: '600', color: '#f1f5f9', marginBottom: '4px', fontSize: '14px', margin: 0 }}>{label}</p>
          <p style={{ color: '#3b82f6', fontWeight: '700', fontSize: '16px', margin: 0 }}>
            {payload[0].value} {payload[0].dataKey === 'revenue' ? 'TND' : 'units'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      padding: '24px'
    }}>
      {/* Header Section */}
      <div style={{
        position: 'relative',
        padding: '32px',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Button
          onClick={() => window.history.back()}
          startIcon={<ArrowLeft size={20} />}
          sx={{
            position: "absolute",
            top: 32,
            left: 32,
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            color: "white",
            borderRadius: "50px",
            px: 2.5,
            py: 1,
            textTransform: "none",
            fontSize: '14px',
            fontWeight: 500,
            transition: "all 0.3s",
            border: '1px solid rgba(255, 255, 255, 0.1)',
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              transform: "translateX(-4px)",
              border: '1px solid rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          <Box component="span">Back</Box>
        </Button>
        
        <div style={{ marginTop: '48px' }}>
          <h1 style={{
            color: '#f1f5f9',
            fontSize: '2.5rem',
            fontWeight: '700',
            letterSpacing: '-0.5px',
            marginBottom: '8px',
            margin: 0
          }}>
            Analytics Dashboard
          </h1>
          <p style={{
            color: '#94a3b8',
            fontSize: '1rem',
            fontWeight: '400',
            margin: 0
          }}>
            Overview of your café's performance & insights
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Card 1 - Total Revenue */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          borderRadius: '20px',
          padding: '28px',
          color: 'white',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 16px 48px rgba(59, 130, 246, 0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.25)';
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '200px',
            height: '200px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '50%'
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div>
              <p style={{ fontSize: '0.875rem', opacity: '0.85', marginBottom: '12px', margin: 0, fontWeight: 500 }}>Total Revenue</p>
              <p style={{ fontSize: '2.5rem', fontWeight: '700', margin: 0, letterSpacing: '-0.5px' }}>{totalRevenue.toFixed(2)}</p>
              <p style={{ fontSize: '1rem', opacity: '0.85', marginTop: '4px', margin: 0 }}>TND</p>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2 - Items Sold */}
        <div style={{
          background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
          borderRadius: '20px',
          padding: '28px',
          color: 'white',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 16px 48px rgba(16, 185, 129, 0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.25)';
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '200px',
            height: '200px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '50%'
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div>
              <p style={{ fontSize: '0.875rem', opacity: '0.85', marginBottom: '12px', margin: 0, fontWeight: 500 }}>Items Sold</p>
              <p style={{ fontSize: '2.5rem', fontWeight: '700', margin: 0, letterSpacing: '-0.5px' }}>{totalItems}</p>
              <p style={{ fontSize: '1rem', opacity: '0.85', marginTop: '4px', margin: 0 }}>Units</p>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 3 - Active Products */}
        <div style={{
          background: 'linear-gradient(135deg, #7c2d12 0%, #f59e0b 100%)',
          borderRadius: '20px',
          padding: '28px',
          color: 'white',
          boxShadow: '0 8px 32px rgba(245, 158, 11, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 16px 48px rgba(245, 158, 11, 0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(245, 158, 11, 0.25)';
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '200px',
            height: '200px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '50%'
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div>
              <p style={{ fontSize: '0.875rem', opacity: '0.85', marginBottom: '12px', margin: 0, fontWeight: 500 }}>Active Products</p>
              <p style={{ fontSize: '2.5rem', fontWeight: '700', margin: 0, letterSpacing: '-0.5px' }}>{salesData.length}</p>
              <p style={{ fontSize: '1rem', opacity: '0.85', marginTop: '4px', margin: 0 }}>Products</p>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* Bar Chart - Sales by Product */}
        <div style={{
          background: '#1e293b',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
          e.currentTarget.style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.3)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              padding: '14px',
              borderRadius: '14px',
              marginRight: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <svg width="22" height="22" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 style={{ color: '#f1f5f9', fontSize: '1.25rem', fontWeight: '700', margin: 0, marginBottom: '4px' }}>
                Sales by Product
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Quantities sold</p>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="totalSold" fill="url(#colorSold)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart - Daily Revenue */}
        <div style={{
          background: '#1e293b',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
          e.currentTarget.style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.3)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '14px',
              borderRadius: '14px',
              marginRight: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <svg width="22" height="22" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h2 style={{ color: '#f1f5f9', fontSize: '1.25rem', fontWeight: '700', margin: 0, marginBottom: '4px' }}>
                Daily Revenue
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>7-day trend</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
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

      {/* Pie Chart - Revenue Distribution */}
      <div style={{
        background: '#1e293b',
        borderRadius: '20px',
        padding: '28px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.3)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            padding: '14px',
            borderRadius: '14px',
            marginRight: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <svg width="22" height="22" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <div>
            <h2 style={{ color: '#f1f5f9', fontSize: '1.25rem', fontWeight: '700', margin: 0, marginBottom: '4px' }}>
              Revenue Distribution
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>By product</p>
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
              wrapperStyle={{ color: '#94a3b8' }}
              formatter={(value, entry) => (
                <span style={{ color: '#94a3b8' }}>
                  {entry.payload.name} ({entry?.payload?.totalRevenue?.toFixed(2)} TND)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}