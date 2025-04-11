class CertificateDatabase {
    constructor() {
        this.dbName = 'CertificateDB';
        this.dbVersion = 1;
        this.db = null;
        this.initializeDB();
    }

    initializeDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create certificates store if it doesn't exist
                if (!db.objectStoreNames.contains('certificates')) {
                    const store = db.createObjectStore('certificates', { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    
                    // Create indexes for searching
                    store.createIndex('glNumber', 'glNumber', { unique: true });
                    store.createIndex('studentCode', 'studentCode', { unique: false });
                    store.createIndex('status', 'status', { unique: false });
                    store.createIndex('firstName', 'firstName', { unique: false });
                    store.createIndex('lastName', 'lastName', { unique: false });
                }

                // Create admin credentials store
                if (!db.objectStoreNames.contains('adminCredentials')) {
                    db.createObjectStore('adminCredentials', { keyPath: 'username' });
                }
            };
        });
    }

    // Admin authentication methods
    async initializeAdminCredentials() {
        const adminExists = await this.getAdminCredential('admin');
        if (!adminExists) {
            await this.addAdminCredential('admin', 'password');
        }
    }

    addAdminCredential(username, password) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['adminCredentials'], 'readwrite');
            const store = transaction.objectStore('adminCredentials');
            
            const request = store.add({ username, password });
            
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    getAdminCredential(username) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['adminCredentials'], 'readonly');
            const store = transaction.objectStore('adminCredentials');
            
            const request = store.get(username);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // Certificate methods
// In database.js, modify the addCertificate method
async addCertificate(certificate) {
    // Generate GL number if not provided
    if (!certificate.glNumber) {
        const lastGL = await this.getLastGLNumber();
        const nextNumber = lastGL ? parseInt(lastGL.replace('GL-', '')) + 1 : 1;
        certificate.glNumber = `GL-${nextNumber.toString().padStart(3, '0')}`;
    }

    // Set issue date if not provided
    if (!certificate.issueDate) {
        certificate.issueDate = new Date().toISOString().split('T')[0];
    }

    return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['certificates'], 'readwrite');
        const store = transaction.objectStore('certificates');
        
        const request = store.add({
            ...certificate,
            fileData: certificate.fileData || null, // Store file data
            folderPath: certificate.folderPath || '' // Store folder path
        });
        
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

// Add a method to retrieve certificate file data
async getCertificateFile(glNumber) {
    const certificate = await this.getCertificateByGL(glNumber);
    return certificate ? certificate.fileData : null;
}

    async getLastGLNumber() {
        const certificates = await this.getAllCertificates();
        if (certificates.length === 0) return null;
        
        // Sort certificates by GL number to get the highest one
        certificates.sort((a, b) => {
            const aNum = parseInt(a.glNumber.replace('GL-', ''));
            const bNum = parseInt(b.glNumber.replace('GL-', ''));
            return bNum - aNum;
        });
        
        return certificates[0].glNumber;
    }

    getCertificateByGL(glNumber) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['certificates'], 'readonly');
            const store = transaction.objectStore('certificates');
            const index = store.index('glNumber');
            
            const request = index.get(glNumber);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    getAllCertificates(filter = {}) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['certificates'], 'readonly');
            const store = transaction.objectStore('certificates');
            
            const request = store.getAll();
            
            request.onsuccess = () => {
                let certificates = request.result;
                
                // Apply filters if provided
                if (filter.search) {
                    const searchTerm = filter.search.toLowerCase();
                    certificates = certificates.filter(cert => 
                        cert.glNumber.toLowerCase().includes(searchTerm) ||
                        cert.studentCode.toLowerCase().includes(searchTerm) ||
                        cert.firstName.toLowerCase().includes(searchTerm) ||
                        cert.lastName.toLowerCase().includes(searchTerm)
                    );
                }
                
                if (filter.status && filter.status !== 'All') {
                    certificates = certificates.filter(cert => cert.status === filter.status);
                }
                
                resolve(certificates);
            };
            
            request.onerror = (event) => reject(event.target.error);
        });
    }

    getCertificatesCount() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['certificates'], 'readonly');
            const store = transaction.objectStore('certificates');
            
            const request = store.count();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    getCertificatesByStatus(status) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['certificates'], 'readonly');
            const store = transaction.objectStore('certificates');
            const index = store.index('status');
            
            const request = index.getAll(status);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    deleteCertificate(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['certificates'], 'readwrite');
            const store = transaction.objectStore('certificates');
            
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // Bulk operations
    async addCertificates(certificates) {
        const results = [];
        
        for (const cert of certificates) {
            try {
                const id = await this.addCertificate(cert);
                results.push({ success: true, id });
            } catch (error) {
                results.push({ success: false, error });
            }
        }
        
        return results;
    }
}

// Create a singleton instance of the database
const certificateDB = new CertificateDatabase();

// Initialize admin credentials when the database is ready
certificateDB.initializeDB().then(() => {
    certificateDB.initializeAdminCredentials();
});

export default certificateDB;