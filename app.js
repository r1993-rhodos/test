// DOM Elements
const camera = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const startCameraBtn = document.getElementById('startCamera');
const captureBtn = document.getElementById('captureBtn');
const stopCameraBtn = document.getElementById('stopCamera');
const retakeBtn = document.getElementById('retakeBtn');
const preview = document.getElementById('preview');
const previewSection = document.getElementById('previewSection');
const ocrProgress = document.getElementById('ocrProgress');
const ocrStatus = document.getElementById('ocrStatus');
const progressBar = document.getElementById('progressBar');
const serialNumberInput = document.getElementById('serialNumber');
const customerNumberInput = document.getElementById('customerNumber');
const submitBtn = document.getElementById('submitBtn');
const resultSection = document.getElementById('resultSection');
const savedSerial = document.getElementById('savedSerial');
const savedCustomer = document.getElementById('savedCustomer');
const newEntryBtn = document.getElementById('newEntryBtn');

let stream = null;

// Start Camera
startCameraBtn.addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment', // Use back camera on mobile
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });
        camera.srcObject = stream;
        camera.style.display = 'block';
        startCameraBtn.style.display = 'none';
        captureBtn.style.display = 'inline-block';
        stopCameraBtn.style.display = 'inline-block';
        previewSection.style.display = 'none';
    } catch (error) {
        alert('Kon camera niet openen: ' + error.message);
    }
});

// Stop Camera
stopCameraBtn.addEventListener('click', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        camera.style.display = 'none';
        startCameraBtn.style.display = 'inline-block';
        captureBtn.style.display = 'none';
        stopCameraBtn.style.display = 'none';
    }
});

// Capture Photo
captureBtn.addEventListener('click', () => {
    const context = canvas.getContext('2d');
    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;
    context.drawImage(camera, 0, 0);

    const imageDataUrl = canvas.toDataURL('image/png');
    preview.src = imageDataUrl;

    // Stop camera
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    // Update UI
    camera.style.display = 'none';
    captureBtn.style.display = 'none';
    stopCameraBtn.style.display = 'none';
    previewSection.style.display = 'block';

    // Run OCR
    runOCR(imageDataUrl);
});

// Retake Photo
retakeBtn.addEventListener('click', () => {
    previewSection.style.display = 'none';
    ocrProgress.style.display = 'none';
    startCameraBtn.style.display = 'inline-block';
    serialNumberInput.value = '';
});

// OCR Function
async function runOCR(imageData) {
    ocrProgress.style.display = 'block';
    ocrStatus.textContent = 'OCR wordt gestart...';
    progressBar.style.width = '0%';

    try {
        const worker = await Tesseract.createWorker('nld', 1, {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    const progress = Math.round(m.progress * 100);
                    progressBar.style.width = progress + '%';
                    ocrStatus.textContent = `OCR wordt uitgevoerd: ${progress}%`;
                }
            }
        });

        const { data: { text } } = await worker.recognize(imageData);
        await worker.terminate();

        // Process OCR result
        const processedText = processOCRResult(text);
        serialNumberInput.value = processedText;

        ocrProgress.style.display = 'none';

        // Focus on customer number field
        customerNumberInput.focus();
    } catch (error) {
        ocrStatus.textContent = 'OCR mislukt: ' + error.message;
        console.error('OCR Error:', error);
    }
}

// Process OCR Result to extract serial number
function processOCRResult(text) {
    // Remove extra whitespace and newlines
    let processed = text.replace(/\s+/g, ' ').trim();

    // Try to find patterns that look like serial numbers
    // Common patterns: alphanumeric strings, possibly with dashes or spaces

    // Look for continuous alphanumeric sequences
    const patterns = [
        /[A-Z0-9]{5,}/gi,  // 5 or more alphanumeric characters
        /[A-Z]{2,}\d{4,}/gi, // Letters followed by 4+ digits
        /\d{4,}[A-Z]{2,}/gi, // Digits followed by 2+ letters
    ];

    for (const pattern of patterns) {
        const matches = processed.match(pattern);
        if (matches && matches.length > 0) {
            // Return the longest match
            return matches.sort((a, b) => b.length - a.length)[0];
        }
    }

    // If no pattern matched, return cleaned text
    return processed;
}

// Submit Form
submitBtn.addEventListener('click', () => {
    const serialNumber = serialNumberInput.value.trim();
    const customerNumber = customerNumberInput.value.trim();

    if (!serialNumber) {
        alert('Vul een serienummer in');
        return;
    }

    if (!customerNumber) {
        alert('Vul een klantnummer in');
        return;
    }

    // Save data (in real app, this would send to a server)
    savedSerial.textContent = serialNumber;
    savedCustomer.textContent = customerNumber;

    // Show result
    resultSection.style.display = 'block';
    previewSection.style.display = 'none';

    // Log to console (in real app, send to server)
    console.log('Saved:', { serialNumber, customerNumber });

    // You could also save to localStorage
    saveToLocalStorage(serialNumber, customerNumber);
});

// New Entry
newEntryBtn.addEventListener('click', () => {
    // Reset form
    serialNumberInput.value = '';
    customerNumberInput.value = '';
    resultSection.style.display = 'none';
    startCameraBtn.style.display = 'inline-block';
});

// Save to LocalStorage
function saveToLocalStorage(serialNumber, customerNumber) {
    const entries = JSON.parse(localStorage.getItem('jacuzziEntries') || '[]');
    entries.push({
        serialNumber,
        customerNumber,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('jacuzziEntries', JSON.stringify(entries));
}

// Load existing entries on page load (optional - for future enhancement)
window.addEventListener('load', () => {
    const entries = JSON.parse(localStorage.getItem('jacuzziEntries') || '[]');
    console.log('Existing entries:', entries);
});
