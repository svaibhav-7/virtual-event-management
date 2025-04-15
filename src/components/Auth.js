import React, { useState } from 'react';

// For demo purposes - in a real app, this would come from a backend
const validUsers = [
  { email: 'user@example.com', password: 'securePassword123' }
];

const Auth = ({ setIsAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Password length validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (isLogin) {
      // Login logic
      const user = validUsers.find(u => u.email === email && u.password === password);
      if (user) {
        setSuccessMessage('Login successful!');
        setIsAuthenticated(true);
      } else {
        setError('Invalid email or password');
      }
    } else {
      // Signup logic
      const userExists = validUsers.some(u => u.email === email);
      if (userExists) {
        setError('Email already registered');
      } else {
        // In a real app, you would send this to your backend
        validUsers.push({ email, password });
        setSuccessMessage('Account created successfully! Please login.');
        setIsLogin(true); // Switch to login after signup
        setEmail('');
        setPassword('');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="8"
          />
          <button type="submit">{isLogin ? 'Login' : 'Sign Up'}</button>
        </form>
        <p>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => {
            setIsLogin(!isLogin);
            setError('');
            setSuccessMessage('');
          }}>
            {isLogin ? 'Sign Up' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;
