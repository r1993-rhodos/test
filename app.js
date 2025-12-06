// ============================================
// Jacuzzi Serienummer Scanner - Geoptimaliseerd
// ============================================

// Service Worker registratie
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('SW registered'))
            .catch(err => console.log('SW registration failed:', err));
    });
}

// ============================================
// DOM Elements
// ============================================
const elements = {
    // Camera
    camera: document.getElementById('camera'),
    canvas: document.getElementById('canvas'),
    cameraOverlay: document.getElementById('cameraOverlay'),
    startCameraBtn: document.getElementById('startCamera'),
    captureBtn: document.getElementById('captureBtn'),
    stopCameraBtn: document.getElementById('stopCamera'),
    switchCameraBtn: document.getElementById('switchCamera'),
    toggleFlashBtn: document.getElementById('toggleFlash'),
    activeCameraControls: document.getElementById('activeCameraControls'),

    // Preview
    preview: document.getElementById('preview'),
    previewSection: document.getElementById('previewSection'),
    retakeBtn: document.getElementById('retakeBtn'),

    // OCR
    ocrProgress: document.getElementById('ocrProgress'),
    ocrStatus: document.getElementById('ocrStatus'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    ocrBadge: document.getElementById('ocrBadge'),

    // Form
    serialNumberInput: document.getElementById('serialNumber'),
    customerNumberInput: document.getElementById('customerNumber'),
    serialHint: document.getElementById('serialHint'),
    clearSerialBtn: document.getElementById('clearSerial'),
    clearCustomerBtn: document.getElementById('clearCustomer'),
    submitBtn: document.getElementById('submitBtn'),

    // Tabs & History
    tabBtns: document.querySelectorAll('.tab-btn'),
    scanTab: document.getElementById('scanTab'),
    historyTab: document.getElementById('historyTab'),
    historyBtn: document.getElementById('historyBtn'),
    historyList: document.getElementById('historyList'),
    exportCSVBtn: document.getElementById('exportCSV'),
    clearHistoryBtn: document.getElementById('clearHistory'),

    // Toast
    toast: document.getElementById('toast')
};

// ============================================
// State Management
// ============================================
let state = {
    stream: null,
    currentFacingMode: 'environment',
    flashEnabled: false,
    flashSupported: false,
    tesseractLoaded: false,
    isProcessing: false
};

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type = 'success') {
    elements.toast.textContent = message;
    elements.toast.className = `toast toast-${type} show`;
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// ============================================
// Tab Navigation
// ============================================
elements.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        switchTab(tabId);
    });
});

elements.historyBtn.addEventListener('click', () => {
    switchTab('history');
});

function switchTab(tabId) {
    elements.tabBtns.forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    elements.scanTab.classList.toggle('active', tabId === 'scan');
    elements.historyTab.classList.toggle('active', tabId === 'history');

    if (tabId === 'history') {
        renderHistory();
    }
}

// ============================================
// Camera Functions
// ============================================
async function startCamera() {
    try {
        const constraints = {
            video: {
                facingMode: state.currentFacingMode,
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                focusMode: 'continuous',
                exposureMode: 'continuous'
            }
        };

        state.stream = await navigator.mediaDevices.getUserMedia(constraints);
        elements.camera.srcObject = state.stream;

        // Check flash ondersteuning
        const track = state.stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.() || {};
        state.flashSupported = capabilities.torch === true;
        elements.toggleFlashBtn.style.display = state.flashSupported ? 'flex' : 'none';

        // UI update
        elements.camera.style.display = 'block';
        elements.cameraOverlay.style.display = 'flex';
        elements.startCameraBtn.style.display = 'none';
        elements.activeCameraControls.style.display = 'flex';
        elements.previewSection.style.display = 'none';

        // Preload Tesseract terwijl gebruiker foto maakt
        preloadTesseract();

    } catch (error) {
        console.error('Camera error:', error);
        showToast('Kon camera niet openen: ' + error.message, 'error');
    }
}

