const express = require('express');
const cors = require('cors');

const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
