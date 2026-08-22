
const e = require('express');
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const process = require('process');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const fs = require('fs');

// Load environment variables from .env.local or .env.production based on NODE_ENV
const env = process.env.NODE_ENV || 'local';
require('dotenv').config({ path: path.resolve(__dirname, `.env.${env}`) });

const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());


exclusions= { sequenceNumber: 0, _class: 0 ,listingSource : 0, deliverycode:0};

/**
 * Atomically increment and return the next sequence value.
 * @param {import('mongodb').Db} db
 * @param {string} sequenceId
 * @returns {Promise<number>}
 */
async function generateNextSequence(db) {
  // Update the existing sequence document in-place (same strategy as the Java app).
  // Using findOneAndUpdate ensures atomicity and avoids duplicate key conflicts
  // when multiple apps share the same sequence collection.
  const latest = await db.collection('database_sequences').findOne({}, { sort: { _id: -1 } });
  if (!latest) throw new Error('No sequence document found in database_sequences');

  const result = await db.collection('database_sequences').findOneAndUpdate(
    { _id: latest._id },
    [{ $set: { seq: { $toString: { $add: [{ $toLong: '$seq' }, 1] } } } }],
    { returnDocument: 'after' }
  );

  return parseInt(result.seq);
}

const connectionstring = process.env.MONGODB_URI || 'mongodb://localhost:27017/listingdb';

console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`Using MongoDB: ${process.env.NODE_ENV === 'local' ? 'Local' : 'Remote'}`);
console.log(`Connection string: ${connectionstring}`);

const dbconnect = MongoClient.connect(connectionstring, {
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 3000,

});


const addressRouter = express.Router(); // Create a new Router

addressRouter.route('/addressList/search/:id').get((req, res, next) => {
  const id = req.params.id;
  console.log(`searching ${id}`);
  dbconnect.then(client => {
    let listingdb = client.db('listingdb');
    const address = listingdb.collection('listings').findOne({ _id: id });
    console.log(address.length);
    return address;
  }).then(result => {
    res.json(result);
  }).catch(err => {
    next(err);
  })
});

addressRouter.route('/addressList/search/city/:city').get((req, res, next) => {
  const city = req.params.city;
  console.log(`searching city ${city}`);
  dbconnect.then(client => {
    let listingdb = client.db('listingdb');
    const regex = new RegExp(city, 'i');
    const address = listingdb.collection('listings').find({
      city: regex
    }, { projection: exclusions}
    ).toArray();
    return address;
  }).then(result => {
    res.json(result);
  }).catch(err => {
    next(err);
  })
});


addressRouter.route('/addressList/search/name/:name').get((req, res, next) => {
  const name = req.params.name;
  console.log(`searching name  ${name}`);
  dbconnect.then(client => {
    let listingdb = client.db('listingdb');
    const regex = new RegExp(name, 'i');
    const address = listingdb.collection('listings').find({
      $or: [{ lastName: regex }, { firstName: regex }]
    }).toArray();
    return address;
  }).then(result => {
    res.json(result);
  }).catch(err => {
    next(err);
  })
});

addressRouter.route('/addressList/search/address/:address').get((req, res, next) => {
  const address = req.params.address;
  console.log(`searching  address ${address}`);
  const regex = new RegExp(address, 'i');
  dbconnect.then(client => {
    let listingdb = client.db('listingdb');
    const address = listingdb.collection('listings').find({
      $or:
        [
          { address1: regex },
          { address2: regex }
        ]
    }).toArray();
    console.log(address.length);
    return address;
  }).then(result => {
    res.json(result);
  }).catch(err => {
    next(err);
  })
});

addressRouter.route('/addressList/filter/students/').get((req, res, next) => {
  dbconnect.then(client => {
    let listingdb = client.db('listingdb');
    const address = listingdb.collection('listings').find({ students: { $exists: true, $ne: [] } },{projection: exclusions}).toArray();
    return address;
  }).then(result => {
    res.json(result);
  }).catch(err => {
    next(err);
  })
});


