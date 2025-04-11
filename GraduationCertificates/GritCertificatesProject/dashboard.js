document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!authService.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // DOM elements
    const usernameDisplay = document.getElementById('usernameDisplay');
    const dashboardUsername = document.getElementById('dashboardUsername');
    const logoutBtn = document.getElementById('logoutBtn');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const certificateUpload = document.getElementById('certificateUpload');
    const selectedFiles = document.getElementById('selectedFiles');
    const fileList = document.getElementById('fileList');
    const fileCount = document.getElementById('fileCount');
    const processBtn = document.getElementById('processBtn');
    const certificateTableBody = document.getElementById('certificateTableBody');
    const certificateCount = document.getElementById('certificateCount');
    const certificateSearch = document.getElementById('certificateSearch');
    const statusFilter = document.getElementById('statusFilter');
    const qrModal = document.getElementById('qrModal');
    const closeModal = document.querySelector('.close-modal');
    const modalStudentName = document.getElementById('modalStudentName');
    const modalGLNumber = document.getElementById('modalGLNumber');
    const modalLink = document.getElementById('modalLink');
    const downloadQR = document.getElementById('downloadQR');
    const printQR = document.getElementById('printQR');
    
    // Set current admin username
    const admin = authService.getCurrentAdmin();
    usernameDisplay.textContent = admin.username;
    dashboardUsername.textContent = admin.username;
    
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}Tab`) {
                    content.classList.add('active');
                }
            });
            
            // If manage tab is activated, refresh the table
            if (tabId === 'manage') {
                renderCertificatesTable();
            }
        });
    });
    
    // Logout button
    logoutBtn.addEventListener('click', () => {
        authService.logout();
        window.location.href = 'login.html';
    });
    
    // File upload handling
    certificateUpload.addEventListener('change', handleFileSelect);
    
    // Drag and drop for file upload
    const uploadArea = document.querySelector('.upload-area');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        uploadArea.classList.add('highlight');
    }
    
    function unhighlight() {
        uploadArea.classList.remove('highlight');
    }
    
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        certificateUpload.files = files;
        handleFileSelect();
    }
    
// In dashboard.js

function handleFileSelect() {
    const files = certificateUpload.files;
    
    if (files.length > 0) {
        fileList.innerHTML = '';
        const folderMap = new Map(); // Track files by folder
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const relativePath = file.webkitRelativePath || file.name;
            const folder = relativePath.split('/')[0]; // Get top-level folder name
            
            if (!folderMap.has(folder)) {
                folderMap.set(folder, []);
            }
            folderMap.get(folder).push({ file, index: i });
            
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span>${relativePath}</span>
                <i class="fas fa-times" data-index="${i}"></i>
            `;
            fileList.appendChild(fileItem);
        }
        
        fileCount.textContent = files.length;
        selectedFiles.classList.remove('hidden');
        processBtn.disabled = false;
    }
}

