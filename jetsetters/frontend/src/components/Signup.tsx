import { useState, useEffect } from 'react';
import { adminFirebaseAuth } from '../services/adminFirebaseAuth';
import seminaLogo from '../assets/semina_log_bg_removed.png';
import './Signup.css';

interface SignupProps {
  onSignupSuccess?: (email: string, verificationId?: string, userId?: string) => void;
  onNavigateToLogin?: () => void;
}

function Signup({ onSignupSuccess, onNavigateToLogin }: SignupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize invisible reCAPTCHA
    adminFirebaseAuth.initRecaptcha('recaptcha-container-signup', true);
    
    return () => {
      adminFirebaseAuth.clearRecaptcha();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (phoneNumber && !phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      setError('Please enter a valid phone number (e.g., +1234567890) or leave blank');
      return;
    }

    setLoading(true);

    // Step 1: Create user account
    const signupResult = await adminFirebaseAuth.signupWithEmail(email, password);

    if (!signupResult.success || !signupResult.user) {
      setLoading(false);
      setError(signupResult.error || 'Signup failed. Please try again.');
      return;
    }

    // Step 2: Optionally enroll MFA (skip if SMS MFA not enabled in Firebase)
    if (phoneNumber) {
      const enrollResult = await adminFirebaseAuth.enrollMFA(
        signupResult.user,
        phoneNumber,
        'recaptcha-container-signup'
      );

      if (enrollResult.success && enrollResult.verificationId && onSignupSuccess) {
        setLoading(false);
        onSignupSuccess(email, enrollResult.verificationId, signupResult.user.uid);
        return;
      }
      // If MFA not enabled in project (e.g. auth/operation-not-allowed), continue without MFA
      if (enrollResult.error && !enrollResult.error.includes('operation-not-allowed') && !enrollResult.error.includes('SMS')) {
        setLoading(false);
        setError(enrollResult.error || 'Failed to send verification code. Please try again.');
        return;
      }
    }

    setLoading(false);
    if (onSignupSuccess) {
      onSignupSuccess(email, undefined, signupResult.user.uid);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="logo-section">
          <img src={seminaLogo} alt="semina" className="auth-logo" />
        </div>
        
        <h1 className="signup-title">Create Account</h1>
        <p className="signup-subtitle">Create an account. SMS 2FA is optional.</p>
        
        {/* Hidden reCAPTCHA container */}
        <div id="recaptcha-container-signup"></div>

        <form onSubmit={handleSubmit} className="signup-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber" className="form-label">
              Phone Number (optional, for SMS 2FA)
            </label>
            <input
              type="tel"
              id="phoneNumber"
              className="form-input"
              placeholder="+1234567890 or leave blank"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
            />
            <small className="input-hint">Include country code. Leave blank to skip 2FA.</small>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="Create a password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="form-input"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="signup-button" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

          <div className="navigation-links">
            <span className="nav-text">Already have an account?</span>
            <button 
              type="button" 
              className="nav-link"
              onClick={onNavigateToLogin}
              disabled={loading}
            >
              Log In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;

