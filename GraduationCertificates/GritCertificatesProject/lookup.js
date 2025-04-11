document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const lookupForm = document.getElementById('lookupForm');
    const glNumberInput = document.getElementById('glNumber');
    const certificateResult = document.getElementById('certificateResult');
    const certificateNotFound = document.getElementById('certificateNotFound');
    const closeResultBtn = document.getElementById('closeResult');
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    const notFoundGlNumber = document.getElementById('notFoundGlNumber');
    const viewCertificateBtn = document.getElementById('viewCertificate');
    const downloadCertificateBtn = document.getElementById('downloadCertificate');
    const certificateViewer = document.getElementById('certificateViewer');
    const closeViewerBtn = document.getElementById('closeViewer');
    const certificateDisplay = document.getElementById('certificateDisplay');
    const scanQrBtn = document.getElementById('scanQrBtn');
    const qrCodeModal = document.getElementById('qrCodeModal');
    const closeQrModal = document.getElementById('closeQrModal');
    const qrModalDisplay = document.getElementById('qrModalDisplay');
    const qrModalMessage = document.getElementById('qrModalMessage');
    
    // Sample certificate data (in a real app, this would come from a database)
    const certificateData = {
        'GL-001': {
            studentName: 'John Doe',
            studentCode: '12345',
            glNumber: 'GL-001',
            status: 'Passed with Distinction',
            certificate: '12345_John_Doe.pdf' // Match admin-side filename
        },
        'GL-002': {
            studentName: 'Jane Smith',
            studentCode: '67890',
            glNumber: 'GL-002',
            status: 'Passed',
            certificate: '67890_Jane_Smith.pdf'
        },
        'GL-003': {
            studentName: 'Michael Johnson',
            studentCode: '13579',
            glNumber: 'GL-003',
            status: 'Passed with Distinction',
            certificate: '13579_Michael_Johnson.pdf'
        }
    };
    
    // Check URL for GL number query parameter
    function checkUrlForGLNumber() {
        const urlParams = new URLSearchParams(window.location.search);
        const glNumber = urlParams.get('gl');
        
        if (glNumber) {
            glNumberInput.value = glNumber;
            const certFound = lookupCertificate(glNumber);
            if (certFound) {
                // Automatically show certificate preview
                const cert = certificateData[glNumber];
                certificateDisplay.innerHTML = createSampleCertificate(cert);
                certificateViewer.classList.remove('hidden');
                console.log(`Auto-displayed certificate preview for GL number: ${glNumber}`);
            }
        }
    }
    
    // Handle form submission
    lookupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const glNumber = glNumberInput.value.trim();
        lookupCertificate(glNumber);
    });
    
    // Lookup certificate function
    function lookupCertificate(glNumber) {
        // Clear previous results
        certificateResult.classList.add('hidden');
        certificateNotFound.classList.add('hidden');
        const qrCodeDisplay = document.getElementById('qrCodeDisplay');
        if (qrCodeDisplay) qrCodeDisplay.innerHTML = ''; // Clear previous QR code
        
        // Check if certificate exists
        if (certificateData[glNumber]) {
            const cert = certificateData[glNumber];
            
            // Populate certificate result data
            document.getElementById('studentName').textContent = cert.studentName;
            document.getElementById('studentCode').textContent = cert.studentCode;
            document.getElementById('resultGlNumber').textContent = cert.glNumber;
            document.getElementById('certificateStatus').textContent = cert.status;
            
            // Style status based on result
            const statusElement = document.getElementById('certificateStatus');
            if (cert.status === 'Passed with Distinction') {
                statusElement.className = 'detail-value status-pass';
                statusElement.style.color = '#34a853';
            } else {
                statusElement.className = 'detail-value status-pass';
                statusElement.style.color = '#1a73e8';
            }
            
            // Generate QR code in result section
            if (qrCodeDisplay) {
                const lookupURL = `${window.location.origin}${window.location.pathname}?gl=${cert.glNumber}`;
                new QRCode(qrCodeDisplay, {
                    text: lookupURL,
                    width: 100,
                    height: 100,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
            
            // Show certificate result
            certificateResult.classList.remove('hidden');
            
            // Log event
            console.log(`Certificate found for GL number: ${glNumber}`);
            return true; // Indicate success
        } else {
            // Show not found message
            notFoundGlNumber.textContent = glNumber;
            certificateNotFound.classList.remove('hidden');
            
            // Log event
            console.log(`No certificate found for GL number: ${glNumber}`);
            return false; // Indicate failure
        }
    }
    
    // View QR code button
    scanQrBtn.addEventListener('click', function() {
        const glNumber = glNumberInput.value.trim();
        qrModalDisplay.innerHTML = ''; // Clear previous QR code
        qrModalMessage.textContent = '';
        
        if (!glNumber) {
            qrModalMessage.textContent = 'Please enter a GL number to view the QR code.';
            qrCodeModal.classList.remove('hidden');
            return;
        }
        
        if (certificateData[glNumber]) {
            const cert = certificateData[glNumber];
            const lookupURL = `${window.location.origin}${window.location.pathname}?gl=${cert.glNumber}`;
            new QRCode(qrModalDisplay, {
                text: lookupURL,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
            qrModalMessage.textContent = `QR Code for ${cert.studentName} (${glNumber})`;
            qrCodeModal.classList.remove('hidden');
            console.log(`Displayed QR code for GL number: ${glNumber}`);
        } else {
            qrModalMessage.textContent = `No certificate found for GL number: ${glNumber}`;
            qrCodeModal.classList.remove('hidden');
            console.log(`No certificate found for GL number: ${glNumber}`);
        }
    });
    
    // Close QR modal
    closeQrModal.addEventListener('click', function() {
        qrCodeModal.classList.add('hidden');
        qrModalDisplay.innerHTML = ''; // Clear QR code
        qrModalMessage.textContent = '';
    });
    
    // Close result button
    closeResultBtn.addEventListener('click', function() {
        certificateResult.classList.add('hidden');
    });
    
    // Try again button
    tryAgainBtn.addEventListener('click', function() {
        certificateNotFound.classList.add('hidden');
        glNumberInput.value = '';
        glNumberInput.focus();
    });
    
    // View certificate
    viewCertificateBtn.addEventListener('click', function() {
        const glNumber = document.getElementById('resultGlNumber').textContent;
        const cert = certificateData[glNumber];
        
        // Create a sample certificate display
        certificateDisplay.innerHTML = createSampleCertificate(cert);
        
        // Show certificate viewer
        certificateViewer.classList.remove('hidden');
    });
    
    // Close certificate viewer
    closeViewerBtn.addEventListener('click', function() {
        certificateViewer.classList.add('hidden');
    });
    
    // Download certificate
    downloadCertificateBtn.addEventListener('click', function() {
        const glNumber = document.getElementById('resultGlNumber').textContent;
        alert(`In a real application, this would download the certificate file for ${glNumber}`);
    });
    
    // Create sample certificate HTML
    function createSampleCertificate(cert) {
        const today = new Date();
        const dateString = today.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        return `
            <div class="sample-certificate">
                <div class="certificate-gl">
                    GL Number: ${cert.glNumber}
                </div>
                <div class="certificate-header">
                    <h1>Certificate of Achievement</h1>
                    <p>This certifies that</p>
                </div>
                <div class="certificate-body">
                    <p class="student-name">${cert.studentName}</p>
                    <p>has successfully completed the required coursework and examinations</p>
                    <p class="certificate-type">${cert.status}</p>
                    <p>Student ID: ${cert.studentCode}</p>
                </div>
                <div class="certificate-footer">
                    <div class="signature">
                        <div class="signature-line"></div>
                        <p>Program Director</p>
                    </div>
                    <div class="signature">
                        <div class="signature-line"></div>
                        <p>Academic Dean</p>
                    </div>
                </div>
                <div class="certificate-seal">
                    OFFICIAL CERTIFICATE
                </div>
                <div class="certificate-date">
                    Issued on ${dateString}
                </div>
            </div>
        `;
    }

    // Check URL on page load
    checkUrlForGLNumber();
});