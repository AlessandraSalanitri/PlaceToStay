import React, { useState, useEffect } from 'react';
import TypeLocationSearch from './components/TypeLocationSearch';
import AccommodationList from './components/AccommodationList';
import Map from './components/Map';
import Login from './components/Login';
import './App.css';

function App() {
  const [accommodations, setAccommodations] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedAccommodation, setSelectedAccommodation] = useState(null);
  const [viewAll, setViewAll] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/user', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (error) {
        console.error('Failed to fetch user', error);
      }
    };

    fetchUser();
  }, []);

  const handleSearch = (results) => {
    setAccommodations(results);
    setViewAll(false); // Reset viewAll state on new search
  };

  const fetchAllAccommodations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/accommodations');
      if (response.ok) {
        const data = await response.json();
        setAccommodations(data);
        setViewAll(true); // Set viewAll state to true when fetching all accommodations
      } else {
        alert('Error fetching all accommodations: ' + response.statusText);
      }
    } catch (error) {
      alert('Error fetching all accommodations: ' + error.message);
    }
  };

  const handleBook = async (accID) => {
    try {
      const response = await fetch(`http://localhost:5000/api/accommodations/${accID}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedAccommodation(data);
        setAccommodations([data]);
        setViewAll(false); // Reset viewAll state when booking a single accommodation
      } else {
        alert('Error fetching accommodation details: ' + response.statusText);
      }
    } catch (error) {
      alert('Error fetching accommodation details: ' + error.message);
    }
  };

  const handleUploadPhoto = async (accID, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('accID', accID);

    try {
      const response = await fetch('http://localhost:5000/api/accommodations/upload-photo', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
      } else {
        alert('Error uploading photo: ' + data.error);
      }
    } catch (error) {
      alert('Error uploading photo: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        setUser(null);
        alert('Logged out successfully');
      } else {
        alert('Error logging out: ' + response.statusText);
      }
    } catch (error) {
      alert('Error logging out: ' + error.message);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Welcome to Place To Stay</h1>
        {user ? (
          <div className="user-status">
            Logged in as {user.username}
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </div>
        ) : (
          <Login setUser={setUser} />
        )}
      </header>
      
      <div className="main-content">
        <div className="search-container">
          <TypeLocationSearch setResults={handleSearch} />
        </div>
        <div className="results-and-map">
          <div className="list-container">
            <AccommodationList accommodations={accommodations} onBook={handleBook} onUploadPhoto={handleUploadPhoto} />
          </div>
          <div className="map-container">
            <Map accommodations={accommodations} onBook={handleBook} fetchAllAccommodations={fetchAllAccommodations} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
