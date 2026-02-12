import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import './AdminSettings.css';

function AdminSettings() {
  const user = auth.currentUser;
  const currentEmail = user?.email ?? '';

  const [newEmail, setNewEmail] = useState(currentEmail);
  const [emailPassword, setEmailPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordCurrentPassword, setPasswordCurrentPassword] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEmailChanged = useMemo(() => {
    return !!currentEmail && newEmail.trim().toLowerCase() !== currentEmail.toLowerCase();
  }, [currentEmail, newEmail]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const reauthenticate = async (password: string) => {
    const activeUser = auth.currentUser;
    if (!activeUser || !activeUser.email) {
      throw new Error('No active authenticated user found.');
    }

    const credential = EmailAuthProvider.credential(activeUser.email, password);
    await reauthenticateWithCredential(activeUser, credential);
  };

  const handleUpdateEmail = async (event: FormEvent) => {
    event.preventDefault();
    clearMessages();

    if (!auth.currentUser) {
      setError('You must be logged in to update email.');
      return;
    }
    if (!newEmail.trim()) {
      setError('Please enter a valid email.');
      return;
    }
    if (!isEmailChanged) {
      setError('New email is the same as your current email.');
      return;
    }
    if (!emailPassword) {
      setError('Enter your current password to update email.');
      return;
    }

    try {
      setLoadingEmail(true);
      await reauthenticate(emailPassword);
      await updateEmail(auth.currentUser, newEmail.trim());
      setSuccess('Email updated successfully.');
      setEmailPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update email.';
      setError(message);
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleUpdatePassword = async (event: FormEvent) => {
    event.preventDefault();
    clearMessages();

    if (!auth.currentUser) {
      setError('You must be logged in to update password.');
      return;
    }
    if (!passwordCurrentPassword) {
      setError('Enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    try {
      setLoadingPassword(true);
      await reauthenticate(passwordCurrentPassword);
      await updatePassword(auth.currentUser, newPassword);
      setSuccess('Password updated successfully.');
      setPasswordCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password.';
      setError(message);
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <section className="settings-panel">
      <h2 className="settings-title">Account Settings</h2>
      <p className="settings-subtitle">
        Update your login credentials. Changes are saved to your Firebase authentication record.
      </p>

      {error && <div className="settings-alert error">{error}</div>}
      {success && <div className="settings-alert success">{success}</div>}

      <div className="settings-card-grid">
        <article className="settings-card">
          <h3>Update Email</h3>
          <p>Current email: <strong>{currentEmail || 'Not available'}</strong></p>

          <form onSubmit={handleUpdateEmail} className="settings-form">
            <label htmlFor="new-email">New email</label>
            <input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
            />

            <label htmlFor="email-current-password">Current password</label>
            <input
              id="email-current-password"
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
              required
            />

            <button
              type="submit"
              className="settings-action-btn"
              disabled={loadingEmail}
            >
              {loadingEmail ? 'Updating...' : 'Update Email'}
            </button>
          </form>
        </article>

        <article className="settings-card">
          <h3>Update Password</h3>
          <p>Choose a strong password with at least 8 characters.</p>

          <form onSubmit={handleUpdatePassword} className="settings-form">
            <label htmlFor="password-current">Current password</label>
            <input
              id="password-current"
              type="password"
              value={passwordCurrentPassword}
              onChange={(e) => setPasswordCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
              required
            />

            <label htmlFor="password-new">New password</label>
            <input
              id="password-new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
            />

            <label htmlFor="password-confirm">Confirm new password</label>
            <input
              id="password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              required
            />

            <button
              type="submit"
              className="settings-action-btn secondary"
              disabled={loadingPassword}
            >
              {loadingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </article>
      </div>
    </section>
  );
}

export default AdminSettings;