function stopCamera() {
    if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
        state.stream = null;
    }
    elements.camera.style.display = 'none';
    elements.cameraOverlay.style.display = 'none';
    elements.startCameraBtn.style.display = 'flex';
    elements.activeCameraControls.style.display = 'none';
}

async function switchCamera() {
    state.currentFacingMode = state.currentFacingMode === 'environment' ? 'user' : 'environment';
    stopCamera();
    await startCamera();
}

async function toggleFlash() {
    if (!state.flashSupported || !state.stream) return;

    const track = state.stream.getVideoTracks()[0];
    state.flashEnabled = !state.flashEnabled;

    try {
        await track.applyConstraints({
            advanced: [{ torch: state.flashEnabled }]
        });
        elements.toggleFlashBtn.classList.toggle('active', state.flashEnabled);
    } catch (error) {
        console.error('Flash toggle failed:', error);
    }
}

function capturePhoto() {
    const context = elements.canvas.getContext('2d');
    elements.canvas.width = elements.camera.videoWidth;
    elements.canvas.height = elements.camera.videoHeight;
    context.drawImage(elements.camera, 0, 0);

    // Image preprocessing voor betere OCR
    const imageData = preprocessImage(context, elements.canvas.width, elements.canvas.height);
    context.putImageData(imageData, 0, 0);

    const imageDataUrl = elements.canvas.toDataURL('image/png', 0.95);
    elements.preview.src = imageDataUrl;

    stopCamera();
    elements.previewSection.style.display = 'block';

    // Start OCR
    runOCR(imageDataUrl);
}

// ============================================
// Image Preprocessing voor betere OCR
// ============================================
function preprocessImage(context, width, height) {
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Converteer naar grijswaarden en verhoog contrast
    for (let i = 0; i < data.length; i += 4) {
        // Grijswaarde berekenen
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        // Contrast versterking
        const contrast = 1.5;
        const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));
        let newGray = factor * (gray - 128) + 128;

        // Clamp waarden
        newGray = Math.max(0, Math.min(255, newGray));

        // Pas toe op alle kanalen
        data[i] = newGray;
        data[i + 1] = newGray;
        data[i + 2] = newGray;
    }

    // Simpele thresholding voor betere tekstherkenning
    const threshold = calculateOtsuThreshold(data);
    for (let i = 0; i < data.length; i += 4) {
        const val = data[i] > threshold ? 255 : 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
    }

    return imageData;
}

// Otsu's threshold methode voor optimale binarisatie
function calculateOtsuThreshold(data) {
    const histogram = new Array(256).fill(0);
    const total = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
        histogram[data[i]]++;
    }

    let sum = 0;
    for (let i = 0; i < 256; i++) {
        sum += i * histogram[i];
    }

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 0;

    for (let i = 0; i < 256; i++) {
        wB += histogram[i];
        if (wB === 0) continue;

        wF = total - wB;
        if (wF === 0) break;

        sumB += i * histogram[i];
        const mB = sumB / wB;
        const mF = (sum - sumB) / wF;
        const variance = wB * wF * (mB - mF) * (mB - mF);

        if (variance > maxVariance) {
            maxVariance = variance;
            threshold = i;
        }
    }

    return threshold;
}

// ============================================
// OCR Functions
// ============================================
async function preloadTesseract() {
    if (state.tesseractLoaded) return;
    try {
        await window.loadTesseract();
        state.tesseractLoaded = true;
        console.log('Tesseract preloaded');
    } catch (error) {
        console.error('Tesseract preload failed:', error);
    }
}

