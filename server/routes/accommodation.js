const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');

const upload = multer({ dest: 'uploads/' });

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    console.log(`User ${req.user.username} is authenticated`);
    return next();
  }
  console.log('Please, login first.');
  res.status(401).json({ error: 'Please login first' });
}

router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Photo upload endpoint
router.post('/upload-photo', upload.single('photo'), (req, res) => {
  const { accID } = req.body;
  const photo = req.file;

  if (!accID || !photo) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

  const targetPath = path.join(__dirname, '..', 'uploads', `${accID}-${photo.originalname}`);
  const relativePath = `/uploads/${accID}-${photo.originalname}`;
  
  fs.rename(photo.path, targetPath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error uploading file' });
    }
    
    db.get('SELECT photo FROM accommodation WHERE id = ?', [accID], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      let updatedPhotos = relativePath;
      if (row.photo) {
        updatedPhotos = `${row.photo},${relativePath}`;
      }

      db.run('UPDATE accommodation SET photo = ? WHERE id = ?', [updatedPhotos, accID], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Photo uploaded successfully', photo: relativePath });
      });
    });
  });
});


// Look up all accommodation in a given location
router.get('/location/:location', (req, res) => {
  const location = req.params.location;
  //Below code - line 56 - act for debugging purposes
  console.log(`Searching accommodations in location: ${location}`);
  db.all('SELECT * FROM accommodation WHERE LOWER(location) = LOWER(?)', [location], (err, rows) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    // Split the photo field as an array
    rows.forEach(row => {
      row.photos = row.photo ? row.photo.split(',') : [];
    });
    console.log('Search results:', rows);
    res.json(rows);
  });
});



// Check-availability to book
router.post('/check-availability', isAuthenticated, (req, res) => {
  const { accID, thedate, npeople } = req.body;
  
  console.log(`Received parameters: ${JSON.stringify({ accID, thedate, npeople })}`);

  // This will make sure that thedate is a string and has the correct format
  const dateString = thedate.toString();

  // This checks if thedate has the format expected (YYYYMMDD)
  if (!/^\d{8}$/.test(dateString)) {
    console.log(`Invalid date format for thedate: ${dateString}`);
    return res.status(400).json({ error: 'Invalid date format' });
  }

  // current date and booking date
  const currentDate = new Date();
  const bookingDate = new Date(`${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`);
  
  console.log(`Current Date: ${currentDate.toISOString()}`);
  console.log(`Booking Date: ${bookingDate.toISOString()}`);

  if (bookingDate < currentDate) {
    console.log(`Sorry, You cannot book for a past date: ${bookingDate.toISOString()}`);
    return res.status(400).json({ error: 'Cannot book for a past date' });
  }

  // for debugging purposes
  console.log(`Executing query: SELECT availability FROM acc_dates WHERE accID = ? AND thedate = ? with values [ ${accID}, ${parseInt(dateString)} ]`);

  db.get('SELECT availability FROM acc_dates WHERE accID = ? AND thedate = ?', [accID, parseInt(dateString)], (err, row) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      console.log(`Accommodation not found for accID: ${accID} date: ${parseInt(dateString)}`);
      return res.status(404).json({ error: 'Accommodation not found' });
    }

    const newAvailability = row.availability - npeople;
    if (newAvailability < 0) {
      console.log(`Not enough availability for accID: ${accID} date: ${parseInt(dateString)}`);
      return res.status(400).json({ error: 'Not enough availability' });
    }

    res.json({ message: 'It is available! You can now insert your credit card details to confirm the booking!', accID, thedate, npeople });
  });
});


// complete booking with credit card validation
router.post('/complete-booking', isAuthenticated, (req, res) => {
  const { accID, thedate, npeople, creditCard } = req.body;
  
  if (!accID || !thedate || !npeople || !creditCard) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

  // mock payment validation
  if (!validateCreditCard(creditCard)) {
    return res.status(400).json({ error: 'Invalid credit card details' });
  }

  db.get('SELECT availability FROM acc_dates WHERE accID = ? AND thedate = ?', [accID, thedate], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Accommodation not found' });
    }

    const newAvailability = row.availability - npeople;
    if (newAvailability < 0) {
      return res.status(400).json({ error: 'Not enough availability' });
    }

    db.run('INSERT INTO acc_bookings (accID, thedate, username, npeople) VALUES (?, ?, ?, ?)', [accID, thedate, req.user.username, npeople], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      db.run('UPDATE acc_dates SET availability = ? WHERE accID = ? AND thedate = ?', [newAvailability, accID, thedate], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // display the remaining availability in the terminal
        console.log(`Booking confirmed for accID: ${accID}, date: ${thedate}. Remaining availability: ${newAvailability}`);

        res.json({ message: 'Booking successful', remainingAvailability: newAvailability });
      });
    });
  });
});

function validateCreditCard(cardNumber) {
  // This allow the test card number for testing purposes
  const testCardNumber = '4111111111111111';
  return cardNumber === testCardNumber || (cardNumber.length === 16 && /^\d+$/.test(cardNumber));
}


// Get all accommodation of a given type in a certain location
router.get('/type/:type/location/:location', (req, res) => {
  const { type, location } = req.params;
  console.log(`Fetching accommodations of type ${type} in location ${location}`);
  db.all('SELECT * FROM accommodation WHERE LOWER(type) = LOWER(?) AND LOWER(location) = LOWER(?)', [type, location], (err, rows) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    rows.forEach(row => {
      row.photos = row.photo ? row.photo.split(',') : [];
    });
    res.json(rows);
  });
});

// Handle combined search by type and location
router.get('/search', (req, res) => {
  const { type, location } = req.query;
  if (!location) {
    return res.status(400).json({ error: 'Please enter the desired location.' });
  }

  const query = type ? 
    'SELECT * FROM accommodation WHERE LOWER(type) = LOWER(?) AND LOWER(location) = LOWER(?)' : 
    'SELECT * FROM accommodation WHERE LOWER(location) = LOWER(?)';

  const params = type ? [type, location] : [location];

  console.log(`Fetching accommodations with query: ${query}`);
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    rows.forEach(row => {
      row.photos = row.photo ? row.photo.split(',') : [];
    });
    res.json(rows);
  });
});

//get all accommodation to displayed in the map
router.get('/', (req, res) => {
  db.all('SELECT * FROM accommodation', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      // Process each row to split the photos field
      rows.forEach(row => {
        row.photos = row.photo ? row.photo.split(',') : [];
      });
      res.json(rows);
    }
  });
});

// Route to get a specific accommodation
router.get('/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM accommodation WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      // below code is splitting the photo into an array
      row.photos = row.photo ? row.photo.split(',') : [];
      res.json(row);
    }
  });
});

module.exports = router;