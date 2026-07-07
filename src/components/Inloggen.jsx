import { useState } from 'react';

// Inloggen zonder wachtwoord: je krijgt een code per e-mail (magic code).
export default function Inloggen({ db }) {
  const [stap, setStap] = useState('email'); // 'email' of 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [fout, setFout] = useState('');
  const [bezig, setBezig] = useState(false);

  async function stuurCode(e) {
    e.preventDefault();
    setFout('');
    setBezig(true);
    try {
      await db.auth.sendMagicCode({ email: email.trim() });
      setStap('code');
    } catch (err) {
      setFout(err.body?.message || 'Kon geen code versturen. Klopt je e-mailadres?');
    } finally {
      setBezig(false);
    }
  }

  async function controleerCode(e) {
    e.preventDefault();
    setFout('');
    setBezig(true);
    try {
      await db.auth.signInWithMagicCode({ email: email.trim(), code: code.trim() });
    } catch (err) {
      setFout(err.body?.message || 'Die code klopt niet, probeer het nog eens.');
      setBezig(false);
    }
  }

  return (
    <div className="midden-scherm">
      <div className="logo">🗓️</div>
      <h1>Transparant Agenda</h1>

      {stap === 'email' ? (
        <>
          <p>Log in met je e-mailadres. Je krijgt een inlogcode gemaild — geen wachtwoord nodig!</p>
          <form onSubmit={stuurCode}>
            <div className="veld">
              <label>E-mailadres</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jij@voorbeeld.nl"
                autoComplete="email"
              />
            </div>
            <button className="knop" type="submit" disabled={bezig}>
              {bezig ? 'Versturen…' : 'Stuur mij een code ✉️'}
            </button>
          </form>
        </>
      ) : (
        <>
          <p>
            We hebben een code gestuurd naar <b>{email}</b>.<br />
            Vul hem hieronder in:
          </p>
          <form onSubmit={controleerCode}>
            <div className="veld">
              <label>Inlogcode</label>
              <input
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                autoComplete="one-time-code"
              />
            </div>
            <button className="knop" type="submit" disabled={bezig}>
              {bezig ? 'Controleren…' : 'Inloggen 🔓'}
            </button>
            <br /><br />
            <button className="knop rustig" type="button" onClick={() => setStap('email')}>
              Ander e-mailadres
            </button>
          </form>
        </>
      )}

      {fout && <p style={{ color: '#dc2626', marginTop: 14 }}>{fout}</p>}
    </div>
  );
}
