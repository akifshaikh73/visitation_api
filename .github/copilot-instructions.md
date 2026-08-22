# Copilot Instructions — Visitation API

This is a **Node.js/Express REST API** for managing Markaz visitation listings, user authentication, and masjid data in MongoDB.

## Quick Start

**Local Dev:**
```bash
npm install
npm run dev          # NODE_ENV=local, auto-reload via nodemon
```

**Test the API:**
- Open `test.http` in REST client (VS Code REST Client or Postman)
- API runs on `http://localhost:3000/api`

**Stop Server:**
```powershell
.\scripts\stop.ps1
```

**Git Workflow (with prompts):**
```powershell
.\scripts\git-push.ps1                    # Interactive prompt for commit message
.\scripts\git-push.ps1 "Your message"     # Direct commit message parameter
```

## Key Files

- **`visitation_api.js`** — Main Express app; all routes here
- **`address_api.js`** — Address API integration  
- **`.env.local`** / **`.env.production`** — Database config (git-ignored)
- **`package.json`** — Dependencies and npm scripts
- **AGENT.md** — Full API reference & patterns (see for details)

## Authentication & Users

### Login Endpoints
- **`POST /api/users/login`** — Admin (email+PIN) or General (PIN-only)
  - Admin: `{ email, pin }` → `{ role: "admin", ... }`
  - General: `{ pin }` → `{ role: "general", ... }`
- Passwords hashed with **bcryptjs** (SALT_ROUNDS=10)
- See [docs/bcrypt.md](docs/bcrypt.md) for password reset

### User Management
- **`GET /api/users`** — List users
- **`GET /api/users/:id`** — Get single user
- **`PUT /api/users/:id/password`** — Update password (must hash)

## Address Listings

### Search & Filter
- **`GET /api/addressList/list`** — List by masjid/unit
- **`GET /api/addressList/search/:id`** — Find by ID
- **`POST /api/addressList/filter/search/`** — Advanced search

### Create & Update
- **`POST /api/addressList`** — Create listing (auto-assigns ID)
- **`PUT /api/addressList/:id`** — Update name/unit
- **`PUT /api/addressList/visit/:id`** — Record visit

See [docs/openapi.yaml](docs/openapi.yaml) for full OpenAPI spec.

## Common Patterns

### Error Handling
All routes use `try-catch` or `.catch(next)` for error middleware. Return JSON with status codes:
```js
res.status(400).json({ message: 'Error description' });
res.status(401).json({ message: 'Unauthorized' });
res.status(403).json({ message: 'Forbidden (account disabled)' });
```

### MongoDB Queries
- Connection: `dbconnect` promise resolves to client
- Database: `client.db('listingdb')`
- Collections: `users`, `addresses`, `masjids`, `database_sequences`
- Common: `.findOne()`, `.find().toArray()`, `.updateOne()`, `.insertOne()`

### Password Operations (bcryptjs)
```js
const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 10;

// Hash: await bcrypt.hash(plaintext, SALT_ROUNDS)
// Verify: await bcrypt.compare(plaintext, hash) → boolean
```

## Environment Variables

Required in `.env.local` or `.env.production`:
```
NODE_ENV=local|production
MONGODB_URI=mongodb://...
PORT=3000
```

- **Local**: `mongodb://localhost:27017/listingdb`
- **Production**: Remote MongoDB with credentials

## Documentation

- **[AGENT.md](AGENT.md)** — Full API routes, auth flows, security patterns, dev tips
- **[README.md](README.md)** — Setup & running
- **[docs/openapi.yaml](docs/openapi.yaml)** — OpenAPI/Swagger schema
- **[docs/bcrypt.md](docs/bcrypt.md)** — Password hashing & reset flow
- **[docs/changelog.md](docs/changelog.md)** — Version history

## Troubleshooting

**MongoDB connection fails?** Verify `.env.local` MONGODB_URI and local MongoDB is running.

**Port 3000 in use?** Change PORT in `.env.local` or kill process: `netstat -ano | findstr :3000`.

**Nodemon not reloading?** Check `nodemonConfig` in `package.json`—only watches `visitation_api.js` by default.

**Password/bcrypt issues?** Always hash before storing; never commit plaintext passwords. See [docs/bcrypt.md](docs/bcrypt.md).

---

**For comprehensive reference**: See [AGENT.md](AGENT.md) for full API documentation, authentication patterns, and development guidelines.
