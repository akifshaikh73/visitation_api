const e = require('express');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;

class AddressAPI {
  constructor(db) {
    console.log('creating AddressAPI');
    this.db = db;
    this.router = express.Router();

    this.router.get('/search/:id', this.search.bind(this));
    this.router.get('/list/:masjid,:unit', this.list.bind(this));
    //this.router.post('/create', this.create.bind(this));
    //this.router.put('/modify/:id', this.modify.bind(this));
    //this.router.delete('/delete/:id', this.delete.bind(this));
  }

  async search(req, res) {
    const id = req.params.id;
    console.log(`v1 searching ${id}`);
    let address = await this.db.collection('listings').find({ _id: id }).toArray();
    console.log(`found ${address}`);
    res.json(address);
  }

  async list(req, res) {
    const masjid = req.params.masjid;
    const unit = req.params.unit;
    console.log(`listing for ${masjid} and ${unit}`);
    // filter by masjid and unit
    const addresses = await this.db.collection('listings').find({ masjidId: masjid, unitId: unit }).toArray();
    res.json(addresses);
  }

  async create(req, res) {
    const newAddress = req.body;
    console.log(`creating {newAddress}`);
    const result = await this.db.collection('listings').insertOne(newAddress);
    res.json(result);
  }

  async modify(req, res) {
    const id = req.params.id;
    const updatedAddress = req.body;
    const result = await this.db.collection('listings').updateOne({ _id: id }, { $set: updatedAddress });
    res.json(result);
  }

  async delete(req, res) {
    console.log('deleting {id}');
    const id = req.params.id;
    const result = await this.db.collection('listings').deleteOne({ _id: id });
    res.json(result);
  }
}

const app = express();
app.use(express.json());



let connectionstring = 'mongodb://localhost:27017';
if (process.env.NODE_ENV == 'local') {
  connectionstring = process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017';
  console.log(`using local connection string ${process.env.MONGODB_URI_LOCAL}`);
} else {
  connectionstring = process.env.MONGODB_URI || 'mongodb://localhost:27017'
  console.log(`using remote connection string ${process.env.MONGODB_URI}`);
}
console.log(`using connection string ${connectionstring}`);
console.log(`env ${process.env.NODE_ENV}`);

const mongoclient = MongoClient.connect(connectionstring, { useUnifiedTopology: true });
/*
app.use('/api', router);
let listingdb = null;
let addressAPI = null;
MongoClient.connect(connectionstring, { useUnifiedTopology: true })
  .then(client => {
    console.log('connected to database');
    listingdb = client.db('listingdb');
    addressAPI = new AddressAPI(listingdb);
    console.log('addressAPI created');
    app.use('/apiv1/addresses', addressAPI.router);
  })
  .catch(err => console.error(err));

*/

const addressRouter = express.Router(); // Create a new Router

addressRouter.route('/addresses/search/:id').get((req, res) => {
  const id = req.params.id;
  console.log(`searching ${id}`);
  mongoclient.then(client => {
    const address = listingdb.collection('listings').find({ _id: id }).toArray();
    console.log(`found ${address}`);
    address.then(result => {
      res.json(result);
    });
  });
});

app.use('/api', addressRouter); // Add the Router to the application

const port = process.env.PORT || 3000;

app.listen(3000, () => console.log('Server is running on port 3000'));