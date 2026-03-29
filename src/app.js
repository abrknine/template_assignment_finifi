const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const documentRoutes = require('./routes/document.routes');
const matchRoutes = require('./routes/match.routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Connect to database
connectDB();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running');
});

app.use('/api/documents', documentRoutes);
app.use('/api/match', matchRoutes);

app.use(errorMiddleware);

module.exports = app;