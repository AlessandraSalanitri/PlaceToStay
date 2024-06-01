import React, { useState } from 'react';
import '../App.css';

const Search = ({ setResults }) => {
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    if (!location) {
      setMessage('Please enter the desired location.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/accommodations/location/${location}`);
      if (!response.ok) {
        console.error('Error fetching data:', response.statusText);
        setMessage('An error occurred. Please try again.');
        return;
      }
      const data = await response.json();
      if (data.length === 0) {
        setMessage('Sorry, we do not have yet an accommodation in this location! Hold tight, we are adding more locations soon!');
      } else {
        setMessage('');
      }
      console.log('Search data:', data);
      setResults(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="search-container2">
      <div className="search-field2">
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

export default Search;
