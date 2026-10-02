'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();

app.use(cors());

app.use('/public', express.static(path.join(__dirname, 'public')));

// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Multer setup
// Store the uploaded file in memory instead of saving it to disk
const upload = multer({
  storage: multer.memoryStorage()
});

// File upload endpoint
app.post('/api/fileanalyse', upload.single('upfile'), (req, res) => {

  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded'
    });
  }

  res.json({
    name: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
