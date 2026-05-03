import { useState } from 'react';
// Assure-toi que le chemin de ton backend est correct
const API_URL = "http://localhost:5001/api/auth";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setEmail('');
      } else {
        setError(data.error || "Une erreur est survenue.");
      }
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion au serveur.");
    }
  };

  return (
    <div>
      <h2>Mot de passe oublié ?</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Votre adresse email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type="submit">Envoyer</button>
      </form>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default ForgotPassword;