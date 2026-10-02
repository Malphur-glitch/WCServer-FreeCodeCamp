
const express = require('express');
const dns = require('dns');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));

// Store URLs while the server is running
let urls = [];
let nextId = 1;

// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// POST: Create a short URL
app.post('/api/shorturl', (req, res) => {
  const input = req.body.url;

  if (!input) {
    return res.json({ error: 'invalid url' });
  }

  let parsed;

  try {
    parsed = new URL(input);

    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      !parsed.hostname
    ) {
      return res.json({ error: 'invalid url' });
    }
  } catch {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(parsed.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Reuse an existing ID for duplicate URLs
    const existing = urls.find(item => item.original_url === input);

    if (existing) {
      return res.json(existing);
    }

    const newUrl = {
      original_url: input,
      short_url: nextId++
    };

    urls.push(newUrl);

    return res.json(newUrl);
  });
});

// GET: Redirect to original URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const id = Number(req.params.short_url);

  const found = urls.find(item => item.short_url === id);

  if (!found) {
    return res.json({ error: 'No short URL found' });
  }

  return res.redirect(found.original_url);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