addressRouter.route('/addressList/filter/inactive/').get((req, res, next) => {
  dbconnect.then(client => {
    let listingdb = client.db('listingdb');
    const address = listingdb.collection('listings').find({ inactive: true }).toArray();
    return address;
  }).then(result => {
    res.json(result);
  }).catch(err => {
    next(err);
  })
});


addressRouter.route('/closeDB').get((req, res, next) => {
  dbconnect.then(client => {
    client.close();
    res.json({ message: "Database connection closed" });
  }).catch(err => {
    next(err);
  });
});

addressRouter.route('/addressList/:id').put((req, res, next) => {
  const id = req.params.id;
  const { firstName, lastName, unitId } = req.body;
  console.log(`updating ${id} ${firstName} ${lastName} unitId=${unitId}`);

  dbconnect.then(async client => {
    let listingdb = client.db('listingdb');
    const listings = listingdb.collection('listings');

    const currentListing = await listings.findOne(
      { _id: id },
      { projection: { unitId: 1, firstName: 1, lastName: 1 } }
    );
    if (!currentListing) {
      res.status(404).json({ error: `Listing ${id} not found` });
      return null;
    }

    const setFields = {};

    if (firstName !== undefined && firstName !== null && firstName !== '' && firstName !== currentListing.firstName) {
      setFields.firstName = firstName;
    }

    if (lastName !== undefined && lastName !== null && lastName !== '' && lastName !== currentListing.lastName) {
      setFields.lastName = lastName;
    }

    if (unitId !== undefined && unitId !== null && unitId !== '') {
      const nextUnitId = parseInt(unitId, 10);
      if (Number.isNaN(nextUnitId)) {
        res.status(400).json({ error: 'unitId must be a valid integer' });
        return null;
      }

      if (currentListing.unitId !== nextUnitId) {
        setFields.unitId = nextUnitId;
        console.log(`unitId changed for ${id}: ${currentListing.unitId} -> ${nextUnitId}`);
      }
    }

    if (Object.keys(setFields).length === 0) {
      return { acknowledged: true, matchedCount: 1, modifiedCount: 0 };
    }

    return listings.updateOne(
      { _id: id },
      [{ $set: { ...setFields, version: { $add: [{ $convert: { input: '$version', to: 'long', onError: 0, onNull: 0 } }, 1] } } }]
    );
  }).then(result => {
    if (!result) {
      return;
    }
    console.log(`updateListing ${id} - matched: ${result.matchedCount}, modified: ${result.modifiedCount}`);
    res.json(result);
  }).catch(err => {
    console.error(`updateListing ${id} error: ${err.message}`);
    next(err);
  });
});


addressRouter.route('/addressList/:id/address2').patch((req, res, next) => {
  const id = req.params.id;
  const { address2 } = req.body;

  if (address2 === undefined || address2 === null) {
    return res.status(400).json({ error: 'address2 is required' });
  }

  console.log(`updateAddress2 ${id} -> "${address2}"`);

  dbconnect.then(async client => {
    const listings = client.db('listingdb').collection('listings');
    const current = await listings.findOne({ _id: id }, { projection: { _id: 1 } });
    if (!current) {
      res.status(404).json({ error: `Listing ${id} not found` });
      return null;
    }
    return listings.updateOne(
      { _id: id },
      [{ $set: { address2: address2, version: { $add: [{ $convert: { input: '$version', to: 'long', onError: 0, onNull: 0 } }, 1] } } }]
    );
  }).then(result => {
    if (!result) return;
    console.log(`updateAddress2 ${id} - matched: ${result.matchedCount}, modified: ${result.modifiedCount}`);
    res.json(result);
  }).catch(err => {
    console.error(`updateAddress2 ${id} error: ${err.message}`);
    next(err);
  });
});

