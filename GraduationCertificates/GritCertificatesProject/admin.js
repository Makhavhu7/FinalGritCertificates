
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const loginForm = document.getElementById('loginForm');
    const loginContainer = document.getElementById('loginContainer');
    const adminDashboard = document.getElementById('adminDashboard');
    const logoutBtn = document.getElementById('logoutBtn');
    const certificateUpload = document.getElementById('certificateUpload');
    const selectedFiles = document.getElementById('selectedFiles');
    const uploadText = document.getElementById('uploadText');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadForm = document.getElementById('uploadForm');
    const manualEntryForm = document.getElementById('manualEntryForm');
    const certificatesTableBody = document.getElementById('certificatesTableBody');
    const totalCertificates = document.getElementById('totalCertificates');
    const distinctionCount = document.getElementById('distinctionCount');
    const passCount = document.getElementById('passCount');
    const lastUpdated = document.getElementById('lastUpdated');
    const searchCertificates = document.getElementById('searchCertificates');
    const generateQRBtn = document.getElementById('generateQRBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const qrCodeModal = document.getElementById('qrCodeModal');
    
    // Sample certificate data
    let certificates = [
        {
            glNumber: 'GL-001',
            studentCode: '12345',
            firstName: 'John',
            lastName: 'Doe',
            status: 'Passed with Distinction',
            certificate: '12345_John_Doe.pdf',
            qrCode: '12345_QR.png'
        },
        {
            glNumber: 'GL-002',
            studentCode: '67890',
            firstName: 'Jane',
            lastName: 'Smith',
            status: 'Passed',
            certificate: '67890_Jane_Smith.pdf',
            qrCode: '67890_QR.png'
        }
    ];
    
    // Handle login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Simple authentication (in a real app, this would be handled securely)
        if (username === 'admin' && password === 'admin') {
            // Hide login, show dashboard
            loginContainer.parentElement.classList.add('hidden');
            adminDashboard.classList.remove('hidden');
            
            // Initialize dashboard
            updateDashboardStats();
            renderCertificatesTable();
            
            // Log event
            console.log('Admin logged in successfully');
        } else {
            alert('Invalid credentials. Use "admin" for both username and password.');
            console.log('Login failed: Invalid credentials');
        }
    });
    
    // Handle logout
    logoutBtn.addEventListener('click', function() {
        // Show login, hide dashboard
        loginContainer.parentElement.classList.remove('hidden');
        adminDashboard.classList.add('hidden');
        
        // Clear login form
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        
        // Log event
        console.log('Admin logged out');
    });
    
    // Handle file upload selection
    certificateUpload.addEventListener('change', function() {
        updateFileList();
    });
    
    // Handle drag and drop
    const fileLabel = document.querySelector('.file-label');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileLabel.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        fileLabel.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        fileLabel.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        fileLabel.classList.add('border-primary-color');
        fileLabel.style.backgroundColor = 'var(--primary-light)';
    }
    
    function unhighlight() {
        fileLabel.classList.remove('border-primary-color');
        fileLabel.style.backgroundColor = '';
    }
    
    fileLabel.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        certificateUpload.files = files;
        updateFileList();
    }
    
    // Update file list and button state
    function updateFileList() {
        const files = certificateUpload.files;
        
        if (files.length > 0) {
            uploadText.textContent = `${files.length} file(s) selected`;
            uploadBtn.disabled = false;
            
            // Display selected files
            selectedFiles.innerHTML = '';
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileItem = createFileListItem(file, i);
                selectedFiles.appendChild(fileItem);
            }
        } else {
            uploadText.textContent = 'Choose PDFs or drag & drop';
            uploadBtn.disabled = true;
            selectedFiles.innerHTML = '';
        }
    }
    
    // Create file list item
    function createFileListItem(file, index) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileName = document.createElement('span');
        fileName.className = 'file-item-name';
        fileName.textContent = file.name;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file-btn';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.dataset.index = index;
        removeBtn.addEventListener('click', removeFile);
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(removeBtn);
        
        return fileItem;
    }
    
    // Remove file from selection
    function removeFile(e) {
        const index = parseInt(e.currentTarget.dataset.index);
        const dt = new DataTransfer();
        const files = certificateUpload.files;
        
        for (let i = 0; i < files.length; i++) {
            if (i !== index) {
                dt.items.add(files[i]);
            }
        }
        
        certificateUpload.files = dt.files;
        updateFileList();
    }
    
    // Handle certificate upload
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const files = certificateUpload.files;
        
        if (files.length === 0) {
            alert('Please select at least one certificate file');
            return;
        }
        
        // Process files (in a real app, this would upload to a server)
        let newCertificates = [];
        let nextGLNumber = getNextGLNumber();
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const filename = file.name;
            
            // Extract details from filename (assuming format is studentCode_firstName_lastName.pdf)
            const parts = filename.replace('.pdf', '').split('_');
            
            if (parts.length >= 3) {
                const studentCode = parts[0];
                const firstName = parts[1];
                const lastName = parts[2];
                
                // Generate GL number
                const glNumber = `GL-${nextGLNumber.toString().padStart(3, '0')}`;
                nextGLNumber++;
                
                // Randomly assign status for demo
                const status = Math.random() > 0.5 ? 'Passed with Distinction' : 'Passed';
                
                // Create new certificate record
                const certificate = {
                    glNumber: glNumber,
                    studentCode: studentCode,
                    firstName: firstName,
                    lastName: lastName,
                    status: status,
                    certificate: filename,
                    qrCode: `${studentCode}_QR.png`
                };
                
                newCertificates.push(certificate);
            }
        }
        
        // Add new certificates to the list
        certificates = [...certificates, ...newCertificates];
        
        // Update UI
        updateDashboardStats();
        renderCertificatesTable();
        
        // Reset form
        uploadForm.reset();
        selectedFiles.innerHTML = '';
        uploadText.textContent = 'Choose PDFs or drag & drop';
        uploadBtn.disabled = true;
        
        // Show success message
        alert(`${newCertificates.length} certificates processed successfully!`);
        console.log(`${newCertificates.length} certificates uploaded and processed`);
    });
    
    // Handle manual certificate entry
    manualEntryForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const studentCode = document.getElementById('studentCode').value;
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const status = document.getElementById('status').value;
        
        // Generate GL number
        const nextGLNumber = getNextGLNumber();
        const glNumber = `GL-${nextGLNumber.toString().padStart(3, '0')}`;
        
        // Create certificate record
        const certificate = {
            glNumber: glNumber,
            studentCode: studentCode,
            firstName: firstName,
            lastName: lastName,
            status: status,
            certificate: `${studentCode}_${firstName}_${lastName}.pdf`,
            qrCode: `${studentCode}_QR.png`
        };
        
        // Add to certificates list
        certificates.push(certificate);
        
        // Update UI
        updateDashboardStats();
        renderCertificatesTable();
        
        // Reset form
        manualEntryForm.reset();
        
        // Show success message
        alert(`Certificate added successfully! GL Number: ${glNumber}`);
        console.log(`Manual certificate added with GL Number: ${glNumber}`);
    });
    
    // Search certificates
    searchCertificates.addEventListener('input', function() {
        renderCertificatesTable();
    });
    
    // Generate QR codes
    generateQRBtn.addEventListener('click', function() {
        // In a real app, this would generate QR codes on the server
        alert(`QR codes generated for ${certificates.length} certificates.`);
        console.log(`Generated QR codes for ${certificates.length} certificates`);
    });
    
    // Export data
    exportDataBtn.addEventListener('click', function() {
        // In a real app, this would export data to CSV or Excel
        const jsonData = JSON.stringify(certificates, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'certificates.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        console.log('Certificate data exported');
    });
    
    // Handle QR code modal close
    document.querySelector('.close-modal-btn').addEventListener('click', function() {
        qrCodeModal.classList.add('hidden');
    });
    
    // Get next GL number
    function getNextGLNumber() {
        if (certificates.length === 0) {
            return 1;
        }
        
        // Extract numbers from existing GL numbers
        const numbers = certificates.map(cert => {
            return parseInt(cert.glNumber.replace('GL-', ''));
        });
        
        // Find the highest number and add 1
        return Math.max(...numbers) + 1;
    }
    
    // Update dashboard statistics
    function updateDashboardStats() {
        totalCertificates.textContent = certificates.length;
        
        const distinction = certificates.filter(cert => cert.status === 'Passed with Distinction').length;
        distinctionCount.textContent = distinction;
        
        const pass = certificates.filter(cert => cert.status === 'Passed').length;
        passCount.textContent = pass;
        
        const now = new Date();
        lastUpdated.textContent = now.toLocaleString();
    }
    
    // Render certificates table
    function renderCertificatesTable() {
        certificatesTableBody.innerHTML = '';
        
        const searchTerm = searchCertificates.value.toLowerCase();
        
        // Filter certificates based on search term
        const filteredCertificates = certificates.filter(cert => {
            return cert.glNumber.toLowerCase().includes(searchTerm) ||
                   cert.studentCode.toLowerCase().includes(searchTerm) ||
                   cert.firstName.toLowerCase().includes(searchTerm) ||
                   cert.lastName.toLowerCase().includes(searchTerm) ||
                   cert.status.toLowerCase().includes(searchTerm);
        });
        
        // Render each certificate row
        filteredCertificates.forEach(cert => {
            const row = document.createElement('tr');
            
            // GL Number
            const glCell = document.createElement('td');
            glCell.textContent = cert.glNumber;
            row.appendChild(glCell);
            
            // Student Code
            const codeCell = document.createElement('td');
            codeCell.textContent = cert.studentCode;
            row.appendChild(codeCell);
            
            // Name
            const nameCell = document.createElement('td');
            nameCell.textContent = `${cert.firstName} ${cert.lastName}`;
            row.appendChild(nameCell);
            
            // Status
            const statusCell = document.createElement('td');
            statusCell.textContent = cert.status;
            statusCell.style.color = cert.status === 'Passed with Distinction' ? 'var(--success-color)' : 'var(--primary-color)';
            statusCell.style.fontWeight = '500';
            row.appendChild(statusCell);
            
            // Certificate
            const certCell = document.createElement('td');
            certCell.textContent = cert.certificate;
            row.appendChild(certCell);
            
            // QR Code
            const qrCell = document.createElement('td');
            const qrStatus = document.createElement('span');
            qrStatus.textContent = cert.qrCode ? 'Generated' : 'Not Generated';
            qrStatus.style.color = cert.qrCode ? 'var(--success-color)' : 'var(--gray-color)';
            qrCell.appendChild(qrStatus);
            row.appendChild(qrCell);
            
            // Actions
            const actionsCell = document.createElement('td');
            actionsCell.className = 'table-actions';
            
            const viewBtn = document.createElement('button');
            viewBtn.className = 'btn primary-btn';
            viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
            viewBtn.title = 'View Certificate';
            viewBtn.dataset.gl = cert.glNumber;
            viewBtn.addEventListener('click', viewCertificate);
            
            const qrBtn = document.createElement('button');
            qrBtn.className = 'btn secondary-btn';
            qrBtn.innerHTML = '<i class="fas fa-qrcode"></i>';
            qrBtn.title = 'View QR Code';
            qrBtn.dataset.gl = cert.glNumber;
            qrBtn.addEventListener('click', viewQRCode);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn secondary-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Delete Certificate';
            deleteBtn.dataset.gl = cert.glNumber;
            deleteBtn.addEventListener('click', deleteCertificate);
            
            actionsCell.appendChild(viewBtn);
            actionsCell.appendChild(qrBtn);
            actionsCell.appendChild(deleteBtn);
            row.appendChild(actionsCell);
            
            certificatesTableBody.appendChild(row);
        });
    }
    
    // View certificate
    function viewCertificate(e) {
        const glNumber = e.currentTarget.dataset.gl;
        const cert = certificates.find(c => c.glNumber === glNumber);
        
        if (cert) {
            alert(`Viewing certificate: ${cert.certificate}\nIn a real application, this would open the PDF file.`);
            console.log(`Viewing certificate: ${cert.certificate}`);
        }
    }
    
    // View QR code
// In the viewQRCode function, modify the QR code URL generation:
function viewQRCode(e) {
    const glNumber = e.currentTarget.dataset.gl;
    const cert = certificates.find(c => c.glNumber === glNumber);
    
    if (cert) {
        document.getElementById('qrCodeStudentName').textContent = `${cert.firstName} ${cert.lastName}`;
        document.getElementById('qrGlNumber').textContent = cert.glNumber;
        
        // This is the important change - make sure the URL points to your lookup.html
        const lookupURL = `${window.location.origin}${window.location.pathname.replace('admin.html', '')}lookup.html?gl=${cert.glNumber}`;
        document.getElementById('qrCodeLink').textContent = lookupURL;
        
        const qrContainer = document.getElementById('qrCodeDisplay');
        qrContainer.innerHTML = '';
        
        new QRCode(qrContainer, {
            text: lookupURL,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
        
        qrCodeModal.classList.remove('hidden');
    }
}

    // Download QR code
    document.getElementById('downloadQrBtn').addEventListener('click', function() {
        const canvas = document.querySelector('#qrCodeDisplay canvas');
        if (canvas) {
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `qrcode_${document.getElementById('qrGlNumber').textContent}.png`;
            link.click();
            
            console.log(`QR code downloaded for: ${document.getElementById('qrGlNumber').textContent}`);
        }
    });
    
    // Print QR code
    document.getElementById('printQrBtn').addEventListener('click', function() {
        const printWindow = window.open('', '_blank');
        const canvas = document.querySelector('#qrCodeDisplay canvas');
        
        if (canvas && printWindow) {
            const image = canvas.toDataURL('image/png');
            
            printWindow.document.write(`
                <html>
                <head>
                    <title>QR Code - ${document.getElementById('qrGlNumber').textContent}</title>
                    <style>
                        body { 
                            display: flex; 
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            flex-direction: column;
                            font-family: Arial, sans-serif;
                        }
                        img { 
                            max-width: 300px; 
                            border: 1px solid #ccc;
                        }
                        .info {
                            margin-top: 20px;
                            text-align: center;
                        }
                        @media print {
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <img src="${image}" alt="QR Code">
                    <div class="info">
                        <p>GL Number: ${document.getElementById('qrGlNumber').textContent}</p>
                        <p>Student: ${document.getElementById('qrCodeStudentName').textContent}</p>
                    </div>
                    <button class="no-print" onclick="window.print();window.close();" style="margin-top:20px; padding:10px 20px;">Print QR Code</button>
                </body>
                </html>
            `);
            
            printWindow.document.close();
            console.log(`Printing QR code for: ${document.getElementById('qrGlNumber').textContent}`);
        }
    });
    
    // Delete certificate
    function deleteCertificate(e) {
        const glNumber = e.currentTarget.dataset.gl;
        
        if (confirm(`Are you sure you want to delete certificate with GL Number: ${glNumber}?`)) {
            certificates = certificates.filter(cert => cert.glNumber !== glNumber);
            
            // Update UI
            updateDashboardStats();
            renderCertificatesTable();
            
            console.log(`Certificate deleted: ${glNumber}`);
        }
    }
});
