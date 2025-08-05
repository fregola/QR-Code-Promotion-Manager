import re

# Leggi il file
with open('src/frontend/src/components/ShareDialog.js', 'r') as f:
    content = f.read()

# 1. Rimuovi le funzioni handleFacebookShare, handleTwitterShare, handleLinkedInShare
content = re.sub(r'  const handleFacebookShare = \(\) => \{[^}]+\n  \};', '', content, flags=re.DOTALL)
content = re.sub(r'  const handleTwitterShare = \(\) => \{[^}]+\n  \};', '', content, flags=re.DOTALL)  
content = re.sub(r'  const handleLinkedInShare = \(\) => \{[^}]+\n  \};', '', content, flags=re.DOTALL)

# 2. Sostituisci l'array shareOptions
old_pattern = r'  const shareOptions = \[[^\]]+\];'
new_options = '''  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: <WhatsAppIcon sx={{ fontSize: 40, color: '#25D366' }} />,
      onClick: handleWhatsAppShare,
      description: 'Condividi su WhatsApp'
    },
    {
      name: 'Telegram',
      icon: <TelegramIcon sx={{ fontSize: 40, color: '#0088cc' }} />,
      onClick: handleTelegramShare,
      description: 'Condividi su Telegram'
    },
    {
      name: 'SMS',
      icon: <Box sx={{ fontSize: 40, fontWeight: 'bold', color: '#4CAF50', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40 }}>SMS</Box>,
      onClick: handleSmsShare,
      description: 'Condividi via SMS'
    },
    {
      name: 'Email',
      icon: <EmailIcon sx={{ fontSize: 40, color: '#FF5722' }} />,
      onClick: handleEmailShare,
      description: 'Condividi via Email'
    },
    {
      name: 'Copia Link',
      icon: <ContentCopyIcon sx={{ fontSize: 40, color: '#9C27B0' }} />,
      onClick: handleCopyLink,
      description: 'Copia link negli appunti'
    }
  ];'''

content = re.sub(old_pattern, new_options, content, flags=re.DOTALL)

# Scrivi il file
with open('src/frontend/src/components/ShareDialog.js', 'w') as f:
    f.write(content)

print("Modifiche complete applicate!")
