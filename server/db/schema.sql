CREATE TABLE IF NOT EXISTS accommodation (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(255),
    location VARCHAR(255),
    latitude FLOAT,
    longitude FLOAT,
    description TEXT,
    photo TEXT
);

CREATE TABLE IF NOT EXISTS acc_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(255),
  password VARCHAR(255),
  admin INTEGER
);

CREATE TABLE IF NOT EXISTS acc_dates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  accID INTEGER,
  thedate INTEGER,
  availability INTEGER
);

CREATE TABLE IF NOT EXISTS acc_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  accID INTEGER,
  thedate INTEGER,
  username VARCHAR(255),
  npeople INTEGER
);