addressRouter.route('/addressList/filter/search/').post((req, res, next) => {
  console.log(req.body);
  const searchCriteria = req.body;
  const nameRegex = new RegExp(searchCriteria.name || '', 'i');
  const addressRegex = new RegExp(searchCriteria.address || '', 'i');
  const masjid_id = parseInt(searchCriteria.masjidId);
  const unit_id = parseInt(searchCriteria.unitId);
  const city_regex = new RegExp(searchCriteria.city || '', 'i');
  const _id = searchCriteria._id;

  // Optional filter parameters
  const showInactive = searchCriteria.showInactive === true;
  const filterByStudents = searchCriteria.filterByStudents || 'all'; // 'all', 'has', 'none'

  // if _id is passed then ignore all other search criteria
  if (_id) {
    console.log(`searching ${_id}`);
    dbconnect.then(client => {
      let listingdb = client.db('listingdb');
      const address = listingdb.collection('listings').find({ _id: _id }).toArray();
      console.log(address.length);
      return address;
    }).then(result => {
      res.json(result);
    }).catch(err => {
      next(err);
    });
    return;
  }

  console.log(`searching ${masjid_id} ${unit_id} ${nameRegex} ${addressRegex} ${city_regex} showInactive=${showInactive} filterByStudents=${filterByStudents}`);
  dbconnect.then(client => {
    let listingdb = client.db('listingdb');

    const masjidUnitCondition = [];
    if (!isNaN(masjid_id)) {
      masjidUnitCondition.push({ masjidId: masjid_id });
    }
    if (!isNaN(unit_id)) {
      masjidUnitCondition.push({ unitId: unit_id });
    }

    const queryConditions = [
      {
        $or: [
          { lastName: nameRegex },
          { firstName: nameRegex }
        ]
      },
      {
        $or: [
          { address1: addressRegex },
          { address2: addressRegex }
        ]
      },
      { city: city_regex }
    ];

    if (masjidUnitCondition.length > 0) {
      queryConditions.push({ $and: masjidUnitCondition });
    }

    // Active/inactive filter (default: only active records)
    if (showInactive) {
      queryConditions.push({ inactive: true });
    } else {
      queryConditions.push({ inactive: { $ne: true } });
    }

    // Students filter
    if (filterByStudents === true || filterByStudents === 'true') {
      queryConditions.push({ students: { $exists: true, $ne: [] } });
    }

    const address = listingdb.collection('listings').find({
      $and: queryConditions
    }, { projection: exclusions }).toArray();
    console.log(address.length);
    return address;

  }).then(result => {
    console.log(`return ${masjid_id} ${unit_id} ${result.length} records`);
    res.json(result);
  }).catch(err => {
    next(err);
  })
});

addressRouter.get('/addressList/list/', (req, res, next) => { // Handle GET requests to /api/addressList
  const { masjid_id, unit_id } = req.query;
  console.log(`searching ${masjid_id} ${unit_id}`);
  const query = { masjidId: parseInt(masjid_id), inactive: false };
  if (unit_id !== undefined && unit_id !== '') {
    query.unitId = parseInt(unit_id);
  }
  dbconnect.then(client => {
    let listingdb = client.db('listingdb');
    return listingdb.collection('listings').find(query).toArray();
  }).then(result => {
    console.log(`found ${result.length} addressList`);
    res.json(result);
  }).catch(err => {
    next(err);
  });
});

addressRouter.route('/addressList/visit/:id').put((req, res, next) => {
  const id = req.params.id;
  const { lastmodifieddate, response, comment } = req.body;

  const modifiedDate = lastmodifieddate ? new Date(lastmodifieddate) : new Date();

  const visitEntry = {
    createdDate: modifiedDate,
    comments: comment,
    response: response
  };

  if (!visitEntry.response) {
    return res.status(400).json({ error: 'visitEntry with a response field is required' });
  }

  console.log(`updateVisit ${id} - response: ${visitEntry.response}, date: ${modifiedDate}`);

  dbconnect.then(async client => {
    let listingdb = client.db('listingdb');
    const current = await listingdb.collection('listings').findOne({ _id: id }, { projection: { version: 1 } });
    const nextVersion = (parseInt(current?.version) || 0) + 1;

    const visitFields = {
      lastModifiedDate: modifiedDate,
      latestResponse: visitEntry.response,
      version: nextVersion
    };
    if (visitEntry.response === 'Duplicate') {
      console.log(`marking listing as inactive for id: ${id}`);
      visitFields.inactive = true;
    }

    return listingdb.collection('listings').updateOne(
      { _id: id },
      {
        $set: visitFields,
        $push: { visitHistory: visitEntry }
      }
    );
  }).then(result => {
    console.log(`updateVisit ${id} - matched: ${result.matchedCount}, modified: ${result.modifiedCount}`);
    res.json(result);
  }).catch(err => {
    console.error(`updateVisit ${id} error: ${err.message}`);
    next(err);
  });
});

