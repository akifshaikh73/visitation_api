# Visitation API

A RESTful API for managing visitation data in the Markaz List application.

## Overview

The Visitation API is an Express.js server that provides endpoints for handling visitation records, integrated with MongoDB for data persistence.

## Prerequisites

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **MongoDB** (running locally or remote access)

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

The API uses environment variables to manage different configurations for local development and production environments.

### Environment Files

The project includes environment configuration files for different environments:

- **`.env.local`** - Local development configuration (uses MongoDB on `localhost:27017`)
- **`.env.production`** - Production configuration (uses remote MongoDB)
- **`.env.example`** - Template showing required variables (for developers)

**Required environment variables:**
```
NODE_ENV=local              # or "production"
MONGODB_URI=<connection>    # MongoDB connection string
PORT=3000                   # Server port
```

### Example Configuration

**Local Development (`.env.local`):**
```
NODE_ENV=local
MONGODB_URI=mongodb://localhost:27017/listingdb
PORT=3000
```

**Production (`.env.production`):**
```
NODE_ENV=production
MONGODB_URI=mongodb://user:password@cluster.mongodb.net/dbname
PORT=3000
```

## Running the API

### Local Development

Start the API in development mode with auto-reload on file changes using nodemon:

```bash
npm run dev
```

This uses `.env.local` and connects to MongoDB at `mongodb://localhost:27017/listingdb`

**Output example:**
```
NODE_ENV: local
Using MongoDB: Local
Connection string: mongodb://localhost:27017/listingdb
Server is running on port 3000
```

### Production

Start the API in production mode using the remote MongoDB:

```bash
npm run prod
```

This uses `.env.production` and connects to the remote MongoDB instance specified in that file.

**Output example:**
```
NODE_ENV: production
Using MongoDB: Remote
Connection string: mongodb://user:password@cluster...
Server is running on port 3000
```

### Default Start

```bash
npm start
```

This runs nodemon without specifying an environment (uses system defaults).

## npm Scripts

| Command | Description | Environment |
|---------|-------------|-------------|
| `npm start` | Default start with nodemon | System default |
| `npm run dev` | Development mode with auto-reload | Local (`.env.local`) |
| `npm run prod` | Production mode | Production (`.env.production`) |
| `npm test` | Run tests | N/A |

## Dependencies

- **express** (^4.19.2) - Web framework
- **mongodb** (^6.6.2) - MongoDB client driver
- **cors** (^2.8.5) - CORS middleware for cross-origin requests
- **dotenv** (^16.0.0) - Environment variable management
- **nodemon** (^3.1.0) - Auto-reload on file changes (development)
- **cross-env** (^7.0.3) - Cross-platform environment variable support

## Project Structure

```
visitation_api/
├── visitation_api.js      # Main API server
├── address_api.js         # Address API integration
├── package.json           # Project metadata and dependencies
├── .env.local             # Local development config (gitignored)
├── .env.production        # Production config (gitignored)
├── .env.example           # Configuration template
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## MongoDB Connection

The API automatically selects the appropriate MongoDB connection based on the NODE_ENV variable:

- **Local**: `mongodb://localhost:27017/listingdb`
- **Production**: Remote MongoDB cluster (from `.env.production`)

Connection settings:
- Unified topology: Enabled
- Server selection timeout: 3000ms

## Troubleshooting

### MongoDB Connection Failed

**Local:**
```bash
# Ensure MongoDB is running
mongod
```

**Production:**
- Verify `MONGODB_URI` in `.env.production` is correct
- Check network connectivity to MongoDB cluster
- Verify credentials and IP whitelist

### Port Already in Use

Change the PORT environment variable:
```bash
# PowerShell
$env:PORT = 5000
npm run dev

# Command Prompt
set PORT=5000
npm run dev
```

Or modify the PORT in the respective `.env` file.

### Modules Not Found

```bash
npm install
# or with legacy peer deps flag if needed
npm install --legacy-peer-deps
```

### Auto-reload Not Working

Ensure `visitation_api.js` is in the watch list in `package.json` nodemonConfig.

## Environment Switching

To quickly switch between environments:

**Switch to Production:**
```bash
npm run prod
```

**Switch to Local:**
```bash
npm run dev
```

## Author

Akif

## License

ISC