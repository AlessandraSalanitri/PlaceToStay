import React, { useState } from 'react';
import '../App.css';

const TypeLocationSearch = ({ setResults }) => {
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    if (!location) {
      setMessage('Please enter the desired location.');
      return;
    }

    const queryParams = new URLSearchParams();
    if (type) queryParams.append('type', type);
    queryParams.append('location', location);

    try {
      const response = await fetch(`http://localhost:5000/api/accommodations/search?${queryParams.toString()}`);
      if (!response.ok) {
        console.error('Error fetching data:', response.statusText);
        setMessage('An error occurred while searching. Please try again.');
        return;
      }
      const data = await response.json();
      if (data.length === 0) {
        setMessage('Sorry, we do not have yet this type of accommodation in this location! Hold tight, we are adding more locations soon!');
      } else {
        setMessage('');
      }
      console.log('Search data:', data);
      setResults(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('An error occurred while searching. Please try again.');
    }
  };

  return (
    <div className="type-location-search">
      <div className="search-field">
        <label>Search By Type</label>
        <input
          type="text"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Enter type (e.g., hotel)"
        />
      </div>
      <div className="search-field">
        <label>Search By Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter location"
        />
      </div>
      <button onClick={handleSearch}>Search</button>
      {message && <p className="error-message">{message}</p>}
    </div>
  );
};

export default TypeLocationSearch;
