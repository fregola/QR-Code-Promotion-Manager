# Leggi il file
with open('src/frontend/src/components/ShareDialog.js', 'r') as f:
    content = f.read()

# 1. Rimuovi import di Facebook, Twitter, LinkedIn
content = content.replace("  Facebook as FacebookIcon,", "")
content = content.replace("  Twitter as TwitterIcon,", "")  
content = content.replace("  LinkedIn as LinkedInIcon,", "")

print("Modifiche applicate!")
