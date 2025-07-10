import React, { useState } from 'react';
import axios from 'axios';

function Register({ onSuccess }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/register', form);
      setMessage(res.data.message);
      if (res.data.message === 'Registered successfully') {
        onSuccess(); // Optionally login after registration
      }
    } catch (err) {
      setMessage('Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Register</h3>
      <input type="text" name="username" placeholder="Username" onChange={handleChange} />
      <input type="password" name="password" placeholder="Password" onChange={handleChange} />
      <button type="submit">Register</button>
      <p>{message}</p>
    </form>
  );
}

export default Register;