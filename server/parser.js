const axios = require('axios');
const cheerio = require('cheerio');

// Main function to fetch and parse URL
async function fetchAndParse(url) {
  try {
    // Fetch the URL with timeout and user agent
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TermsChecker/1.0)'
      }
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Extract title
    let title = $('title').text().trim();
    if (!title) {
      title = $('h1').first().text().trim();
    }
    if (!title) {
      title = 'Unknown';
    }
    
    // Try detection methods in order
    let lastUpdated = null;
    let detectionMethod = null;
    
    // 1. Meta tags
    const metaResult = checkMetaTags($);
    if (metaResult) {
      lastUpdated = metaResult;
      detectionMethod = 'meta-tag';
    }
    
    // 2. Structured data (JSON-LD)
    if (!lastUpdated) {
      const structuredResult = checkStructuredData($);
      if (structuredResult) {
        lastUpdated = structuredResult;
        detectionMethod = 'structured-data';
      }
    }
    
    // 3. Text parsing
    if (!lastUpdated) {
      const textResult = checkTextContent($);
      if (textResult) {
        lastUpdated = textResult;
        detectionMethod = 'text-parsing';
      }
    }
    
    // 4. HTTP headers
    if (!lastUpdated) {
      const headerResult = checkHttpHeaders(response.headers);
      if (headerResult) {
        lastUpdated = headerResult;
        detectionMethod = 'http-header';
      }
    }
    
    // 5. Default
    if (!lastUpdated) {
      lastUpdated = 'Unknown';
      detectionMethod = 'not-detected';
    }
    
    return {
      title,
      lastUpdated,
      detectionMethod
    };
    
  } catch (error) {
    // Handle different error types
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Request timeout - page took too long to load');
    } else if (error.response) {
      throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Network error - could not reach the URL');
    } else {
      throw new Error(`Failed to fetch URL: ${error.message}`);
    }
  }
}

// Check meta tags for dates
function checkMetaTags($) {
  const metaTags = [
    'article:modified_time',
    'last-modified',
    'og:updated_time',
    'revised',
    'date',
    'article:published_time'
  ];
  
  for (const tag of metaTags) {
    const content = $(`meta[property="${tag}"]`).attr('content') || $(`meta[name="${tag}"]`).attr('content');
    if (content) {
      const date = parseDate(content);
      if (date) return date;
    }
  }
  
  return null;
}

// Check structured data (JSON-LD)
function checkStructuredData($) {
  const scripts = $('script[type="application/ld+json"]');
  
  for (let i = 0; i < scripts.length; i++) {
    try {
      const content = $(scripts[i]).html();
      const data = JSON.parse(content);
      
      // Handle arrays
      const items = Array.isArray(data) ? data : [data];
      
      for (const item of items) {
        if (item.dateModified) {
          const date = parseDate(item.dateModified);
          if (date) return date;
        }
        if (item.datePublished) {
          const date = parseDate(item.datePublished);
          if (date) return date;
        }
      }
    } catch (e) {
      // Skip invalid JSON
      continue;
    }
  }
  
  return null;
}

// Check text content for dates
function checkTextContent($) {
  const keywords = [
    'last updated',
    'last modified',
    'effective date',
    'last revised',
    'updated on',
    'modified',
    'revision date',
    'date updated',
    'effective as of',
    'last amended',
    'version date'
  ];
  
  // Get first 2000 characters of body text
  const bodyText = $('body').text().substring(0, 2000);
  
  // Search for keywords and nearby dates
  for (const keyword of keywords) {
    const regex = new RegExp(keyword + '[:\\s]*([^\\n]{0,50})', 'i');
    const match = bodyText.match(regex);
    
    if (match) {
      const date = parseDate(match[1]);
      if (date) return date;
    }
  }
  
  return null;
}

// Check HTTP headers
function checkHttpHeaders(headers) {
  if (headers['last-modified']) {
    const date = parseDate(headers['last-modified']);
    if (date) return date;
  }
  return null;
}

// Parse various date formats and return YYYY-MM-DD
function parseDate(dateString) {
  if (!dateString) return null;
  
  const currentYear = new Date().getFullYear();
  const minYear = 2000;
  const maxYear = currentYear + 2;
  
  // Try ISO format (YYYY-MM-DD)
  const isoMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1]);
    if (year >= minYear && year <= maxYear) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }
  }
  
  // Try Month DD, YYYY
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                      'july', 'august', 'september', 'october', 'november', 'december'];
  const monthMatch = dateString.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})\b/i);
  if (monthMatch) {
    const year = parseInt(monthMatch[3]);
    if (year >= minYear && year <= maxYear) {
      const month = monthNames.indexOf(monthMatch[1].toLowerCase()) + 1;
      const day = monthMatch[2].padStart(2, '0');
      return `${year}-${month.toString().padStart(2, '0')}-${day}`;
    }
  }
  
  // Try DD Month YYYY
  const ddMonthMatch = dateString.match(/\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/i);
  if (ddMonthMatch) {
    const year = parseInt(ddMonthMatch[3]);
    if (year >= minYear && year <= maxYear) {
      const month = monthNames.indexOf(ddMonthMatch[2].toLowerCase()) + 1;
      const day = ddMonthMatch[1].padStart(2, '0');
      return `${year}-${month.toString().padStart(2, '0')}-${day}`;
    }
  }
  
  // Try MM/DD/YYYY
  const slashMatch = dateString.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (slashMatch) {
    const year = parseInt(slashMatch[3]);
    if (year >= minYear && year <= maxYear) {
      const month = slashMatch[1].padStart(2, '0');
      const day = slashMatch[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  
  // Try DD.MM.YYYY
  const dotMatch = dateString.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/);
  if (dotMatch) {
    const year = parseInt(dotMatch[3]);
    if (year >= minYear && year <= maxYear) {
      const month = dotMatch[2].padStart(2, '0');
      const day = dotMatch[1].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  
  // Try standard Date parsing as fallback
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      if (year >= minYear && year <= maxYear) {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
  
  return null;
}

module.exports = {
  fetchAndParse
};
