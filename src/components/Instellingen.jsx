import { useState } from 'react';
import { DAGEN_KORT } from '../lib/datum.js';
import { downloadIcs } from '../lib/ics.js';

const DEEL_OPTIES = [
  { waarde: 'delen', naam: '👀 Alles delen' },
  { waarde: 'bezet', naam: '🔒 Alleen “bezet” tonen' },
  { waarde: 'verborgen', naam: '🙈 Helemaal verbergen' },
];

// Instellingen: je naam, uurloon, toeslagen en wat je partner mag zien
export default function Instellingen({ db, user, afspraken, mijnProfiel }) {
  const [naam, setNaam] = useState(mijnProfiel.naam || '');
  const [uurloon, setUurloon] = useState(mijnProfiel.uurloon || '');
  const [deelWerk, setDeelWerk] = useState(mijnProfiel.deelWerk || 'delen');
  const [deelPrive, setDeelPrive] = useState(mijnProfiel.deelPrive || 'bezet');
  const [toeslagen, setToeslagen] = useState(() => {
    try { return JSON.parse(mijnProfiel.toeslagen || '[]'); } catch { return []; }
  });
  const [opgeslagen, setOpgeslagen] = useState(false);

  function opslaan() {
    db.transact(
      db.tx.profielen[mijnProfiel.id].update({
        naam: naam.trim() || mijnProfiel.naam,
        uurloon: Number(uurloon) || 0,
        deelWerk,
        deelPrive,
        toeslagen: JSON.stringify(toeslagen),
      })
    );
    setOpgeslagen(true);
    setTimeout(() => setOpgeslagen(false), 2000);
  }

  function nieuweToeslag() {
    setToeslagen([...toeslagen, { label: 'Avondtoeslag', dagen: [1, 2, 3, 4, 5], van: '21:00', tot: '24:00', pct: 25 }]);
  }
  function wijzigToeslag(i, deel) {
    setToeslagen(toeslagen.map((t, j) => (j === i ? { ...t, ...deel } : t)));
  }
  function wisselDag(i, dag) {
    const regel = toeslagen[i];
    const dagen = regel.dagen.includes(dag) ? regel.dagen.filter((d) => d !== dag) : [...regel.dagen, dag];
    wijzigToeslag(i, { dagen });
  }

  function exporteerAgenda() {
    const mijn = afspraken.filter((a) => a.eigenaar === user.email || a.categorie === 'samen');
    downloadIcs(mijn, 'transparant-agenda.ics');
  }

  return (
    <>
      <div className="kaart">
        <h2>🙋 Over jou</h2>
        <div className="veld">
          <label>Je naam</label>
          <input value={naam} onChange={(e) => setNaam(e.target.value)} />
        </div>
        <div className="veld">
          <label>Je bruto uurloon (€)</label>
          <input
            type="number" min="0" step="0.01" inputMode="decimal"
            value={uurloon}
            onChange={(e) => setUurloon(e.target.value)}
            placeholder="bijv. 14,50"
          />
        </div>
      </div>

      <div className="kaart">
        <h2>💸 Toeslagen</h2>
        <p style={{ fontSize: 13, color: 'var(--tekst-licht)', marginBottom: 10 }}>
          Krijg je extra betaald in de avond of het weekend? Voeg hier je toeslagen toe.
          <br />Tip: gaat een toeslag over middernacht heen? Maak er dan twee regels van
          (bijv. 22:00–24:00 en 00:00–02:00).
        </p>
        {toeslagen.map((t, i) => (
          <div key={i} className="toeslag-regel">
            <div className="velden-rij">
              <div className="veld" style={{ marginBottom: 0 }}>
                <label>Naam</label>
                <input value={t.label} onChange={(e) => wijzigToeslag(i, { label: e.target.value })} />
              </div>
              <div className="veld" style={{ marginBottom: 0, maxWidth: 90 }}>
                <label>Extra %</label>
                <input
                  type="number" min="0" inputMode="numeric"
                  value={t.pct}
                  onChange={(e) => wijzigToeslag(i, { pct: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="dag-knopjes">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <button key={d} type="button" className={t.dagen.includes(d) ? 'aan' : ''} onClick={() => wisselDag(i, d)}>
                  {DAGEN_KORT[d]}
                </button>
              ))}
            </div>
            <div className="velden-rij">
              <div className="veld" style={{ marginBottom: 0 }}>
                <label>Vanaf</label>
                <input type="time" value={t.van} onChange={(e) => wijzigToeslag(i, { van: e.target.value })} />
              </div>
              <div className="veld" style={{ marginBottom: 0 }}>
                <label>Tot</label>
                <input
                  type="time" value={t.tot === '24:00' ? '23:59' : t.tot}
                  onChange={(e) => wijzigToeslag(i, { tot: e.target.value === '23:59' ? '24:00' : e.target.value })}
                />
              </div>
              <button
                type="button" className="knop gevaar klein" style={{ alignSelf: 'flex-end' }}
                onClick={() => setToeslagen(toeslagen.filter((_, j) => j !== i))}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
        <button className="knop rustig" type="button" onClick={nieuweToeslag}>＋ Toeslag toevoegen</button>
      </div>

      <div className="kaart">
        <h2>🫣 Wat mag je partner zien?</h2>
        <div className="keuze-rij">
          <div>
            <div className="naam">💼 Je werk-afspraken</div>
          </div>
          <select value={deelWerk} onChange={(e) => setDeelWerk(e.target.value)}>
            {DEEL_OPTIES.map((o) => <option key={o.waarde} value={o.waarde}>{o.naam}</option>)}
          </select>
        </div>
        <div className="keuze-rij">
          <div>
            <div className="naam">🙋 Je privé-afspraken</div>
          </div>
          <select value={deelPrive} onChange={(e) => setDeelPrive(e.target.value)}>
            {DEEL_OPTIES.map((o) => <option key={o.waarde} value={o.waarde}>{o.naam}</option>)}
          </select>
        </div>
        <p style={{ fontSize: 12, color: 'var(--tekst-licht)', marginTop: 8 }}>
          💗 Samen-afspraken zijn altijd zichtbaar voor jullie allebei.
        </p>
      </div>

      <button className="knop" onClick={opslaan}>
        {opgeslagen ? 'Opgeslagen! ✅' : 'Instellingen opslaan 💾'}
      </button>

      <div style={{ height: 14 }} />

      <div className="kaart">
        <h2>📲 Telefoonagenda</h2>
        <p style={{ fontSize: 13, color: 'var(--tekst-licht)', marginBottom: 10 }}>
          Download al je afspraken als agenda-bestand. Als je het opent, vraagt je
          telefoon of je ze in je agenda-app (Apple/Google Agenda) wilt zetten.
          Een automatisch agenda-abonnement stellen we in zodra de app online staat.
        </p>
        <button className="knop rustig" onClick={exporteerAgenda}>⬇️ Download mijn agenda (.ics)</button>
      </div>

      <div className="kaart">
        <h2>🚪 Account</h2>
        <p style={{ fontSize: 13, color: 'var(--tekst-licht)', marginBottom: 10 }}>
          Ingelogd als <b>{user.email}</b>
        </p>
        <button className="knop rustig" onClick={() => db.auth.signOut()}>Uitloggen</button>
        <div style={{ height: 10 }} />
        <button
          className="knop gevaar"
          onClick={() => {
            if (confirm('Database-sleutel wissen? Je moet dan opnieuw je InstantDB App ID invullen.')) {
              localStorage.removeItem('ta-app-id');
              window.location.reload();
            }
          }}
        >
          Andere database-sleutel gebruiken
        </button>
      </div>
    </>
  );
}
