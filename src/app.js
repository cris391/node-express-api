const fs = require('fs');
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
const cors = require('cors');
const helmet = require('helmet');
const securityTxt = require('express-security.txt');
var https = require('https');
let credentials = null;
import models from './models';
import routes from './routes';

const app = express();
let port = 443;
app.use(helmet());

// Application-Level Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use((req, res, next) => {
  req.context = {
    models,
    me: models.users[1],
  };
  next();
});

// Routes

app.use('/session', routes.session);
app.use('/users', routes.user);
app.use('/messages', routes.message);

// Start

const pgpPublic = fs.readFileSync(`./secrets/contact-keys/pgp-public.txt`, 'utf8');
app.get(
  '/security.txt',
  securityTxt({
    // your security address
    contact: 'cfp@usertribe.com',
    // your pgp key
    encryption: pgpPublic,
  }),
);

try {
  const privateKey = fs.readFileSync('./secrets/certificate/key.key', 'utf8');
  const certificate = fs.readFileSync('./secrets/certificate/cert.crt', 'utf8');
  credentials = { key: privateKey, cert: certificate };
} catch (error) {
  console.log(`Missing certificate`);
}

if (credentials) {
  const PORT = process.env.PORT || 3000;
  var httpsServer = https.createServer(credentials, app);
  // httpsServer.listen(8443);
  httpsServer.listen(port);
  console.log(`Server running at http://localhost:${port}`);
} else {
  const PORT = process.env.PORT || 3000;
  const port = 80;
  app.listen(port, () => console.log(`Server running at http://localhost:${process.env.PORT}`));
}
app.listen(process.env.PORT, () => console.log(`Server running at http://localhost:${process.env.PORT}`));
