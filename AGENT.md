# Visitation API - Agent Guidelines

## Project Overview

**Visitation API** is a Node.js/Express REST API for managing address listings and visitation data in the Markaz List application. It provides endpoints for searching, filtering, and updating address records stored in MongoDB.

## Project Type
- **Framework**: Express.js (Node.js)
- **Database**: MongoDB (local or cloud-based)
- **Environment**: Node.js v14+
- **Package Manager**: npm

## Key Technologies
- **express** - Web framework
- **mongodb** - Database driver
- **cors** - Cross-origin requests
- **dotenv** - Environment variable management
- **nodemon** - Development auto-reload
- **cross-env** - Cross-platform environment variables

## Project Structure

```
visitation_api/
├── visitation_api.js          # Main API server (Express app)
├── address_api.js             # Address API integration
├── package.json               # Dependencies and npm scripts
├── .env.local                 # Local dev environment (git ignored)
├── .env.production            # Production environment (git ignored)
├── .env.example               # Environment template (committed)
├── .gitignore                 # Git ignore rules
├── README.md                  # Project documentation
└── AGENT.md                   # This file
```

## Key Files & Responsibilities

### visitation_api.js
**Main application file** containing:
- Express app initialization
- CORS and JSON middleware setup
- MongoDB connection logic with environment-based configuration
- Route definitions for address list operations
- Error handling middleware
- Server startup on configured PORT

**Important details:**
- Loads environment variables from `.env.${NODE_ENV}` based on NODE_ENV
- Connects to MongoDB using connection string from `process.env.MONGODB_URI`
- All routes prefixed with `/api`
- Uses error handler middleware at the end

### package.json
**Project metadata and scripts:**
- `npm start` - Default start (nodemon)
- `npm run dev` - Development mode (NODE_ENV=local)
- `npm run prod` - Production mode (NODE_ENV=production)
- Dependencies specified with versions
- nodemonConfig for development file watching

### Environment Files
- `.env.local` - Local development (never commit)
- `.env.production` - Production credentials (never commit)
- `.env.example` - Template for developers (commit this)

**Critical**: Never commit `.env.local` or `.env.production` - they contain sensitive MongoDB credentials.

## API Routes

### Address Search Endpoints

**GET `/api/addressList/search/:id`**
- Search by address ID
- Returns single listing object

**GET `/api/addressList/search/city/:city`**
- Search by city (case-insensitive regex)
- Returns array of listings matching city

**GET `/api/addressList/search/name/:name`**
- Search by first or last name (case-insensitive)
- Returns array of matching listings

**GET `/api/addressList/search/address/:address`**
- Search by address1 or address2 (case-insensitive)
- Returns matching addresses

### Filter Endpoints

**GET `/api/addressList/filter/students/`**
- Returns listings with non-empty students array

**GET `/api/addressList/filter/inactive/`**
- Returns inactive listings

**POST `/api/addressList/filter/search/`**
- Advanced filtering with multiple criteria
- Body parameters: name, address, city, masjidId, unitId, _id
- If _id provided, ignores other criteria

**GET `/api/addressList/list/?masjid_id=X&unit_id=Y`**
- Returns listings for specific masjid and unit
- Query parameters: masjid_id, unit_id

### Update Endpoint

**PUT `/api/addressList/:id`**
- Update listing firstName/lastName
- Body: `{ firstName: string, lastName: string }`

### Database Endpoint

**GET `/api/closeDB`**
- Closes MongoDB connection
- Returns success message

## Environment Configuration

### Local Development
```
NODE_ENV=local
MONGODB_URI=mongodb://localhost:27017/listingdb
PORT=3000
```

### Production
```
NODE_ENV=production
MONGODB_URI=mongodb://[user]:[password]@[cluster]/[dbname]
PORT=3000
```

**Note**: For Render/other platforms, set environment variables in dashboard instead of `.env` files.

## Running the API

```bash
# Install dependencies
npm install

# Local development (with auto-reload)
npm run dev

# Production (local simulation)
npm run prod

# Default start
npm start
```

## MongoDB Database

**Database**: listingdb  
**Collection**: listings

**Document fields** (example):
- `_id` - Document ID
- `firstName` - First name
- `lastName` - Last name
- `address1` - Primary address
- `address2` - Secondary address
- `city` - City name
- `masjidId` - Masjid identifier (integer)
- `unitId` - Unit identifier (integer)
- `students` - Array of student info
- `inactive` - Boolean flag for inactive status
- `sequenceNumber`, `_class`, `listingSource`, `deliverycode` - Excluded fields

**Exclusions object** (fields to hide in responses):
```javascript
exclusions = { sequenceNumber: 0, _class: 0, listingSource: 0, deliverycode: 0 }
```

## Deployment

### Supported Platforms
- **Render** (recommended) - Free tier available
- **AWS Elastic Beanstalk** - Free tier 12 months
- **Railway** - Free tier
- **Heroku** - Paid (deprecated free tier)

### Render Deployment
1. Push code to GitHub (ensure no `.env` files committed)
2. Connect GitHub repo to Render
3. Set environment variables in Render dashboard:
   - `NODE_ENV`: production
   - `MONGODB_URI`: your MongoDB connection string
   - `PORT`: 3000
4. Deploy automatically

### Important
- Never commit `.env.local` or `.env.production`
- Set secrets in deployment platform dashboard
- `.gitignore` protects local environment files

## Common Workflows

### Adding a New API Endpoint
1. Define route in `visitation_api.js`
2. Add to `addressRouter`
3. Include error handling with `.catch(err => next(err))`
4. Test locally with `npm run dev`

### Updating Database Schema
1. Modify MongoDB documents directly (or create migration)
2. Update code to handle new/changed fields
3. Test with local MongoDB instance

### Switching Environments
```bash
# Local development
npm run dev  # Uses .env.local

# Production simulation
npm run prod  # Uses .env.production

# Production deployment
# Set NODE_ENV=production in Render dashboard
```

### Debugging
- Check logs with `npm run dev` or `npm run prod`
- MongoDB connection logs show which database is being used
- Server listens on configured PORT (default 3000)

## Security Notes

- **Credentials**: Never store in code, use environment variables
- **MongoDB Access**: Ensure IP whitelist includes deployment server
- **CORS**: Currently allows all origins - customize if needed
- **API Keys**: Can be added as middleware for production
- **HTTPS**: Required for production (Render provides free SSL)

## Performance Considerations

- Connection pooling handled by MongoDB driver
- useUnifiedTopology: true for modern connection management
- Server selection timeout: 3000ms
- Regex searches are case-insensitive for better UX
- Projections used to exclude unnecessary fields

## Future Enhancements

- Add API key authentication
- Add rate limiting
- Add request validation
- Add API documentation (Swagger/OpenAPI)
- Add comprehensive logging
- Add unit tests
- Optimize database queries with indexes
- Add pagination for large result sets

## Dependencies Management

When installing new packages:
```bash
npm install <package-name>
npm install --save-dev <dev-package>
npm audit  # Check for vulnerabilities
npm audit fix  # Auto-fix vulnerabilities
```

## Notes for Agent

- This is a straightforward REST API with MongoDB backend
- No authentication currently implemented (can be added)
- Code style: Promise-based async operations
- Error handling uses Express error middleware
- Port is configurable via environment variable
- Database name is hardcoded as 'listingdb'
