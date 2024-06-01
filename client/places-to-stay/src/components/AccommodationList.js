import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../App.css';

const AccommodationList = ({ accommodations, onCheckAvailability, onBook, onUploadPhoto }) => {
  const [states, setStates] = useState([]);
  const [showBookingInputs, setShowBookingInputs] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [followUpMessage, setFollowUpMessage] = useState(''); // Add this state

  useEffect(() => {
    setStates(accommodations.map(acc => ({
      selectedDate: new Date(),
      npeople: 1,
      creditCard: '',
      availabilityMessage: '',
      selectedFile: null,
      photos: acc.photos || []
    })));

    setCurrentImageIndex(accommodations.reduce((acc, _, index) => {
      acc[index] = 0;
      return acc;
    }, {}));
  }, [accommodations]);

  const handleStateChange = (index, key, value) => {
    setStates(prevStates => {
      const newStates = [...prevStates];
      newStates[index][key] = value;
      return newStates;
    });
  };

  const handleCheckAvailability = async (accID, index) => {
    const { selectedDate, npeople } = states[index];
    const formattedDate = selectedDate.toISOString().split('T')[0].replace(/-/g, '');

    try {
      const response = await fetch('http://localhost:5000/api/accommodations/check-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accID,
          thedate: formattedDate,
          npeople,
        }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        handleStateChange(index, 'availabilityMessage', 'Fantastic! You can now insert your credit card details to confirm the booking!');
        handleStateChange(index, 'accID', accID);
        
        // Display follow-up message after a delay
        setTimeout(() => {
          setFollowUpMessage('For testing, proceed with the credential "4111111111111111" to finalize your booking.');
        }, 3000); // Change message after 3 seconds

      } else {
        handleStateChange(index, 'availabilityMessage', data.error);
      }
    } catch (error) {
      handleStateChange(index, 'availabilityMessage', 'Error checking availability: ' + error.message);
    }
  };

  const handleCompleteBooking = async (index) => {
    const { selectedDate, npeople, accID, creditCard } = states[index];
    const formattedDate = selectedDate.toISOString().split('T')[0].replace(/-/g, '');

    try {
      const response = await fetch('http://localhost:5000/api/accommodations/complete-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accID,
          thedate: formattedDate,
          npeople,
          creditCard,
        }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        handleStateChange(index, 'availabilityMessage', '');
        handleStateChange(index, 'accID', null);
      } else {
        alert('Error booking accommodation: ' + data.error);
      }
    } catch (error) {
      alert('Error booking accommodation: ' + error.message);
    }
  };

  const handleFileChange = (index, accID, file) => {
    handleStateChange(index, 'selectedFile', { accID, file });
  };

  const handlePhotoUpload = async (index, accID) => {
    const { selectedFile } = states[index];
    if (!selectedFile || selectedFile.accID !== accID) {
      alert('Please select a photo to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('photo', selectedFile.file);
    formData.append('accID', accID);

    try {
      const response = await fetch('http://localhost:5000/api/accommodations/upload-photo', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }
      const data = await response.json();
      alert(data.message);

      setStates(prevStates => {
        const newStates = [...prevStates];
        newStates[index].photos = [...newStates[index].photos, data.photo];
        return newStates;
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error uploading photo: ' + error.message);
    }
  };

  const toggleBookingInputs = (index) => {
    setShowBookingInputs(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleNextImage = (index) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [index]: (prev[index] + 1) % states[index].photos.length
    }));
  };

  const handlePrevImage = (index) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [index]: (prev[index] - 1 + states[index].photos.length) % states[index].photos.length
    }));
  };

  return (
    <ul>
      {accommodations.map((acc, index) => (
        <li key={acc.id} className="accommodation-box">
          <div>
            <strong className="hotel-title">{acc.name} - {acc.type}</strong>
          </div>
          <div className="image-container">
            {states[index]?.photos && states[index].photos.length > 0 ? (
              <div className="image-slider">
                <button className="arrow arrow-left" onClick={() => handlePrevImage(index)}>&#8249;</button>
                <img
                  src={`http://localhost:5000${states[index].photos[currentImageIndex[index] || 0]}`}
                  alt={`${acc.name}`}
                  className="accommodation-photo"
                />
                <button className="arrow arrow-right" onClick={() => handleNextImage(index)}>&#8250;</button>
              </div>
            ) : (
              <div>No images available</div>
            )}
          </div>
          <div className="upload-section">
            <input
              type="file"
              onChange={(e) => handleFileChange(index, acc.id, e.target.files[0])}
            />
            <button onClick={() => handlePhotoUpload(index, acc.id)}>Upload Photo</button>
            <button onClick={() => toggleBookingInputs(index)}>Book</button>
          </div>
          {showBookingInputs[index] && (
            <div>
              <div className="date-people-section">
                <div className="date-input-container">
                  <label htmlFor={`date-${index}`}>Choose Date:</label>
                  <DatePicker
                    selected={states[index]?.selectedDate}
                    onChange={(date) => handleStateChange(index, 'selectedDate', date)}
                    dateFormat="yyyy-MM-dd"
                    className="date-input"
                  />
                </div>
                <div className="people-input-container">
                  <label htmlFor={`people-${index}`}>Number of People:</label>
                  <input
                    type="number"
                    value={states[index]?.npeople}
                    onChange={(e) => handleStateChange(index, 'npeople', e.target.value)}
                    id={`people-${index}`}
                    className="people-input"
                  />
                </div>
                <button onClick={() => handleCheckAvailability(acc.id, index)}>Check Availability</button>
              </div>
              {states[index]?.availabilityMessage && <p>{states[index].availabilityMessage}</p>}
              {followUpMessage && <p>{followUpMessage}</p>} {/* Display follow-up message */}
              {states[index]?.accID === acc.id && states[index].availabilityMessage?.includes('Fantastic') && (
                <div className="credit-card-section">
                  <input
                    type="text"
                    value={states[index]?.creditCard}
                    onChange={(e) => handleStateChange(index, 'creditCard', e.target.value)}
                    placeholder="Credit Card"
                  />
                  <button onClick={() => handleCompleteBooking(index)}>Book</button>
                </div>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

export default AccommodationList;
