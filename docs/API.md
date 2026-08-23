# Visitation API - Complete Endpoint Reference

All endpoints are prefixed with `/api`.

---

## Table of Contents

1. [Address Listings](#address-listings)
2. [User Authentication & Management](#user-authentication--management)
3. [Masjid Management](#masjid-management)
4. [Utility Endpoints](#utility-endpoints)

---

## Address Listings

### List Listings
**`GET /api/addressList/list/`**

List address listings by masjid and unit. Excludes inactive listings by default.

**Query Parameters:**
- `masjid_id` (string, optional) — Filter by masjid ID
- `unit_id` (string, optional) — Filter by unit ID

**Response:**
```json
{
  "listings": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "address1": "123 Main St",
      "address2": "Apt 4B",
      "city": "Anytown",
      "state": "CA",
      "zipcode": "12345",
      "masjidId": "1",
      "unitId": "2",
      "latestResponse": "Not Home",
      "visitedDate": "2025-08-18",
      "visitHistory": [],
      "inactive": false,
      "version": 1
    }
  ]
}
```

---

### Search Listing by ID
**`GET /api/addressList/search/:id`**

Find a single listing by `_id`.

**Response:**
```json
{
  "listing": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    ...
  }
}
```

**Error Responses:**
- `404` — Listing not found

---

### Search by City
**`GET /api/addressList/search/city/:city`**

Case-insensitive regex search for listings by city.

**Response:**
```json
{
  "listings": [
    { "_id": "507f1f77bcf86cd799439011", "city": "Anytown", ... }
  ]
}
```

---

### Search by Name
**`GET /api/addressList/search/name/:name`**

Search listings by firstName or lastName (case-insensitive).

**Response:**
```json
{
  "listings": [
    { "_id": "507f1f77bcf86cd799439011", "firstName": "John", "lastName": "Doe", ... }
  ]
}
```

---

### Search by Address
**`GET /api/addressList/search/address/:address`**

Search listings by address1 or address2 (case-insensitive).

**Response:**
```json
{
  "listings": [
    { "_id": "507f1f77bcf86cd799439011", "address1": "123 Main St", ... }
  ]
}
```

---

### Filter: Students
**`GET /api/addressList/filter/students/`**

Get listings with non-empty `students` array.

**Response:**
```json
{
  "listings": [
    { "_id": "507f1f77bcf86cd799439011", "students": ["Ahmad", "Fatima"], ... }
  ]
}
```

---

### Filter: Inactive Listings
**`GET /api/addressList/filter/inactive/`**

Get all listings marked as inactive.

**Response:**
```json
{
  "listings": [
    { "_id": "507f1f77bcf86cd799439011", "inactive": true, ... }
  ]
}
```

---

### Advanced Search
**`POST /api/addressList/filter/search/`**

Multi-field search with flexible filtering options.

**Request Body:**
```json
{
  "name": "John",
  "address": "Main St",
  "city": "Anytown",
  "masjidId": "1",
  "unitId": "2",
  "_id": null,
  "showInactive": false,
  "filterByStudents": false
}
```

**Notes:**
- If `_id` is provided, all other criteria are ignored
- `showInactive` — Include inactive listings in results (default: false)
- `filterByStudents` — Only return listings with non-empty students array

**Response:**
```json
{
  "listings": [
    { "_id": "507f1f77bcf86cd799439011", "firstName": "John", "city": "Anytown", ... }
  ]
}
```

---

### Create Listing
**`POST /api/addressList`**

Create a new address listing. Auto-assigns `_id` via `database_sequences`.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "address1": "123 Main St",
  "address2": "Apt 4B",
  "city": "Anytown",
  "state": "CA",
  "zipcode": "12345",
  "masjidId": "1",
  "unitId": "2",
  "latestResponse": "",
  "visitedDate": "2025-08-18",
  "students": [],
  "inactive": false
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "firstName": "John",
  "lastName": "Doe",
  "address1": "123 Main St",
  ...
}
```

**Error Responses:**
- `400` — Missing required fields

---

### Update Listing
**`PUT /api/addressList/:id`**

Update listing name and unit information. Auto-increments `version`.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe Updated",
  "unitId": "3"
}
```

**Response:**
```json
{
  "acknowledged": true,
  "modifiedCount": 1,
  "updatedListing": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe Updated",
    "unitId": "3",
    "version": 2,
    ...
  }
}
```

**Error Responses:**
- `404` — Listing not found
- `400` — Invalid request

---

### Update Address2 Only
**`PATCH /api/addressList/:id/address2`**

Update only the `address2` field.

**Request Body:**
```json
{
  "address2": "Suite 100"
}
```

**Response:**
```json
{
  "acknowledged": true,
  "modifiedCount": 1
}
```

---

### Record Visit
**`PUT /api/addressList/visit/:id`**

Record a visit to an address. Sets `latestResponse`, pushes to `visitHistory`, and optionally marks as inactive.

**Request Body:**
```json
{
  "latestResponse": "Home",
  "visitedDate": "2025-08-22"
}
```

**Special Behavior:**
- If `latestResponse: "Duplicate"`, sets `inactive: true`
- Pushes visit record to `visitHistory` array

**Response:**
```json
{
  "acknowledged": true,
  "modifiedCount": 1,
  "visitedListing": {
    "_id": "507f1f77bcf86cd799439011",
    "latestResponse": "Home",
    "visitHistory": [
      { "response": "Home", "date": "2025-08-22T00:00:00Z" }
    ],
    "inactive": false,
    ...
  }
}
```

**Error Responses:**
- `404` — Listing not found

---

### Bulk Update Area
**`PUT /api/addressList/bulk/area`**

Bulk-update the `area` field on multiple listings.

**Request Body:**
```json
{
  "ids": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "area": "Downtown"
}
```

**Response:**
```json
{
  "acknowledged": true,
  "modifiedCount": 2
}
```

---

## User Authentication & Management

### User Login
**`POST /api/users/login`**

Authenticate a user. Supports two paths:
1. **Admin login** — email + PIN
2. **General user login** — PIN only

**Admin Login (email required):**
```json
{
  "email": "admin@example.com",
  "pin": "1234"
}
```

**Response (Admin):**
```json
{
  "masjidSlug": "downtown-masjid",
  "masjids": ["downtown-masjid", "uptown-masjid"],
  "role": "admin",
  "email": "admin@example.com",
  "firstName": "Ahmed",
  "lastName": "Khan"
}
```

**General User Login (PIN only):**
```json
{
  "pin": "5678"
}
```

**Response (General):**
```json
{
  "masjidSlug": "downtown-masjid",
  "masjids": ["downtown-masjid"],
  "role": "general",
  "email": "user@example.com",
  "firstName": "Ali",
  "lastName": "Hassan"
}
```

**Error Responses:**
- `400` — PIN is required
- `401` — Invalid email or PIN; or invalid PIN for general login
- `403` — Account is disabled

---

### List All Users
**`GET /api/users`**

Retrieve all users from the database.

**Response:**
```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "admin@example.com",
      "firstName": "Ahmed",
      "lastName": "Khan",
      "masjidId": "1",
      "accessToMasjidIds": ["1", "2"],
      "enabled": true,
      "role": "admin"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "email": "user@example.com",
      "firstName": "Ali",
      "lastName": "Hassan",
      "masjidId": "1",
      "accessToMasjidIds": [],
      "enabled": true,
      "role": "general"
    }
  ]
}
```

---

### Get Single User
**`GET /api/users/:id`**

Retrieve a single user by `_id`.

**Response:**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "admin@example.com",
    "firstName": "Ahmed",
    "lastName": "Khan",
    "masjidId": "1",
    "accessToMasjidIds": ["1", "2"],
    "enabled": true,
    "role": "admin"
  }
}
```

**Error Responses:**
- `404` — User not found

---

### Update User Password
**`PUT /api/users/:id/password`**

Update a user's password. PIN must be hashed with bcryptjs before sending.

**Request Body:**
```json
{
  "password": "$2a$10$hashedPasswordHere"
}
```

**Notes:**
- Password must be pre-hashed using bcryptjs with SALT_ROUNDS=10
- Never send plaintext passwords
- See [bcrypt.md](bcrypt.md) for hashing examples

**Response:**
```json
{
  "acknowledged": true,
  "modifiedCount": 1
}
```

**Error Responses:**
- `404` — User not found
- `400` — Invalid request

---

## Masjid Management

### List All Masjids
**`GET /api/masjids`**

Retrieve all masjids. Optionally filter by name.

**Query Parameters:**
- `search` (string, optional) — Partial name filter (case-insensitive)

**Response:**
```json
{
  "masjids": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "id": 1,
      "name": "Downtown Masjid",
      "landing": "downtown-masjid",
      "address": "123 Main St",
      "city": "Anytown"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "id": 2,
      "name": "Uptown Masjid",
      "landing": "uptown-masjid",
      "address": "456 Oak Ave",
      "city": "Uptown"
    }
  ]
}
```

---

### Get Single Masjid
**`GET /api/masjids/:id`**

Retrieve a single masjid by `_id` or numeric `id`.

**Response:**
```json
{
  "masjid": {
    "_id": "507f1f77bcf86cd799439011",
    "id": 1,
    "name": "Downtown Masjid",
    "landing": "downtown-masjid",
    "address": "123 Main St",
    "city": "Anytown",
    "phone": "555-0123"
  }
}
```

**Error Responses:**
- `404` — Masjid not found

---

### Masjid Login
**`POST /api/masjids/login`**

Authenticate with a masjid PIN.

**Request Body:**
```json
{
  "masjidId": "1",
  "pin": "9999"
}
```

**Response:**
```json
{
  "authenticated": true,
  "masjidId": "1",
  "masjidName": "Downtown Masjid"
}
```

**Error Responses:**
- `400` — Missing required fields
- `401` — Invalid PIN

---

### Set/Update Masjid PIN
**`POST /api/masjids/:id/pin`**

Set or update the PIN for a masjid.

**Request Body:**
```json
{
  "pin": "9999"
}
```

**Response:**
```json
{
  "acknowledged": true,
  "modifiedCount": 1
}
```

**Error Responses:**
- `404` — Masjid not found
- `400` — Invalid request

---

## Utility Endpoints

### Database Status
**`GET /api/dbStatus`**

Check which database environment is currently connected.

**Response:**
```json
{
  "dbStatus": "local"
}
```

**Possible Values:**
- `"local"` — Connected to local MongoDB
- `"remote"` — Connected to remote MongoDB cluster

---

### Close Database Connection
**`GET /api/closeDB`**

Close the MongoDB connection. Useful for testing or cleanup.

**Response:**
```json
{
  "message": "Database connection closed"
}
```

---

## Error Handling

All error responses follow this format:

```json
{
  "message": "Error description"
}
```

**Common HTTP Status Codes:**

| Code | Meaning |
|------|---------|
| `200` | OK — Request successful |
| `201` | Created — Resource created successfully |
| `400` | Bad Request — Missing or invalid fields |
| `401` | Unauthorized — Invalid credentials |
| `403` | Forbidden — Account disabled or insufficient permissions |
| `404` | Not Found — Resource does not exist |
| `500` | Internal Server Error — Server-side error |

---

## Authentication Notes

### Password Security
- **Library**: bcryptjs (pure-JavaScript implementation)
- **Salt Rounds**: 10
- **Hash Function**: `bcrypt.hash(password, 10)`
- **Verification**: `bcrypt.compare(plaintext, hash)`

Example (Node.js):
```js
const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 10;

// Hashing
const hashedPassword = await bcrypt.hash(plaintext, SALT_ROUNDS);

// Verifying
const isMatch = await bcrypt.compare(plaintext, hashedPassword);
```

### User Roles

Two user roles are supported:

1. **Admin** (`role: "admin"`)
   - Authenticated via email + PIN
   - Has access to user management endpoints
   - Can manage multiple masjids via `accessToMasjidIds`

2. **General** (`role: "general"`)
   - Authenticated via PIN only
   - Limited access to specific resources
   - Assigned to a single primary masjid

---

## Testing with REST Client

Use VS Code REST Client or Postman to test endpoints. See `test.http` for example requests.

**Local Development URL:**
```
http://localhost:3000/api
```

**Production URL:**
```
https://visitation-api.onrender.com/api
```

---

## Related Documentation

- **[AGENT.md](../AGENT.md)** — AI agent guidelines and development patterns
- **[bcrypt.md](bcrypt.md)** — Password hashing and reset flow
- **[openapi.yaml](openapi.yaml)** — OpenAPI/Swagger specification
- **[README.md](../README.md)** — Setup and deployment instructions
