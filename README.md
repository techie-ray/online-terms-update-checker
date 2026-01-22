# Terms & Conditions Update Checker

A full-stack web application that tracks when terms and conditions pages are last updated. Users can add multiple URLs, and the app automatically detects and displays the last update date for each page.

## Features

**Automatic Date Detection** - The application intelligently detects last updated dates using multiple strategies including meta tags, structured data (JSON-LD), text parsing, and HTTP headers.

**Update History Tracking** - Every check is recorded in a history log, allowing users to see when pages were checked and if the update date changed over time.

**Change Detection** - The system automatically detects when a terms page's last updated date changes and highlights it with a visual indicator.

**Color-Coded Dates** - Dates are color-coded based on age: green for recent (less than 30 days), yellow for moderate (30-180 days), orange for old (over 180 days), and gray for unknown.

**Responsive Design** - The interface works seamlessly on desktop and mobile devices with a modern purple gradient design and smooth animations.

**Persistent Storage** - All data is stored locally in a JSON file, surviving server restarts and accumulating history over time.

## Tech Stack

The backend is built with **Node.js** and **Express**, using **Axios** for HTTP requests and **Cheerio** for HTML parsing. The frontend uses vanilla **HTML**, **CSS**, and **JavaScript** without any frameworks. Data is persisted in a local JSON file, and **CORS** middleware enables cross-origin requests.

## Installation

First, ensure you have Node.js installed (version 14 or higher). Clone the repository and navigate to the project directory:

```bash
cd terms-checker
```

Install the dependencies using npm or pnpm:

```bash
npm install
# or
pnpm install
```

## Usage

Start the server with the following command:

```bash
npm start
```

The application will be available at **http://localhost:3000**. Open this URL in your web browser to access the interface.

## How It Works

### Adding URLs

Enter a terms and conditions URL in the input field and click "Add URL". The application will fetch the page, extract the title, and attempt to detect the last updated date using multiple detection methods.

### Viewing History

Each term card displays a "View History" button showing the number of checks performed. Click this button to open a modal with the complete history of all checks, including timestamps and change indicators.

### Refreshing Terms

Use the "Refresh" button on individual cards to re-check a specific URL, or click "Refresh All" to update all tracked terms at once. The last refresh timestamp is displayed in the actions section.

### Deleting Terms

Click the "Delete" button on any term card to remove it from tracking. A confirmation dialog will appear before deletion.

## Detection Methods

The application uses a sophisticated multi-strategy approach to detect last updated dates:

**Meta Tags** - The parser first checks common meta tags including `article:modified_time`, `last-modified`, `og:updated_time`, `revised`, `date`, and `article:published_time`.

**Structured Data** - If meta tags don't provide a date, the parser looks for JSON-LD structured data in the page, extracting `dateModified` or `datePublished` properties.

**Text Parsing** - The parser searches the first 2000 characters of page text for keywords like "last updated", "last modified", "effective date", and others, then extracts nearby dates using multiple format patterns.

**HTTP Headers** - As a fallback, the parser checks the `Last-Modified` HTTP header returned by the server.

**Default** - If no date is found through any method, the system displays "Unknown" and marks the detection method as "not-detected".

## Date Formats

The parser supports multiple date formats including ISO format (YYYY-MM-DD), written formats like "January 15, 2025" or "15 January 2025", slash-separated dates (MM/DD/YYYY), and dot-separated dates (DD.MM.YYYY). All dates are normalized to YYYY-MM-DD format for consistent storage and display.

## API Endpoints

The application exposes the following REST API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/terms` | GET | Returns all tracked terms |
| `/api/terms` | POST | Adds a new term (requires `url` in body) |
| `/api/terms/:id` | DELETE | Deletes a term by ID |
| `/api/check/:id` | POST | Re-checks a specific term |
| `/api/check-all` | POST | Refreshes all tracked terms |

All endpoints return JSON responses with a `success` boolean and either the requested data or an error message.

## Project Structure

```
terms-checker/
├── server/
│   ├── server.js       - Express API server with all routes
│   ├── parser.js       - Date detection and HTML parsing logic
│   └── storage.js      - JSON file read/write operations
├── public/
│   ├── index.html      - Main frontend interface
│   ├── styles.css      - All styling
│   └── app.js          - Frontend JavaScript logic
├── package.json        - Dependencies and npm scripts
└── data.json           - Auto-generated data storage
```

## Configuration

The server runs on **port 3000** by default. To change this, modify the `PORT` constant in `server/server.js`.

The request timeout is set to **30 seconds** to accommodate slow-loading pages. This can be adjusted in the `parser.js` file.

The user agent is set to `Mozilla/5.0 (compatible; TermsChecker/1.0)` to ensure compatibility with most websites.

## Testing

The application has been tested with various popular websites including GitHub Terms of Service, Google Privacy Policy, and Twitter Terms of Service. All core functionality has been verified including URL addition, date detection, refresh operations, history tracking, change detection, and responsive design.

For detailed testing results, see the `TESTING.md` file in the project directory.

## Limitations

Some websites may not expose their last updated dates in standard formats, resulting in "Unknown" detection. This is expected behavior and indicates that the page doesn't provide machine-readable update information.

The current implementation uses JSON file storage, which is suitable for personal use but may need to be migrated to a database for high-volume scenarios.

## Future Enhancements

Potential improvements for future versions include migrating to a database (SQLite or PostgreSQL), implementing automatic scheduled checks, adding email notifications when terms change, supporting user authentication for multi-user scenarios, implementing caching to reduce redundant requests, and adding rate limiting to prevent abuse.

## License

This project is provided as-is for educational and personal use.

## Support

For issues or questions, please refer to the testing documentation or review the inline code comments for implementation details.