async function runOCR(imageData) {
    if (state.isProcessing) return;
    state.isProcessing = true;

    elements.ocrProgress.style.display = 'block';
    elements.ocrStatus.textContent = 'OCR library laden...';
    elements.progressBar.style.width = '0%';
    elements.progressText.textContent = '0%';

    try {
        await window.loadTesseract();

        elements.ocrStatus.textContent = 'Tekst herkennen...';

        // Gebruik Engels voor betere serienummer herkenning
        const worker = await Tesseract.createWorker('eng', 1, {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    const progress = Math.round(m.progress * 100);
                    elements.progressBar.style.width = progress + '%';
                    elements.progressText.textContent = progress + '%';
                }
            }
        });

        // Optimaliseer voor alfanumerieke karakters
        await worker.setParameters({
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-/',
            tessedit_pageseg_mode: '7', // Single line mode
        });

        const { data: { text, confidence } } = await worker.recognize(imageData);
        await worker.terminate();

        // Verwerk OCR resultaat
        const processedText = processOCRResult(text);

        if (processedText) {
            elements.serialNumberInput.value = processedText;
            elements.ocrBadge.style.display = 'inline-block';
            elements.serialHint.textContent = `Betrouwbaarheid: ${Math.round(confidence)}%`;
            elements.serialHint.className = 'form-hint ' + (confidence > 70 ? 'hint-success' : 'hint-warning');
            showToast('Serienummer herkend!', 'success');
        } else {
            elements.serialHint.textContent = 'Geen serienummer gevonden. Voer handmatig in.';
            elements.serialHint.className = 'form-hint hint-warning';
            showToast('Geen tekst gevonden', 'warning');
        }

        elements.ocrProgress.style.display = 'none';
        elements.customerNumberInput.focus();

    } catch (error) {
        console.error('OCR Error:', error);
        elements.ocrStatus.textContent = 'OCR mislukt: ' + error.message;
        showToast('OCR mislukt', 'error');
    } finally {
        state.isProcessing = false;
    }
}

