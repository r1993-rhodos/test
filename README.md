# Jacuzzi Serienummer Scanner

Een web applicatie om met OCR jacuzzi serienummers te scannen via de camera.

## Functionaliteiten

- Camera toegang om foto's te maken van serienummers
- Automatische OCR (Optical Character Recognition) om serienummers uit foto's te halen
- Invoervelden voor serienummer en klantnummer
- Lokale opslag van ingevoerde gegevens

## Gebruik

### Lokaal testen

1. Open `index.html` in een moderne webbrowser
2. Voor camera toegang moet je de pagina via HTTPS of localhost openen

#### Optie 1: Python HTTP Server (aanbevolen voor lokaal testen)

```bash
# Python 3
python3 -m http.server 8000

# Of Python 2
python -m SimpleHTTPServer 8000
```

Open daarna http://localhost:8000 in je browser.

#### Optie 2: Node.js HTTP Server

```bash
npx http-server -p 8000
```

### Stappen in de app

1. Klik op "Start Camera" om de camera te openen
2. Richt de camera op het serienummer
3. Klik op "Maak Foto" om een foto te maken
4. De OCR analyseert automatisch de foto en vult het serienummer in
5. Voer het klantnummer handmatig in
6. Klik op "Opslaan" om de gegevens op te slaan

## Technische Details

### Technologieën

- **HTML5**: Structuur en Camera API
- **CSS3**: Styling en responsive design
- **JavaScript**: Applicatie logica
- **Tesseract.js**: OCR functionaliteit (Nederlandse taalondersteuning)

### Browser Vereisten

- Moderne browser met camera ondersteuning (Chrome, Firefox, Safari, Edge)
- HTTPS of localhost voor camera toegang
- JavaScript moet ingeschakeld zijn

### Data Opslag

Gegevens worden opgeslagen in:
- `localStorage` van de browser voor persistentie
- Console logging voor debugging

Voor productie gebruik zou je dit kunnen uitbreiden met:
- Backend API om data naar een server te sturen
- Database opslag
- Gebruikers authenticatie

## Bestandsstructuur

```
.
├── index.html      # Hoofd HTML bestand met UI
├── app.js          # JavaScript logica en OCR functionaliteit
├── styles.css      # Styling en responsive design
└── README.md       # Deze documentatie
```

## Mobiel Gebruik

De applicatie is volledig responsive en werkt uitstekend op mobiele apparaten. Op mobiel wordt automatisch de achtercamera gebruikt voor betere scan kwaliteit.

## OCR Nauwkeurigheid

De OCR kwaliteit hangt af van:
- Lichtomstandigheden
- Kwaliteit van de camera
- Duidelijkheid van het serienummer
- Achtergrond contrast

**Tips voor betere resultaten:**
- Zorg voor goede verlichting
- Houd de camera stil tijdens het fotograferen
- Zorg dat het serienummer scherp in beeld is
- Probeer een effen achtergrond

## Licentie

Dit project is gemaakt voor intern gebruik.
