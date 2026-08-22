# bcrypt in visitation_api

## Library

`bcryptjs` — pure-JavaScript bcrypt, no native bindings required.

```bash
npm install bcryptjs
```

```js
const bcrypt = require('bcryptjs');
```

## Hashing a password

```js
const SALT_ROUNDS = 10; // matches the $2a$10$ prefix in existing user docs

async function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}
```

The salt rounds value of **10** matches the prefix already stored in the `users` collection (`$2a$10$...`).

## Verifying a password

```js
async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash); // returns true | false
}
```

## Password reset flow

1. Generate a random PIN (4 digits by default).
2. Allow the admin to edit the PIN before confirming.
3. Hash the PIN with `bcrypt.hash(pin, SALT_ROUNDS)`.
4. Update the `users` document: `{ $set: { password: hashedPin } }`.
5. Return the **plain PIN** in the response so the admin can communicate it to the user. Never store the plain PIN.

### API endpoint

```
PUT /api/users/:id/password
Body: { "password": "<plaintext pin>" }
Response: { "acknowledged": true, "modifiedCount": 1 }
```

## Generating a 4-digit PIN (server-side)

```js
function generatePin(digits = 4) {
  return String(Math.floor(Math.random() * Math.pow(10, digits))).padStart(digits, '0');
}
```

## Notes

- Existing passwords are stored as `$2a$10$...` — standard bcrypt with 10 rounds.
- The `password` field is always excluded from GET responses via `userExclusions = { password: 0 }`.
- Do not log plain passwords or PINs.
