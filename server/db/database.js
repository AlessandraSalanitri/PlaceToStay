const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to database
const dbPath = path.resolve(__dirname, '../placeToStay.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to the database', err);
  } else {
    console.log('Successfully Connected to the SQLite database');
  }
});

module.exports = db;
