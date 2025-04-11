// server.js (example)
const express = require('express');
const path = require('path');
const app = express();

app.use('/certificates', express.static(path.join(__dirname, 'certificates')));

app.listen(3000, () => {
    console.log('Server running on port 3000');
});