const express = require('express');
const router = express.Router();
const passport = require('passport');

// Login route
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Error during authentication:', err);
      return next(err);
    }
    if (!user) {
      console.log('Authentication failed:', info.message);
      return res.status(401).json({ message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('Error logging in user:', err);
        return next(err);
      }
      console.log(`User logged in: ${user.username}`);
      return res.json({ message: 'Logged in successfully' });
    });
  })(req, res, next);
});

// Logout route
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error logging out:', err);
      return res.status(500).json({ error: 'Error logging out' });
    }
    console.log('User logged out');
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user route
router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    console.log(`Authenticated user: ${req.user.username}`);
    res.json(req.user);
  } else {
    console.log('User is not authenticated');
    res.status(401).json({ error: 'Unauthorized' });
  }
});

module.exports = router;
