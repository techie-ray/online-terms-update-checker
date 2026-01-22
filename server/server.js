const express = require('express');
const cors = require('cors');
const path = require('path');
const storage = require('./storage');
const parser = require('./parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// GET /api/terms - Get all tracked terms
app.get('/api/terms', (req, res) => {
  try {
    const terms = storage.getAllTerms();
    res.json({ success: true, terms });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/terms - Add new term
app.post('/api/terms', async (req, res) => {
  try {
    const { url } = req.body;
    
    // Validate URL
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Invalid URL format' });
    }
    
    // Fetch and parse URL
    const parseResult = await parser.fetchAndParse(url);
    
    // Save to storage
    const term = storage.addTerm({
      url,
      title: parseResult.title,
      lastUpdated: parseResult.lastUpdated,
      detectionMethod: parseResult.detectionMethod
    });
    
    res.json({ success: true, term });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/terms/:id - Delete term
app.delete('/api/terms/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = storage.deleteTerm(id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Term not found' });
    }
    
    res.json({ success: true, message: 'Term deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/check/:id - Re-check specific term
app.post('/api/check/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get existing term
    const existingTerm = storage.getTermById(id);
    
    if (!existingTerm) {
      return res.status(404).json({ success: false, error: 'Term not found' });
    }
    
    // Fetch and parse URL
    const parseResult = await parser.fetchAndParse(existingTerm.url);
    
    // Update term
    const updatedTerm = storage.updateTerm(id, {
      title: parseResult.title,
      lastUpdated: parseResult.lastUpdated,
      detectionMethod: parseResult.detectionMethod
    });
    
    res.json({ success: true, term: updatedTerm });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/check-all - Refresh all terms
app.post('/api/check-all', async (req, res) => {
  try {
    const terms = storage.getAllTerms();
    const results = [];
    
    for (const term of terms) {
      try {
        const parseResult = await parser.fetchAndParse(term.url);
        const updatedTerm = storage.updateTerm(term.id, {
          title: parseResult.title,
          lastUpdated: parseResult.lastUpdated,
          detectionMethod: parseResult.detectionMethod
        });
        
        results.push({
          id: term.id,
          success: true,
          term: updatedTerm
        });
      } catch (error) {
        results.push({
          id: term.id,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Terms & Conditions Checker running on http://localhost:${PORT}`);
});
