import re

# Leggi il file
with open('src/frontend/src/components/ShareDialog.js', 'r') as f:
    content = f.read()

# Sostituisci useEffect esistente
old_useeffect = r'// Carica la cronologia delle condivisioni dal localStorage\s*useEffect\(\(\) => \{[^}]+\}\);[^}]+\}, \[qrCode\?\.\code\]\);'

new_useeffect = '''// Carica la cronologia delle condivisioni dalle API
  useEffect(() => {
    const loadShareHistory = async () => {
      if (!qrCode?.code || !token) return;
      
      try {
        const response = await fetch(`/api/qrcodes/${qrCode.code}/shares`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          const formattedHistory = result.data.shares.map(share => ({
            id: share._id,
            platform: share.platform,
            message: share.message,
            recipient: share.recipient,
            timestamp: new Date(share.timestamp).toLocaleString('it-IT'),
            url: `${window.location.origin}/qrcode/${qrCode.code}`
          }));
          setShareHistory(formattedHistory);
        } else {
          // Fallback a localStorage se API fallisce
          const savedHistory = localStorage.getItem(`share_history_${qrCode.code}`);
          if (savedHistory) {
            setShareHistory(JSON.parse(savedHistory));
          }
        }
      } catch (error) {
        console.error('Errore nel caricare cronologia:', error);
        // Fallback a localStorage
        const savedHistory = localStorage.getItem(`share_history_${qrCode.code}`);
        if (savedHistory) {
          setShareHistory(JSON.parse(savedHistory));
        }
      }
    };

    loadShareHistory();
  }, [qrCode?.code, token]);'''

# Cerca il pattern più semplice
pattern1 = r'// Carica la cronologia delle condivisioni dal localStorage.*?}, \[qrCode\?\.\code\]\);'
content = re.sub(pattern1, new_useeffect, content, flags=re.DOTALL)

# Salva il file
with open('src/frontend/src/components/ShareDialog.js', 'w') as f:
    f.write(content)

print("useEffect aggiornato!")
