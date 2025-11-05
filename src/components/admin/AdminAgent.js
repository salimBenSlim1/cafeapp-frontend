import { useState,useEffect } from "react";
import axios from 'axios'
import { ArrowLeft } from 'lucide-react'; // or your icon libraryRéessayerClaude n'a pas encore la capacité d'exécuter le code qu'il génère.
import cafeApi from "../../api/cafeApiInstance";
import {
  Box,
  Button,
} from '@mui/material';
// Helper function to safely access nested properties
const safeGet = (obj, path, defaultValue = null) => {
  try {
    return path.split('.').reduce((acc, part) => acc?.[part], obj) ?? defaultValue;
  } catch {
    return defaultValue;
  }
};

export default function AdminAgent() {
  const [insights, setInsights] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [canRequest, setCanRequest] = useState(true);
  const [nextRequestDate, setNextRequestDate] = useState(null);
  const [typingText, setTypingText] = useState("");
  const [error, setError] = useState(null);

  // Uncomment if you want to restore the weekly limit feature
  /*
  useEffect(() => {
    checkRequestAvailability();
  }, []);

  const checkRequestAvailability = () => {
    const lastRequest = sessionStorage.getItem("lastAIRequest");
    if (lastRequest) {
      const lastDate = new Date(lastRequest);
      const now = new Date();
      const weekInMs = 7 * 24 * 60 * 60 * 1000;
      const timeDiff = now - lastDate;
      
      if (timeDiff < weekInMs) {
        setCanRequest(false);
        const nextDate = new Date(lastDate.getTime() + weekInMs);
        setNextRequestDate(nextDate);
      }
    }
  };
  */

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await cafeApi.get("/getInsights");
      setInsights(res.data);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des données");
    }
    setLoading(false);
  };

  const analyzeWithAI = async () => {
    if (!insights || !canRequest) return;
    
    setAnalyzing(true);
    setAiAnalysis("");
    setTypingText("");
    setError(null);

    try {
      // Safe data extraction
      const topProducts = (insights.topSelling || []).map(i => ({
        nom: safeGet(i, 'Item.name', 'N/A'),
        quantité: safeGet(i, 'totalSold', 0),
        revenu: safeGet(i, 'totalRevenue', 0)
      }));

      const revenue = (insights.dailyRevenue || []).slice(0, 7).map(d => ({
        jour: safeGet(d, 'day', 'N/A'),
        revenu: safeGet(d, 'totalRevenue', 0)
      }));

      const busyHours = (insights.busyHours || []).map(h => ({
        heure: `${safeGet(h, 'hour', 0)}h`,
        commandes: safeGet(h, 'ordersCount', 0)
      }));

      const avgOrder = safeGet(insights, 'avgOrder.averageOrder', 0);

      const topTables = (insights.revenueByTable || []).slice(0, 5).map(t => ({
        table: safeGet(t, 'number', 'Non définie'),
        revenu: safeGet(t, 'totalRevenue', 0)
      }));

      const prompt = `
Kima khabir fi analyse ta3 données commerciales mta3 café/restaurant, 3mel analyse 3la données hedhi w 3tini recommandations stratégiques mta3ha b derja tounsya:

📊 DONNÉES:
- Top Produits Eli tbe3ou: ${JSON.stringify(topProducts)}
- Revenus quotidiens (7 jours li fetou): ${JSON.stringify(revenue)}
- Saa3 li fiha druk: ${JSON.stringify(busyHours)}
- Valeur moyenne ta3 commande: ${avgOrder} DT
- Top Tables (revenu): ${JSON.stringify(topTables)}

📝 FOURNIS:
1. 🎯 Analyse générale (3-4 lignes)
2. 💡 3 recommandations stratégiques concrètes
3. ⚠️ Points li lazem tkoun 3alihom 3in
4. 🚀 Forsa ta3 croissance

Koun mdefini, 3tini actions li njmo na3mlouhom w koun professionnel.

`;

      // Using OpenRouter API - consider moving API key to environment variables
      const GROQ_API_KEY = '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';

       const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile", // Fast and free
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        timeout: 30000
      }
    );

      // Axios automatically handles response status, so no need for response.ok check
      const data = response.data;
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Format de réponse invalide de l\'API');
      }

      const fullText = data.choices[0].message.content;
      
      // Typing animation effect
      let index = 0;
      const typingInterval = setInterval(() => {
        if (index < fullText.length) {
          setTypingText(fullText.substring(0, index + 1));
          index++;
        } else {
          clearInterval(typingInterval);
          setAiAnalysis(fullText);
          // Uncomment if you want to restore the weekly limit feature
          // sessionStorage.setItem("lastAIRequest", new Date().toISOString());
          // setCanRequest(false);
          // const nextDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          // setNextRequestDate(nextDate);
        }
      }, 15);

    } catch (err) {
      console.error("Erreur analyse AI:", err);
      const errorMessage = err.response?.data?.error?.message || err.message || "Erreur lors de l'analyse AI";
      setError(errorMessage);
      setAiAnalysis(`❌ Erreur lors de l'analyse: ${errorMessage}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // ... rest of your render functions remain the same
  const renderTopSelling = () => {
    if (!insights?.topSelling || insights.topSelling.length === 0) {
      return <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aucune donnée disponible</p>;
    }

    return insights.topSelling.map((item, i) => (
      <div key={i} style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px',
        background: i % 2 === 0 ? '#f8fafc' : 'white',
        borderRadius: '8px',
        marginBottom: '8px'
      }}>
        <span style={{ fontWeight: '600', color: '#334155' }}>
          {safeGet(item, 'Item.name', 'Produit inconnu')}
        </span>
        <span style={{ color: '#10b981', fontWeight: '700' }}>
          {safeGet(item, 'totalSold', 0)} unités • {parseFloat(safeGet(item, 'totalRevenue', 0)).toFixed(2)} DT
        </span>
      </div>
    ));
  };

  const renderBusyHours = () => {
    if (!insights?.busyHours || insights.busyHours.length === 0) {
      return <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aucune donnée disponible</p>;
    }

    return insights.busyHours.map((hour, i) => (
      <div key={i} style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px',
        background: i % 2 === 0 ? '#f8fafc' : 'white',
        borderRadius: '8px',
        marginBottom: '8px'
      }}>
        <span style={{ fontWeight: '600', color: '#334155' }}>
          {safeGet(hour, 'hour', 0)}h00
        </span>
        <span style={{ color: '#3b82f6', fontWeight: '700' }}>
          {safeGet(hour, 'ordersCount', 0)} commandes
        </span>
      </div>
    ));
  };

  const renderTopTables = () => {
    if (!insights?.revenueByTable || insights.revenueByTable.length === 0) {
      return <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aucune donnée disponible</p>;
    }

    return insights.revenueByTable.slice(0, 5).map((table, i) => {
      const tableId = safeGet(table, 'Table.number', null);
      return (
        <div key={i} style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px',
          background: i % 2 === 0 ? '#f8fafc' : 'white',
          borderRadius: '8px',
          marginBottom: '8px'
        }}>
          <span style={{ fontWeight: '600', color: '#334155' }}>
            {tableId ? `Table ${tableId}` : 'Table non définie'}
          </span>
          <span style={{ color: '#f59e0b', fontWeight: '700' }}>
            {parseFloat(safeGet(table, 'totalRevenue', 0)).toFixed(2)} DT
          </span>
        </div>
      );
    });
  };

  // ... rest of your JSX return remains the same
  return (
    <div style={{
      padding: '32px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
      minHeight: '100vh'
    }}>
       {/* Header */}
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
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            padding: '12px',
            borderRadius: '12px',
            marginRight: '16px'
          }}>
            <svg width="32" height="32" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h1 style={{
              color: '#f1f5f9',
              fontSize: '2.5rem',
              fontWeight: '700',
              letterSpacing: '-0.5px',
              margin: 0,
              marginBottom: '4px'
            }}>
              AI Business Insights Agent
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '1rem', margin: 0 }}>
              Analyse intelligente de vos données commerciales
            </p>
          </div>
        </div>
        
        {!canRequest && nextRequestDate && (
          <div style={{
            background: 'rgba(251, 191, 36, 0.15)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <svg width="24" height="24" fill="none" stroke="#fbbf24" viewBox="0 0 24 24" strokeWidth="2" style={{ marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span style={{ color: '#fbbf24', fontWeight: '600' }}>
              Prochaine analyse disponible le: {nextRequestDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <svg width="24" height="24" fill="none" stroke="#ef4444" viewBox="0 0 24 24" strokeWidth="2" style={{ marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span style={{ color: '#ef4444', fontWeight: '600' }}>{error}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <button
          onClick={fetchInsights}
          disabled={loading}
          style={{
            background: loading ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            padding: '20px',
            fontSize: '1.125rem',
            fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 24px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(59, 130, 246, 0.3)';
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '24px',
                height: '24px',
                border: '3px solid rgba(255,255,255,0.3)',
                borderTop: '3px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Chargement...
            </>
          ) : (
            <>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Charger les Données
            </>
          )}
        </button>

        <button
          onClick={analyzeWithAI}
          disabled={!insights || analyzing || !canRequest}
          style={{
            background: (!insights || analyzing || !canRequest) ? '#94a3b8' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            padding: '20px',
            fontSize: '1.125rem',
            fontWeight: '700',
            cursor: (!insights || analyzing || !canRequest) ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 24px rgba(139, 92, 246, 0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
          onMouseEnter={(e) => {
            if (insights && !analyzing && canRequest) {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(139, 92, 246, 0.3)';
          }}
        >
          {analyzing ? (
            <>
              <div style={{
                width: '24px',
                height: '24px',
                border: '3px solid rgba(255,255,255,0.3)',
                borderTop: '3px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Analyse en cours...
            </>
          ) : (
            <>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {!canRequest ? "Analyse Utilisée (1/semaine)" : "🤖 Analyser avec AI"}
            </>
          )}
        </button>
      </div>

      {/* AI Analysis Section */}
      {(analyzing || aiAnalysis || typingText) && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
          border: '2px solid #8b5cf6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
              padding: '12px',
              borderRadius: '12px',
              marginRight: '16px'
            }}>
              <svg width="28" height="28" fill="none" stroke="#8b5cf6" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 style={{ color: '#1e293b', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
              💡 Analyse & Recommandations AI
            </h2>
          </div>

          <div style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '24px',
            fontSize: '1rem',
            lineHeight: '1.8',
            color: '#1e293b',
            whiteSpace: 'pre-wrap',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            minHeight: '200px'
          }}>
            {typingText || aiAnalysis || "En attente de l'analyse..."}
            {analyzing && !typingText && (
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '20px',
                background: '#8b5cf6',
                marginLeft: '4px',
                animation: 'blink 1s infinite'
              }} />
            )}
          </div>
        </div>
      )}

      {/* Data Display */}
      {insights && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: '24px'
        }}>
          {/* Top Selling */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)'
          }}>
            <h3 style={{ color: '#1e293b', fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px' }}>🏆</span> Top 5 Produits
            </h3>
            {renderTopSelling()}
          </div>

          {/* Busy Hours */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)'
          }}>
            <h3 style={{ color: '#1e293b', fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px' }}>⏰</span> Heures de Pointe
            </h3>
            {renderBusyHours()}
          </div>

          {/* Average Order */}
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 24px rgba(16, 185, 129, 0.3)',
            color: 'white'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '12px', opacity: 0.9, margin: 0 }}>
              💰 Valeur Moyenne Commande
            </h3>
            <p style={{ fontSize: '3rem', fontWeight: '700', margin: 0 }}>
              {parseFloat(safeGet(insights, 'avgOrder.averageOrder', 0)).toFixed(2)} DT
            </p>
          </div>

          {/* Top Tables */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)'
          }}>
            <h3 style={{ color: '#1e293b', fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px' }}>📍</span> Top Tables (Revenu)
            </h3>
            {renderTopTables()}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}