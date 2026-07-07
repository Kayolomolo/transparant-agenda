import { useEffect, useMemo, useState } from 'react';
import { init, id } from '@instantdb/react';
import { maakDemoDb, demoGebruiker } from './lib/demo.js';
import { haalAppleAgenda } from './lib/apple.js';
import Inloggen from './components/Inloggen.jsx';
import Agenda from './components/Agenda.jsx';
import Salaris from './components/Salaris.jsx';
import Notities from './components/Notities.jsx';
import Instellingen from './components/Instellingen.jsx';
import SpraakKnop from './components/SpraakKnop.jsx';

// ======= Stap 1: InstantDB-sleutel invullen (eenmalig) =======
function SetupScherm({ onKlaar, onDemo }) {
  const [sleutel, setSleutel] = useState('');
  return (
    <div className="midden-scherm">
      <div className="logo">🗓️</div>
      <h1>Transparant Agenda</h1>
      <p>
        Welkom! Om te beginnen heeft de app een gratis <b>InstantDB-sleutel</b> nodig.
        Zo werkt het:
        <br /><br />
        1. Ga naar <b>instantdb.com</b> en maak een gratis account<br />
        2. Klik op <b>Create app</b> en geef hem een naam<br />
        3. Kopieer de <b>App ID</b> en plak hem hieronder
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const schoon = sleutel.trim();
          if (schoon.length > 10) onKlaar(schoon);
        }}
      >
        <div className="veld">
          <label>Jouw InstantDB App ID</label>
          <input
            value={sleutel}
            onChange={(e) => setSleutel(e.target.value)}
            placeholder="bijv. a1b2c3d4-…"
            autoComplete="off"
          />
        </div>
        <button className="knop" type="submit">Aan de slag 🚀</button>
        <div style={{ height: 10 }} />
        <button className="knop rustig" type="button" onClick={onDemo}>
          👀 Eerst even rondkijken (demo)
        </button>
      </form>
    </div>
  );
}

function Laadscherm({ tekst = 'Even laden…' }) {
  return (
    <div className="midden-scherm">
      <div className="logo">🗓️</div>
      <p>{tekst}</p>
    </div>
  );
}

// ======= Stap 2: profiel aanmaken na de eerste keer inloggen =======
function ProfielAanmaken({ db, user }) {
  const [naam, setNaam] = useState('');
  const KLEUREN = ['#7c3aed', '#ec4899', '#0ea5e9', '#f59e0b', '#10b981'];
  const [kleur, setKleur] = useState(KLEUREN[0]);

  function opslaan(e) {
    e.preventDefault();
    if (!naam.trim()) return;
    db.transact(
      db.tx.profielen[id()].update({
        email: user.email,
        naam: naam.trim(),
        kleur,
        uurloon: 0,
        toeslagen: '[]',
        deelWerk: 'delen',
        deelPrive: 'bezet',
      })
    );
  }

  return (
    <div className="midden-scherm">
      <div className="logo">👋</div>
      <h1>Hoi! Wie ben jij?</h1>
      <p>Je naam en kleur zijn zichtbaar voor je partner in de gedeelde agenda.</p>
      <form onSubmit={opslaan}>
        <div className="veld">
          <label>Je naam</label>
          <input value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="bijv. Kay" />
        </div>
        <div className="veld">
          <label>Je kleur</label>
          <div className="chips">
            {KLEUREN.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKleur(k)}
                style={{
                  width: 40, height: 40, borderRadius: 999, background: k,
                  border: kleur === k ? '3px solid #2e1065' : '3px solid transparent',
                }}
              />
            ))}
          </div>
        </div>
        <button className="knop" type="submit">Klaar! ✨</button>
      </form>
    </div>
  );
}

