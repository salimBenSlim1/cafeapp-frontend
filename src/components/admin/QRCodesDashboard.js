import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function QRCodesDashboard() {
  const [tables, setTables] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/getQRCodes', {
      headers: { "x-api-key": `${localStorage.getItem('token')}` }
    })
    .then(res => {setTables(res.data);console.log(res.data)})
    .catch(err => console.error(err));
  }, []);

  // const handleDownloadPDF = () => {
  //   axios.get("http://localhost:5000/api/downloadQRCodesPDF",{
  //     headers:{'x-api-key':localStorage.getItem('token')}
  //   })
  // };


  const handleDownload = async () => {
  

    try {
      console.log('🔄 Début du téléchargement...');

      const response = await axios({
        url: `http://localhost:5000/api/downloadQRCodesPDF`,
        method: 'GET',
        responseType: 'blob', // CRITIQUE: doit être 'blob'
        timeout: 30000, // 30 secondes timeout
        headers: {
          'Accept': 'application/pdf',
          "x-api-key":localStorage.getItem('token')
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
        // Erreur du serveur
      
        errorMessage = `Erreur serveur: ${error.response.status}`;
      } else if (error.request) {
        // Pas de réponse du serveur
        errorMessage = 'Pas de réponse du serveur. Vérifiez votre connexion.';
      } else if (error.message.includes('Could not establish connection')) {
        // Extension de navigateur qui bloque
        errorMessage = 'Une extension de navigateur bloque le téléchargement. Essayez en navigation privée.';
      } else {
        errorMessage = error.message;
      }
      console.log(errorMessage)

        }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8">QR Codes des Tables</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {tables.length!==0?tables.map((t) => (
          <div
            key={t.id}
            className="bg-white p-4 rounded-2xl shadow-md text-center border hover:shadow-lg transition"
          >
            <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${t.qrCodeURL}&size=400x400`}  alt={`QR Table ${t.number}`} className="mx-auto mb-3 w-[400px] h-[400px]" />
            <p className="font-bold text-lg">Table {t.number}</p>
            <p className="font-bold text-lg">URl: {t.qrCodeURL}</p>
          </div>
        )):(
          <div>
            contactez l'administration pour génerer les qrCodes
            Email:salimbenslim09@gmail.com

          </div>
        )}
      </div>

      <div className="text-center mt-8">
        <button
  onClick={handleDownload}
  disabled={tables.length === 0} // 👈 disable when no tables
  className={`px-6 py-3 rounded-xl transition 
    ${tables.length === 0 
      ? 'bg-gray-400 cursor-not-allowed text-gray-200' // disabled style
      : 'bg-black text-white hover:bg-gray-800'}` // active style
  }
>
  Télécharger PDF
</button>

      </div>
    </div>
  );
}
