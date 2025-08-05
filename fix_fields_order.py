import re

# Leggi il file
with open('src/frontend/src/components/ShareDialog.js', 'r') as f:
    content = f.read()

# Trova e sostituisci la sezione dei TextField
# Cerca il pattern che inizia con "Nome destinatario" e finisce prima di "Anteprima messaggio"
old_fields = r'          {/\* Messaggio personalizzato \*/}.*?sx=\{\{ mb: 3 \}\}\s*\/>'

new_fields = '''          {/* Nome destinatario */}
          <TextField
            fullWidth
            label="Nome destinatario (opzionale)"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="es. Mario Rossi"
            margin="normal"
            sx={{ mb: 2 }}
          />

          {/* Messaggio personalizzato */}
          <TextField
            fullWidth
            label="Messaggio personalizzato (opzionale)"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder={defaultMessage}
            multiline
            rows={2}
            margin="normal"
            sx={{ mb: 3 }}
          />'''

content = re.sub(old_fields, new_fields, content, flags=re.DOTALL)

# Scrivi il file
with open('src/frontend/src/components/ShareDialog.js', 'w') as f:
    f.write(content)

print("Ordine campi sistemato!")
