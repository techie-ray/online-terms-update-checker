const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

// Read data from JSON file
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      // Create file with empty structure if doesn't exist
      const initialData = { terms: [] };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading data:', error);
    return { terms: [] };
  }
}

// Write data to JSON file
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data:', error);
    return false;
  }
}

// Get all terms
function getAllTerms() {
  const data = readData();
  return data.terms;
}

// Get term by ID
function getTermById(id) {
  const data = readData();
  return data.terms.find(term => term.id === id);
}

// Add new term
function addTerm(termData) {
  const data = readData();
  
  // Generate unique ID
  const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
  
  const newTerm = {
    id,
    url: termData.url,
    title: termData.title,
    lastChecked: new Date().toISOString(),
    lastUpdated: termData.lastUpdated,
    detectionMethod: termData.detectionMethod,
    history: [
      {
        checkedAt: new Date().toISOString(),
        lastUpdated: termData.lastUpdated,
        changed: false
      }
    ]
  };
  
  data.terms.push(newTerm);
  writeData(data);
  return newTerm;
}

// Update term
function updateTerm(id, updates) {
  const data = readData();
  const termIndex = data.terms.findIndex(term => term.id === id);
  
  if (termIndex === -1) {
    return null;
  }
  
  const term = data.terms[termIndex];
  const previousLastUpdated = term.lastUpdated;
  
  // Update term fields
  term.title = updates.title !== undefined ? updates.title : term.title;
  term.lastChecked = new Date().toISOString();
  term.lastUpdated = updates.lastUpdated !== undefined ? updates.lastUpdated : term.lastUpdated;
  term.detectionMethod = updates.detectionMethod !== undefined ? updates.detectionMethod : term.detectionMethod;
  
  // Detect if date changed
  const changed = previousLastUpdated !== term.lastUpdated && previousLastUpdated !== "Unknown";
  
  // Add to history
  term.history.push({
    checkedAt: term.lastChecked,
    lastUpdated: term.lastUpdated,
    changed
  });
  
  data.terms[termIndex] = term;
  writeData(data);
  return term;
}

// Delete term
function deleteTerm(id) {
  const data = readData();
  const termIndex = data.terms.findIndex(term => term.id === id);
  
  if (termIndex === -1) {
    return false;
  }
  
  data.terms.splice(termIndex, 1);
  writeData(data);
  return true;
}

module.exports = {
  readData,
  writeData,
  getAllTerms,
  getTermById,
  addTerm,
  updateTerm,
  deleteTerm
};