/*
  request body should contain the new address object, e.g.
  {
    "address1": "123 Main St",
    "address2": "Apt 4B",

    "city": "Anytown",
    "state": "CA",
    "zipcode": 12345,
    "masjidId": 1,
    "unitId": 1,
    "firstName": "John",
    "lastName": "Doe",
    "response": "",
    "source": "web",
    "visitedDate": "2025-31-08",

  }
*/

addressRouter.route('/addressList').post((req, res, next) => {
  const request_body = req.body;
  console.log('addAddress payload:', request_body);

  dbconnect.then(async client => {
    let listingdb = client.db('listingdb');

    const nextId = await generateNextSequence(listingdb);
    const newId = String(nextId);
    console.log(`addListing - next sequence: ${newId}`);
    const newAddress = { ...request_body };
    newAddress._id = newId;
    delete newAddress.visitedDate;
    delete newAddress.source; // source is not part of the schema; use listingSource instead

    newAddress.inactive = false;
    newAddress._class = "com.markaz.visitation.model.Listing";
    newAddress.listingSource = request_body.listingSource || "gsheets.unmatched.v0";
    newAddress.version = 0; // Initialize version to 0 for new listings. Important attribute for updates
    newAddress.deliverycode = 0;
    newAddress.latitude = request_body.latitude || 0;
    newAddress.longitude = request_body.longitude || 0;
    newAddress.zipcode = parseInt(request_body.zipcode, 10) || 0;
    newAddress.met = /\bmet\b/i.test(newAddress.latestResponse || '') && !/not met/i.test(newAddress.latestResponse || '');

    if (request_body.visitedDate) {
      newAddress.lastModifiedDate = new Date(request_body.visitedDate);
      newAddress.visitHistory = [
        {
          createdDate: newAddress.lastModifiedDate,
          comments: newAddress.comments,
          response: newAddress.latestResponse
        }
      ];
    }
    


    const result = await listingdb.collection('listings').insertOne(newAddress);
    console.log(`addListing - inserted _id: ${newId}`);
    return { acknowledged: result.acknowledged, _id: newId };
  }).then(result => {
    res.status(201).json(result);
  }).catch(err => {
    console.error(`addListing error: ${err.message}`);
    next(err);
  });
});

addressRouter.route('/addressList/bulk/area').put((req, res, next) => {
  const { ids, area } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' });
  }
  if (!area || typeof area !== 'string') {
    return res.status(400).json({ error: 'area must be a non-empty string' });
  }

  console.log(`bulkUpdateArea - updating ${ids.length} listings to area: "${area}"`);

  dbconnect.then(client => {
    let listingdb = client.db('listingdb');
    return listingdb.collection('listings').updateMany(
      { _id: { $in: ids } },
      [{ $set: { area: area, version: { $add: [{ $convert: { input: '$version', to: 'long', onError: 0, onNull: 0 } }, 1] } } }]
    );
  }).then(result => {
    console.log(`bulkUpdateArea - matched: ${result.matchedCount}, modified: ${result.modifiedCount}`);
    res.json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
  }).catch(err => {
    console.error(`bulkUpdateArea error: ${err.message}`);
    next(err);
  });
});

// ── Masjid Management (read-only) ───────────────────────────────────────────

addressRouter.get('/masjids', (req, res, next) => {
  const { search } = req.query; // optional partial name search
  dbconnect.then(client => {
    const db = client.db('listingdb');
    const query = search
      ? { name: new RegExp(search, 'i') }
      : {};
    return db.collection('masjids').find(query).toArray();
  }).then(result => {
    res.json(result);
  }).catch(next);
});

