import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import cafeApi from '../../api/cafeApiInstance';

export default function QRCodesDashboard() {
  const [tables, setTables] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    cafeApi.get(`/getQRCodes`,)
    .then(res => {setTables(res.data);console.log(res.data)})
    .catch(err => console.error(err));
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      console.log('🔄 Début du téléchargement...');

      const response = await cafeApi.get(
         `/downloadQRCodesPDF`,
         {
           headers: {
             'Accept': 'application/pdf',
           }

         });

      // Vérifier que c'est bien un PDF
      if (!response.data.type.includes('pdf') && response.data.type !== 'application/octet-stream') {
        throw new Error('Le fichier reçu n\'est pas un PDF');
      }

      // Créer le blob avec le bon type MIME
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Créer et cliquer sur le lien de téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = `Cafe_${"20"}_QRCodes.pdf`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Nettoyage après un court délai
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

    } catch (error) {
      let errorMessage = 'Erreur lors du téléchargement du PDF';

      if (error.response) {
        errorMessage = `Erreur serveur: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Pas de réponse du serveur. Vérifiez votre connexion.';
      } else if (error.message.includes('Could not establish connection')) {
        errorMessage = 'Une extension de navigateur bloque le téléchargement. Essayez en navigation privée.';
      } else {
        errorMessage = error.message;
      }
      console.log(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8">QR Codes for Tables</h1>
      
      {/* Fixed header with back button and download button */}
      <div className="fixed top-6 left-6 right-6 z-50 flex justify-between items-center">
        <button 
          onClick={() => window.history.back()} 
          className="glass px-4 py-2 rounded-full flex items-center gap-2 hover:scale-105 transition bg-white shadow-md"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Back</span>
        </button>

        <button
          onClick={handleDownload}
          disabled={tables.length === 0 || isDownloading}
          className={`px-6 py-3 rounded-full transition flex items-center gap-2 shadow-md
            ${tables.length === 0 || isDownloading
              ? 'bg-gray-400 cursor-not-allowed text-gray-200'
              : 'bg-black text-white hover:bg-gray-800'}
          `}
        >
          {isDownloading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Downloading...</span>
            </>
          ) : (
            <span>Download PDF</span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-16">
        {tables.length !== 0 && tables.map((t) => (
          <div
            key={t.id}
            className="bg-white p-4 rounded-2xl shadow-md text-center border hover:shadow-lg transition"
          >
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?data=${t.qrCodeURL}&size=400x400`}  
              alt={`QR Table ${t.number}`} 
              className="mx-auto mb-3 w-[400px] h-[400px]" 
            />
            <p className="font-bold text-lg">Table {t.number}</p>
            <p className="font-bold text-lg">URl: {t.qrCodeURL}</p>
          </div>
        ))}
      </div>
    </div>
  );
}