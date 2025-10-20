# Deployment Handleiding - Jacuzzi Scanner App

Deze app is nu een **Progressive Web App (PWA)** die geïnstalleerd kan worden als een echte app op mobiel en desktop!

## 📱 Wat is een PWA?

Een Progressive Web App kan:
- Geïnstalleerd worden op mobiel (iOS/Android) en desktop
- Offline werken
- Toegang krijgen tot camera en andere hardware
- Werken zonder App Store of Google Play
- Automatisch updaten

---

## 🚀 Deployment Opties

### **Optie 1: Netlify (Aanbevolen - Gratis & Makkelijk)**

1. **Maak een Netlify account**: [https://www.netlify.com](https://www.netlify.com)

2. **Deploy via Git**:
   - Klik op "Add new site" → "Import an existing project"
   - Verbind met GitHub/GitLab
   - Selecteer deze repository
   - Build settings:
     - Build command: (leeg laten)
     - Publish directory: `.`
   - Click "Deploy"

3. **Of deploy via Drag & Drop**:
   - Ga naar [https://app.netlify.com/drop](https://app.netlify.com/drop)
   - Sleep alle bestanden (index.html, app.js, styles.css, etc.) naar de drop zone
   - Klaar! Je krijgt direct een URL

4. **Custom domein** (optioneel):
   - Ga naar Site settings → Domain management
   - Voeg je eigen domein toe

**Resultaat**: `https://jouw-app-naam.netlify.app`

---

### **Optie 2: Vercel (Ook gratis & snel)**

1. **Maak een Vercel account**: [https://vercel.com](https://vercel.com)

2. **Deploy via CLI**:
   ```bash
   npm i -g vercel
   cd /pad/naar/project
   vercel
   ```

3. **Of via Web Interface**:
   - Klik op "Add New Project"
   - Import je Git repository
   - Deploy

**Resultaat**: `https://jouw-app-naam.vercel.app`

---

### **Optie 3: GitHub Pages (Gratis)**

1. **Push code naar GitHub** (al gedaan!)

2. **Enable GitHub Pages**:
   - Ga naar repository Settings
   - Scroll naar "Pages"
   - Source: selecteer je branch
   - Folder: `/ (root)`
   - Save

3. **Wacht 2-3 minuten**

**Resultaat**: `https://jouw-gebruikersnaam.github.io/repository-naam`

---

### **Optie 4: Firebase Hosting (Google)**

1. **Installeer Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialiseer Firebase**:
   ```bash
   cd /pad/naar/project
   firebase init hosting
   ```
   - Selecteer een Firebase project of maak een nieuwe
   - Public directory: `.` (current directory)
   - Single-page app: No
   - Automatic builds with GitHub: Optional

3. **Deploy**:
   ```bash
   firebase deploy
   ```

**Resultaat**: `https://jouw-project.web.app`

---

### **Optie 5: Eigen Server/VPS**

Upload alle bestanden naar je web server:

```bash
# Via SCP
scp -r * user@jouw-server.com:/var/www/html/jacuzzi-scanner/

# Of via FTP/SFTP met FileZilla, Cyberduck, etc.
```

**Vereisten**:
- HTTPS (verplicht voor camera toegang!)
- Nginx/Apache configuratie

---

## 🔒 HTTPS Vereiste

**BELANGRIJK**: De camera API werkt ALLEEN via:
- HTTPS (beveiligde verbinding)
- localhost (alleen voor testen)

Alle bovenstaande deployment opties bieden automatisch HTTPS.

---

## 📲 App Installeren na Deployment

### **Op Android (Chrome)**:
1. Open de gedeployde URL in Chrome
2. Klik op menu (⋮) → "Add to Home screen"
3. De app verschijnt op je home screen als een echte app!

### **Op iOS (Safari)**:
1. Open de URL in Safari
2. Klik op het "Share" icoon
3. Scroll en klik op "Add to Home Screen"
4. Geef de app een naam en klik "Add"

### **Op Desktop (Chrome/Edge)**:
1. Open de URL
2. Kijk naar de adresbalk voor het installatie icoon (+)
3. Klik erop en klik "Install"
4. De app opent in een eigen venster!

---

## 🎨 App Iconen Genereren

Voor je de app deploy, genereer eerst de iconen:

1. Open `generate-icons.html` in een browser
2. Klik op beide knoppen om de iconen te downloaden
3. Plaats `icon-192.png` en `icon-512.png` in de root directory

**Of gebruik een online tool**:
- [https://www.pwabuilder.com/imageGenerator](https://www.pwabuilder.com/imageGenerator)
- Upload een logo en download alle maten

---

## 🔧 Na Deployment Checken

Test of alles werkt:

1. **PWA Status checken**:
   - Open Chrome DevTools (F12)
   - Ga naar "Application" tab
   - Check "Manifest" - moet groen vinkje hebben
   - Check "Service Workers" - moet "activated and running" zijn

2. **Camera test**:
   - Klik op "Start Camera"
   - Geef toestemming voor camera toegang
   - Test of de camera werkt

3. **Installatie test**:
   - Kijk of het "installatie" icoon verschijnt in de browser
   - Probeer de app te installeren

4. **Lighthouse Score** (optioneel):
   - DevTools → Lighthouse tab
   - Run test voor "Progressive Web App"
   - Score moet 90+ zijn

---

## 📊 Aanbevolen Deployment

Voor de meeste use cases:

**1. Snelle test**: Netlify Drop (drag & drop)
**2. Productie**: Netlify of Vercel met Git integratie
**3. Eigen domein**: Netlify/Vercel + custom domain
**4. Bedrijfsomgeving**: Firebase of eigen VPS met HTTPS

---

## 🆘 Troubleshooting

### Camera werkt niet
- ✅ Check of je HTTPS gebruikt (niet HTTP!)
- ✅ Check browser permissions
- ✅ Test eerst op localhost

### App installeert niet
- ✅ Check of manifest.json correct geladen wordt
- ✅ Check of iconen bestaan (192x192 en 512x512)
- ✅ Check Service Worker in DevTools

### OCR is traag
- Dit is normaal - OCR duurt 5-15 seconden
- Tesseract.js download ~4MB bij eerste gebruik
- Daarna wordt het gecached

---

## 🎯 Volgende Stappen

Na deployment kun je overwegen:
1. Custom domein instellen
2. Analytics toevoegen (Google Analytics, Plausible)
3. Backend API voor data opslag
4. Push notifications toevoegen
5. Meer OCR talen toevoegen

---

## 📝 Checklist voor Deployment

- [ ] Iconen gegenereerd (192x192, 512x512)
- [ ] Deployment platform gekozen
- [ ] Code gepusht naar Git (indien nodig)
- [ ] App gedeployed
- [ ] HTTPS werkt
- [ ] Camera toegang werkt
- [ ] PWA installeert correct
- [ ] Getest op mobiel en desktop
- [ ] Service Worker actief
- [ ] OCR functionaliteit werkt

---

Veel succes met je deployment! 🎉