// Verbeterde serienummer extractie
function processOCRResult(text) {
    // Cleanup
    let cleaned = text.toUpperCase()
        .replace(/[^A-Z0-9\-\/\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Veelvoorkomende OCR fouten corrigeren
    cleaned = cleaned
        .replace(/O/g, '0')  // O -> 0 in serienummers
        .replace(/I/g, '1')  // I -> 1
        .replace(/L/g, '1')  // L -> 1
        .replace(/S/g, '5')  // S -> 5
        .replace(/B/g, '8')  // B -> 8
        .replace(/G/g, '6'); // G -> 6

    // Patronen voor jacuzzi serienummers
    const patterns = [
        // Typische formaten: ABC123456, 12345ABC, ABC-123-456
        /[A-Z]{2,4}[\-\/]?\d{4,}/g,
        /\d{4,}[\-\/]?[A-Z]{2,4}/g,
        /[A-Z0-9]{8,}/g,
        /\d{6,}/g,
    ];

    for (const pattern of patterns) {
        const matches = cleaned.match(pattern);
        if (matches && matches.length > 0) {
            // Langste match teruggeven
            return matches.sort((a, b) => b.length - a.length)[0];
        }
    }

    // Als geen patroon gevonden, geef de hele string (eerste 20 karakters)
    return cleaned.substring(0, 20) || null;
}

// ============================================
// Form Handling
// ============================================
function resetForm() {
    elements.serialNumberInput.value = '';
    elements.customerNumberInput.value = '';
    elements.serialHint.textContent = '';
    elements.ocrBadge.style.display = 'none';
    elements.previewSection.style.display = 'none';
    elements.ocrProgress.style.display = 'none';
    elements.startCameraBtn.style.display = 'flex';
}

function handleSubmit() {
    const serialNumber = elements.serialNumberInput.value.trim();
    const customerNumber = elements.customerNumberInput.value.trim();

    if (!serialNumber) {
        showToast('Vul een serienummer in', 'error');
        elements.serialNumberInput.focus();
        return;
    }

    if (!customerNumber) {
        showToast('Vul een klantnummer in', 'error');
        elements.customerNumberInput.focus();
        return;
    }

    // Opslaan
    saveEntry(serialNumber, customerNumber);

    // Feedback
    showToast('Gegevens opgeslagen!', 'success');

    // Reset voor volgende invoer
    resetForm();
}

// ============================================
// Data Storage
// ============================================
function saveEntry(serialNumber, customerNumber) {
    const entries = getEntries();
    entries.unshift({
        id: Date.now(),
        serialNumber,
        customerNumber,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('jacuzziEntries', JSON.stringify(entries));
}

function getEntries() {
    return JSON.parse(localStorage.getItem('jacuzziEntries') || '[]');
}

function deleteEntry(id) {
    const entries = getEntries().filter(e => e.id !== id);
    localStorage.setItem('jacuzziEntries', JSON.stringify(entries));
    renderHistory();
    showToast('Item verwijderd', 'success');
}

function clearAllEntries() {
    if (confirm('Weet je zeker dat je alle geschiedenis wilt wissen?')) {
        localStorage.removeItem('jacuzziEntries');
        renderHistory();
        showToast('Geschiedenis gewist', 'success');
    }
}

// ============================================
// History Rendering
// ============================================
function renderHistory() {
    const entries = getEntries();

    if (entries.length === 0) {
        elements.historyList.innerHTML = '<p class="empty-state">Nog geen gescande items</p>';
        return;
    }

    const html = entries.map(entry => {
        const date = new Date(entry.timestamp);
        const formattedDate = date.toLocaleDateString('nl-NL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="history-item" data-id="${entry.id}">
                <div class="history-content">
                    <div class="history-serial">${escapeHtml(entry.serialNumber)}</div>
                    <div class="history-customer">Klant: ${escapeHtml(entry.customerNumber)}</div>
                    <div class="history-date">${formattedDate}</div>
                </div>
                <button class="delete-btn" onclick="deleteEntry(${entry.id})" title="Verwijderen">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        `;
    }).join('');

    elements.historyList.innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// CSV Export
// ============================================
function exportToCSV() {
    const entries = getEntries();

    if (entries.length === 0) {
        showToast('Geen data om te exporteren', 'warning');
        return;
    }

    const headers = ['Serienummer', 'Klantnummer', 'Datum', 'Tijd'];
    const rows = entries.map(entry => {
        const date = new Date(entry.timestamp);
        return [
            entry.serialNumber,
            entry.customerNumber,
            date.toLocaleDateString('nl-NL'),
            date.toLocaleTimeString('nl-NL')
        ];
    });

    const csv = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    // Download
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jacuzzi-scans-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showToast('CSV gedownload!', 'success');
}

// ============================================
// Event Listeners
// ============================================
elements.startCameraBtn.addEventListener('click', startCamera);
elements.stopCameraBtn.addEventListener('click', stopCamera);
elements.switchCameraBtn.addEventListener('click', switchCamera);
elements.toggleFlashBtn.addEventListener('click', toggleFlash);
elements.captureBtn.addEventListener('click', capturePhoto);
elements.retakeBtn.addEventListener('click', () => {
    elements.previewSection.style.display = 'none';
    elements.ocrProgress.style.display = 'none';
    startCamera();
});

elements.submitBtn.addEventListener('click', handleSubmit);

elements.clearSerialBtn.addEventListener('click', () => {
    elements.serialNumberInput.value = '';
    elements.ocrBadge.style.display = 'none';
    elements.serialHint.textContent = '';
    elements.serialNumberInput.focus();
});

elements.clearCustomerBtn.addEventListener('click', () => {
    elements.customerNumberInput.value = '';
    elements.customerNumberInput.focus();
});

elements.exportCSVBtn.addEventListener('click', exportToCSV);
elements.clearHistoryBtn.addEventListener('click', clearAllEntries);

// Enter toets ondersteuning
elements.serialNumberInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') elements.customerNumberInput.focus();
});

elements.customerNumberInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSubmit();
});

// Maak deleteEntry globaal beschikbaar
window.deleteEntry = deleteEntry;

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    renderHistory();
    console.log('Jacuzzi Scanner initialized');
});
