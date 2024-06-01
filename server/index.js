require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const cors = require('cors');


const app = express();

// before setting .env file
//const db = new sqlite3.Database('./placeToStay.db');
//after setting .env file below code
const db = new sqlite3.Database(process.env.DATABASE_URL || path.join(__dirname, 'placeToStay.db'));

// This middleware serve static files from the uploads directory to display the image for accommodations
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const authRoutes = require('./routes/auth');
const accommodationRoutes = require('./routes/accommodation');

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use('/api/accommodations', accommodationRoutes);
app.use('/api/auth', authRoutes);

// Passport config
passport.use(new LocalStrategy(
  (username, password, done) => {
    db.get('SELECT * FROM acc_users WHERE username = ? AND password = ?', [username, password], (err, user) => {
        if (err) return done(err);
        if (!user) return done(null, false, { message: 'Incorrect username.' });
        if (user.password !== password) return done(null, false, { message: 'Incorrect password.' });
        return done(null, user);
      });
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM acc_users WHERE id = ?', [id], (err, user) => {
    done(err, user);
  });
});


app.get('/', (req, res) => res.send('Welcome to PlacesToStay API'));

// This code was for debugging purposes
// It checks if the uploads directory exists and has the correct permissions to write (for adding images) and read (to display them)
//const uploadDir = path.join(__dirname, 'uploads');
//fs.access(uploadDir, fs.constants.R_OK | fs.constants.W_OK, (err) => {
//    if (err) {
//        console.error(`${uploadDir} is not readable/writable`, err);
//    } else {
//        console.log(`${uploadDir} is readable and writable`);
//    }
//});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
