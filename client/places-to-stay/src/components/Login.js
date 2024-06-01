import React, { useState } from 'react';
import './Login.css';

const Login = ({ setUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json();
        alert(`Login failed: ${data.message}`);
        return;
      }
      const data = await response.json();
      alert(data.message);
      // Fetch the current user after logging in
      const userResponse = await fetch('http://localhost:5000/api/auth/user', {
        credentials: 'include',
      });
      const userData = await userResponse.json();
      setUser(userData);
    } catch (error) {
      console.error('Error during login:', error);
      alert('Error during login. Please try again.');
    }
  };

  return (
    <div className="login-container"> {}
      <div className="login-icon"> {}
        <span role="img" aria-label="user">👤</span> {}
      </div>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="username"
        className="login-input"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
        className="login-input"
      />
      <button onClick={handleLogin} className="login-button">login</button>
    </div>
  );
};

export default Login;