// Update processBtn event listener
processBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const files = certificateUpload.files;
    if (files.length === 0) return;
    
    processBtn.disabled = true;
    processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    const certificates = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name;
        const relativePath = file.webkitRelativePath || file.name;
        
        try {
            // Extract student details from filename (format: studentCode_firstName_lastName.pdf)
            const baseName = fileName.replace('.pdf', '');
            const parts = baseName.split('_');
            
            if (parts.length >= 3) {
                const studentCode = parts[0];
                const firstName = parts[1];
                const lastName = parts.slice(2).join(' ');
                
                // Randomly assign status for demo
                const status = Math.random() > 0.5 ? 'Passed with Distinction' : 'Passed';
                
                // Read file as ArrayBuffer for storage
                const fileBuffer = await file.arrayBuffer();
                
                // Create certificate object
                const certificate = {
                    studentCode,
                    firstName,
                    lastName,
                    status,
                    certificateFile: fileName,
                    folderPath: relativePath.split('/').slice(0, -1).join('/'), // Store folder path
                    fileData: fileBuffer, // Store file data
                    qrCodeFile: `${studentCode}_QR.png`
                };
                
                // Add to database
                await certificateDB.addCertificate(certificate);
                certificates.push(certificate);
                successCount++;
            } else {
                errorCount++;
            }
        } catch (error) {
            console.error(`Error processing file ${fileName}:`, error);
            errorCount++;
        }
    }
    
    // Reset form
    certificateUpload.value = '';
    selectedFiles.classList.add('hidden');
    processBtn.disabled = false;
    processBtn.innerHTML = 'Process All Files';
    
    // Show results
    alert(`Processed ${files.length} files: ${successCount} succeeded, ${errorCount} failed`);
    
    // Refresh certificates table if on manage tab
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab && activeTab.dataset.tab === 'manage') {
        renderCertificatesTable();
    }
});
    
    // Certificate table rendering
    async function renderCertificatesTable() {
        try {
            const searchTerm = certificateSearch.value.toLowerCase();
            const statusFilterValue = statusFilter.value;
            
            const certificates = await certificateDB.getAllCertificates({
                search: searchTerm,
                status: statusFilterValue === 'all' ? null : statusFilterValue
            });
            
            certificateCount.textContent = certificates.length;
            certificateTableBody.innerHTML = '';
            
            if (certificates.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `<td colspan="6" class="text-center">No certificates found</td>`;
                certificateTableBody.appendChild(row);
                return;
            }
            
            certificates.forEach(cert => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${cert.glNumber}</td>
                    <td>${cert.studentCode}</td>
                    <td>${cert.firstName} ${cert.lastName}</td>
                    <td>
                        <span class="status-badge ${cert.status === 'Passed with Distinction' ? 'distinction' : 'passed'}">
                            ${cert.status}
                        </span>
                    </td>
                    <td>${formatDate(cert.issueDate)}</td>
                    <td class="table-actions">
                        <button class="btn secondary view-btn" data-id="${cert.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn secondary qr-btn" data-id="${cert.id}" data-gl="${cert.glNumber}" data-name="${cert.firstName} ${cert.lastName}">
                            <i class="fas fa-qrcode"></i>
                        </button>
                        <button class="btn secondary delete-btn" data-id="${cert.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                certificateTableBody.appendChild(row);
            });
            
            // Add event listeners to action buttons
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    alert('View certificate functionality would open the PDF in a real implementation');
                });
            });
            
            document.querySelectorAll('.qr-btn').forEach(btn => {
                btn.addEventListener('click', showQRCode);
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', deleteCertificate);
            });
            
        } catch (error) {
            console.error('Error loading certificates:', error);
            certificateTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">Error loading certificates</td>
                </tr>
            `;
        }
    }
    
    // Search and filter events
    certificateSearch.addEventListener('input', renderCertificatesTable);
    statusFilter.addEventListener('change', renderCertificatesTable);
    
    // QR Code modal
// In dashboard.js, modify the showQRCode function
function showQRCode(e) {
    const glNumber = e.currentTarget.dataset.gl;
    const studentName = e.currentTarget.dataset.name;
    
    modalStudentName.textContent = studentName;
    modalGLNumber.textContent = glNumber;
    
    // Change to a direct certificate URL
    const certificateURL = `${window.location.origin}/certificates/${glNumber}.pdf`;
    modalLink.textContent = certificateURL;
    
    // Generate QR code
    const qrContainer = document.getElementById('qrCodeContainer');
    qrContainer.innerHTML = '';
    
    new QRCode(qrContainer, {
        text: certificateURL, // QR code now points to the certificate file
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
    
    qrModal.classList.add('active');
}
    
    // Close modal
    closeModal.addEventListener('click', () => {
        qrModal.classList.remove('active');
    });
    
    // Download QR code
    downloadQR.addEventListener('click', () => {
        const canvas = document.querySelector('#qrCodeContainer canvas');
        if (canvas) {
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `qrcode_${modalGLNumber.textContent}.png`;
            link.click();
        }
    });
    
    // Print QR code
    printQR.addEventListener('click', () => {
        const printWindow = window.open('', '_blank');
        const canvas = document.querySelector('#qrCodeContainer canvas');
        
        if (canvas && printWindow) {
            const image = canvas.toDataURL('image/png');
            
            printWindow.document.write(`
                <html>
                <head>
                    <title>QR Code - ${modalGLNumber.textContent}</title>
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
                    </style>
                </head>
                <body>
                    <img src="${image}" alt="QR Code">
                    <div class="info">
                        <p>GL Number: ${modalGLNumber.textContent}</p>
                        <p>Student: ${modalStudentName.textContent}</p>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(function() {
                                window.close();
                            }, 100);
                        }
                    </script>
                </body>
                </html>
            `);
            
            printWindow.document.close();
        }
    });
    
    // Delete certificate
    async function deleteCertificate(e) {
        const id = parseInt(e.currentTarget.dataset.id);
        
        if (confirm('Are you sure you want to delete this certificate?')) {
            try {
                await certificateDB.deleteCertificate(id);
                renderCertificatesTable();
            } catch (error) {
                console.error('Error deleting certificate:', error);
                alert('Error deleting certificate');
            }
        }
    }
    
    // Format date for display
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
    
    // Initial render of certificates table if on manage tab
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab && activeTab.dataset.tab === 'manage') {
        renderCertificatesTable();
    }
});