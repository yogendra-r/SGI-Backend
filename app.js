const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const logger = require('morgan');
const cors = require('cors');
const createError = require('http-errors');

require('dotenv').config();

const adminRouter = require('./routes/admin');
const leaderRouter = require('./routes/leaders');
const donationRouter = require('./routes/donation');

const app = express();

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/receipt', express.static(path.join(__dirname, 'receipt')));

// app.use('/receipt', express.static(process.cwd() + 'receipt'))
app.use(cors()); // Enable CORS for all routes

// Root URL
app.all('/', (req, res) => {
  res.send('root url');
});

// Leaders
app.use('/api/dev/leaders', leaderRouter);

// Admin
app.use('/api/dev/admin', adminRouter);

// Donation
app.use('/api/dev/donation', donationRouter);

// Error handling
app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message
    }
  });
});

// SSL Configuration
const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/basededatos.sgipanama.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/basededatos.sgipanama.com/fullchain.pem')
};

// Create HTTPS server
const PORT = 8080;
const server = https.createServer(sslOptions, app);



// Start server
server.listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}/`);
});

module.exports = app;