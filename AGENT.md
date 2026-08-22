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

All routes are prefixed with `/api`. See [README.md](README.md) for setup.

### Listings — Search

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/addressList/search/:id` | Find listing by `_id` |
| `GET` | `/api/addressList/search/city/:city` | Case-insensitive city regex search |
| `GET` | `/api/addressList/search/name/:name` | Search firstName or lastName |
| `GET` | `/api/addressList/search/address/:address` | Search address1 or address2 |

### Listings — Filter & List

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/addressList/list/` | List by `?masjid_id=X&unit_id=Y`; excludes inactive |
| `GET` | `/api/addressList/filter/students/` | Listings with non-empty `students` array |
| `GET` | `/api/addressList/filter/inactive/` | Listings where `inactive: true` |
| `POST` | `/api/addressList/filter/search/` | Advanced multi-field search (see body below) |

`POST /filter/search/` body: `{ name, address, city, masjidId, unitId, _id, showInactive, filterByStudents }`. If `_id` is provided, all other criteria are ignored.

### Listings — Mutations

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/addressList` | Create new listing; auto-assigns `_id` via `database_sequences` |
| `PUT` | `/api/addressList/:id` | Update `firstName`, `lastName`, `unitId`; increments `version` |
| `PUT` | `/api/addressList/visit/:id` | Record a visit; sets `latestResponse`, pushes to `visitHistory`; sets `inactive=true` if response is `"Duplicate"` |
| `PUT` | `/api/addressList/bulk/area` | Bulk-set `area` on multiple listings; body: `{ ids: string[], area: string }` |
| `PATCH` | `/api/addressList/:id/address2` | Update `address2` field only |

### Masjids (read-only)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/masjids` | List all masjids; optional `?search=` partial name filter |
| `GET` | `/api/masjids/:id` | Get single masjid by `_id` or numeric `id` |

### Authentication & Users

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/users/login` | Authenticate user; supports **email+PIN** (admin) or **PIN-only** (general user) |
| `GET` | `/api/users` | List all users (admin endpoints) |
| `GET` | `/api/users/:id` | Get single user by `_id` |
| `PUT` | `/api/users/:id/password` | Update user's password (hashed with bcryptjs) |

**Authentication Details:**
- Uses **bcryptjs** with SALT_ROUNDS=10 for password hashing
- Email+PIN path: Admin login with email verification + PIN validation
- PIN-only path: General user login scanning enabled users for PIN match
- Response includes `role` field: `"admin"` or `"general"`
- Password reset: [See bcrypt.md](docs/bcrypt.md)

### Masjid Authentication

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/masjids/login` | Masjid login (PIN-based) |
| `POST` | `/api/masjids/:id/pin` | Set/update PIN for masjid |

### Utility

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/dbStatus` | Returns `{ dbStatus: "local" \| "remote" }` |
| `GET` | `/api/closeDB` | Closes MongoDB connection |



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

### Windows PowerShell Scripts

Located in `scripts/`:
- **`start.ps1`** — Start the API server with NODE_ENV=local
- **`status.ps1`** — Check if server is running on PORT 3000
- **`stop.ps1`** — Stop the running server process
- **`git-push.ps1`** — Interactive git workflow (stage, commit, push with prompts)

Usage:
```powershell
.\scripts\start.ps1 local       # Start local dev
.\scripts\start.ps1 prod        # Start production
.\scripts\status.ps1            # Check running status
.\scripts\stop.ps1              # Stop server
.\scripts\git-push.ps1          # Interactive git workflow
.\scripts\git-push.ps1 "msg"    # Git workflow with message parameter
```

## Security & Authentication Patterns

### Password Security
- **Library**: bcryptjs (pure-JavaScript, no native bindings)
- **Salt Rounds**: 10 (hardcoded, matches existing `$2a$10$` hashes in DB)
- **Hashing function**: `bcrypt.hash(password, SALT_ROUNDS)`
- **Verification**: `bcrypt.compare(plaintext, hash)` returns boolean
- See [docs/bcrypt.md](docs/bcrypt.md) for password reset flow

### Authentication Flow
**Admin Login (email + PIN):**
1. Receive `{ email, pin }` in request body
2. Find user by lowercase email; check if enabled
3. Compare PIN with bcryptjs hash
4. Return `{ role: "admin", masjidSlug, email, ... }`

**General User Login (PIN only):**
1. Receive `{ pin }` in request body (no email required)
2. Scan all enabled users for matching PIN
3. Return `{ role: "general", masjidSlug, email, ... }`

### Error Responses
- `400` — Missing required fields (PIN)
- `401` — Invalid credentials or disabled account
- `403` — Account is disabled

## Common Development Issues & Tips

1. **MongoDB Connection Fails**
   - Check `.env.local` MONGODB_URI points to running MongoDB
   - Local MongoDB must be running: `mongod` or Docker
   - Verify connection string format

2. **Port 3000 Already in Use**
   - Change PORT in `.env.local`
   - Or kill process: `netstat -ano | findstr :3000`

3. **Nodemon Not Reloading**
   - Check `nodemonConfig` in `package.json`
   - Only watches `visitation_api.js` by default
   - Edit `watch` array to add more files

4. **Password Reset Issues**
   - Always hash before storing: `await bcrypt.hash(pin, 10)`
   - Never store plaintext passwords
   - See [docs/bcrypt.md](docs/bcrypt.md) for flow

## Documentation

- **[README.md](README.md)** — Setup and running instructions
- **[docs/openapi.yaml](docs/openapi.yaml)** — Full OpenAPI/Swagger schema
- **[docs/bcrypt.md](docs/bcrypt.md)** — Password hashing & reset flow
- **[docs/changelog.md](docs/changelog.md)** — Version history and changes
- **AGENT.md** — This file (AI agent guidelines)

## Recent Changes & Features

- **User authentication with role differentiation** (admin vs general)
- **PIN-only login path** for general users without email
- **Masjid-based access control** via `masjidId` and `accessToMasjidIds`
- **Dynamic slug mapping** — Multiple masjids per user with landing page slugs
- See [docs/changelog.md](docs/changelog.md) for full history

## MongoDB Database

**Database**: listingdb  
**Collection**: listings

**Collections**: `listings`, `masjids`, `database_sequences`

**`listings` document fields**:
- `_id` (string) — auto-assigned from `database_sequences.seq`
- `firstName`, `lastName` — name fields
- `address1`, `address2`, `city`, `zipcode` — address
- `masjidId` (int), `unitId` (int) — assignment
- `area` (string) — bulk-assignable area label
- `inactive` (bool) — soft-delete; set `true` when `latestResponse = "Duplicate"`
- `latestResponse` (string) — most recent visit response
- `met` (bool) — true if latestResponse contains "met" but not "not met"
- `version` (long) — incremented on every update (optimistic concurrency)
- `lastModifiedDate` (Date)
- `visitHistory` (array) — `{ createdDate, response, comments }`
- `students` (array)
- `latitude`, `longitude` (number)
- `sequenceNumber`, `_class`, `listingSource`, `deliverycode` — legacy/internal, excluded from most responses via `exclusions` projection

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
1. Define route in `visitation_api.js` on `addressRouter`
2. Use promise chain ending in `.catch(err => next(err))`
3. Increment `version` on any mutation using the `$add/$convert` pipeline pattern already in the file
4. Update the routes table in `AGENT.md`
5. Test locally with `npm run dev`

### Recording a Visit
- Use `PUT /api/addressList/visit/:id`
- Body: `{ response, comment, lastmodifieddate? }`
- Automatically sets `inactive=true` when `response === "Duplicate"`
- Appends entry to `visitHistory` array

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