addressRouter.get('/masjids/:id', (req, res, next) => {
  const rawId = req.params.id;
  const numericId = parseInt(rawId, 10);
  const idQuery = isNaN(numericId)
    ? { $or: [{ _id: rawId }] }
    : { $or: [{ _id: rawId }, { _id: numericId }, { id: numericId }] };

  dbconnect.then(client => {
    const db = client.db('listingdb');
    return db.collection('masjids').findOne(idQuery);
  }).then(result => {
    if (!result) return res.status(404).json({ error: `Masjid ${rawId} not found` });
    res.json(result);
  }).catch(next);
});

// ── End Masjid Management ────────────────────────────────────────────────────

// ── User Management (read-only) ──────────────────────────────────────────────

const userExclusions = { password: 0, _class: 0 };

addressRouter.get('/users', (req, res, next) => {
  const { search, masjidId } = req.query;
  dbconnect.then(client => {
    const db = client.db('listingdb');
    const query = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ email: regex }, { firstName: regex }, { lastName: regex }];
    }
    if (masjidId) {
      query.masjidId = parseInt(masjidId, 10);
    }
    return db.collection('users').find(query, { projection: userExclusions }).toArray();
  }).then(result => {
    res.json(result);
  }).catch(next);
});

addressRouter.get('/users/:id', (req, res, next) => {
  const rawId = req.params.id;
  dbconnect.then(client => {
    const db = client.db('listingdb');
    let idQuery;
    try {
      idQuery = { $or: [{ _id: new ObjectId(rawId) }, { email: rawId }] };
    } catch {
      idQuery = { email: rawId };
    }
    return db.collection('users').findOne(idQuery, { projection: userExclusions });
  }).then(result => {
    if (!result) return res.status(404).json({ error: `User ${rawId} not found` });
    res.json(result);
  }).catch(next);
});

const SALT_ROUNDS = 10;

addressRouter.put('/users/:id/password', (req, res, next) => {
  const rawId = req.params.id;
  const { password } = req.body;
  if (!password || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ error: 'password is required' });
  }
  bcrypt.hash(password.trim(), SALT_ROUNDS).then(hashed => {
    return dbconnect.then(client => {
      const db = client.db('listingdb');
      let idQuery;
      try {
        idQuery = { $or: [{ _id: new ObjectId(rawId) }, { email: rawId }] };
      } catch {
        idQuery = { email: rawId };
      }
      return db.collection('users').updateOne(idQuery, { $set: { password: hashed } });
    });
  }).then(result => {
    if (result.matchedCount === 0) return res.status(404).json({ error: `User ${rawId} not found` });
    console.log(`resetPassword ${rawId} - modified: ${result.modifiedCount}`);
    res.json({ acknowledged: result.acknowledged, modifiedCount: result.modifiedCount });
  }).catch(next);
});

// ── End User Management ──────────────────────────────────────────────────────

addressRouter.route('/dbStatus').get((req, res) => {
  const mongoUri = process.env.MONGODB_URI || '';
  const isLocal = mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1');
  const dbType = isLocal ? 'local' : 'remote';
  console.log(`Database Status Check: ${dbType}`);
  res.json({ 
    dbStatus: dbType
  });
});

app.use('/api', addressRouter); // Add the Router to the application

const swaggerSpec = yaml.load(fs.readFileSync(path.join(__dirname, 'docs/openapi.yaml'), 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((err, req, res, next) => {
  console.error(`Error: ${err}`);
  res.status(500).json({ error: err.message });
});

const port = process.env.PORT || 5000;

process.on('SIGINT', () => {
  console.log('Shutting down');
  dbconnect.then(client => {
    client.close();
  });
  process.exit();
});

app.listen(port, () => {
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`Server is running on port ${port}`);
  console.log('\nRegistered routes:');
  addressRouter.stack
    .filter(r => r.route)
    .forEach(r => {
      const methods = Object.keys(r.route.methods).map(m => m.toUpperCase()).join(', ');
      console.log(`  ${methods.padEnd(6)} ${baseUrl}${r.route.path}`);
    });
});