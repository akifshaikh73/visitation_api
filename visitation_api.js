const e = require('express');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const process = require('process');
const path = require('path');

// Load environment variables from .env.local or .env.production based on NODE_ENV
const env = process.env.NODE_ENV || 'local';
require('dotenv').config({ path: path.resolve(__dirname, `.env.${env}`) });

const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());


exclusions= { sequenceNumber: 0, _class: 0 ,listingSource : 0, deliverycode:0};

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
      { $set: setFields }
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

  dbconnect.then(client => {
    let listingdb = client.db('listingdb');
    return listingdb.collection('listings').updateOne(
      { _id: id },
      {
        $set: {
          lastModifiedDate: modifiedDate,
          latestResponse: visitEntry.response
        },
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

app.use((err, req, res, next) => {
  console.error(`Error: ${err}`);
  res.status(500).json({ error: err.message });
});

const port = process.env.PORT || 3000;

process.on('SIGINT', () => {
  console.log('Shutting down');
  dbconnect.then(client => {
    client.close();
  });
  process.exit();
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
  console.log('\nRegistered routes:');
  addressRouter.stack
    .filter(r => r.route)
    .forEach(r => {
      const methods = Object.keys(r.route.methods).map(m => m.toUpperCase()).join(', ');
      console.log(`  ${methods.padEnd(6)} /api${r.route.path}`);
    });
});