// ======= De app zelf (na inloggen) =======
function Hoofd({ db, user }) {
  const [tab, setTab] = useState('agenda');
  const [appleAfspraken, setAppleAfspraken] = useState([]);
  const { isLoading, error, data } = db.useQuery({ profielen: {}, afspraken: {} });

  const profielen = data?.profielen || [];
  const afspraken = data?.afspraken || [];
  const mijnProfiel = profielen.find((p) => p.email === user.email);
  const appleUrl = mijnProfiel?.appleAgendaUrl || '';

  // Jouw Apple/iCloud-agenda erbij laden (alleen zichtbaar voor jou)
  useEffect(() => {
    let actief = true;
    if (!appleUrl) {
      setAppleAfspraken([]);
      return;
    }
    haalAppleAgenda(appleUrl, user.email)
      .then((lijst) => { if (actief) setAppleAfspraken(lijst); })
      .catch(() => { if (actief) setAppleAfspraken([]); });
    return () => { actief = false; };
  }, [appleUrl, user.email]);

  if (isLoading) return <Laadscherm />;
  if (error) return <Laadscherm tekst={`Er ging iets mis: ${error.message}`} />;

  if (!mijnProfiel) return <ProfielAanmaken db={db} user={user} />;

  // Eigen afspraken + die uit je Apple-agenda samen in één lijst
  const alleAfspraken = [...afspraken, ...appleAfspraken];

  const TABS = [
    { id: 'agenda', emoji: '📅', naam: 'Agenda' },
    { id: 'salaris', emoji: '💶', naam: 'Salaris' },
    { id: 'notities', emoji: '📝', naam: 'Notities' },
    { id: 'instellingen', emoji: '⚙️', naam: 'Instellingen' },
  ];

  return (
    <>
      <header className="kop">
        <h1>🗓️ Transparant Agenda</h1>
        <span className="wie" style={{ background: mijnProfiel.kleur }}>
          {mijnProfiel.naam}
        </span>
      </header>

      <main className="inhoud">
        {tab === 'agenda' && (
          <Agenda db={db} user={user} profielen={profielen} afspraken={alleAfspraken} mijnProfiel={mijnProfiel} />
        )}
        {tab === 'salaris' && (
          <Salaris user={user} afspraken={afspraken} mijnProfiel={mijnProfiel} />
        )}
        {tab === 'notities' && (
          <Notities db={db} user={user} profielen={profielen} />
        )}
        {tab === 'instellingen' && (
          <Instellingen db={db} user={user} afspraken={afspraken} mijnProfiel={mijnProfiel} />
        )}
      </main>

      <SpraakKnop db={db} user={user} profielen={profielen} afspraken={alleAfspraken} />

      <nav className="tabbalk">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'actief' : ''} onClick={() => setTab(t.id)}>
            <span className="tab-emoji">{t.emoji}</span>
            {t.naam}
          </button>
        ))}
      </nav>
    </>
  );
}

function MetDatabase({ appId }) {
  const db = useMemo(() => init({ appId }), [appId]);
  const { isLoading, user, error } = db.useAuth();

  if (isLoading) return <Laadscherm />;
  if (error) return <Laadscherm tekst={`Inlogfout: ${error.message}`} />;
  if (!user) return <Inloggen db={db} />;
  return <Hoofd db={db} user={user} />;
}

// De database van Kay & vriendin — staat hier vast zodat de app direct werkt.
// (Een App ID is geen geheim: hij is toch zichtbaar voor iedereen die de app gebruikt.)
const STANDAARD_APP_ID = 'd217992d-fcff-41a3-85db-ea033f616c8d';

export default function App() {
  const [appId, setAppId] = useState(() => localStorage.getItem('ta-app-id') || STANDAARD_APP_ID);
  const [demo, setDemo] = useState(false);

  if (demo) {
    const demoDb = maakDemoDb();
    return <Hoofd db={demoDb} user={demoGebruiker} />;
  }

  if (!appId) {
    return (
      <SetupScherm
        onKlaar={(sleutel) => {
          localStorage.setItem('ta-app-id', sleutel);
          setAppId(sleutel);
        }}
        onDemo={() => setDemo(true)}
      />
    );
  }
  return <MetDatabase appId={appId} />;
}
