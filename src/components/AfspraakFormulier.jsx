import { useState } from 'react';
import { id } from '@instantdb/react';
import { naarISODatum, mooieTijd } from '../lib/datum.js';
import { downloadIcs } from '../lib/ics.js';

const CATEGORIEEN = [
  { id: 'werk', naam: '💼 Werk' },
  { id: 'prive', naam: '🙋 Privé' },
  { id: 'samen', naam: '💗 Samen' },
];

// Het invulscherm voor een nieuwe of bestaande afspraak
export default function AfspraakFormulier({ db, user, bestaand, voorstel, standaardDatum, onSluit }) {
  const basis = bestaand || voorstel;
  const [titel, setTitel] = useState(basis?.titel || '');
  const [categorie, setCategorie] = useState(basis?.categorie || 'prive');
  const [datum, setDatum] = useState(
    basis ? naarISODatum(new Date(basis.start)) : naarISODatum(standaardDatum || new Date())
  );
  const [startTijd, setStartTijd] = useState(basis ? mooieTijd(new Date(basis.start)) : '09:00');
  const [eindTijd, setEindTijd] = useState(basis ? mooieTijd(new Date(basis.eind)) : '10:00');
  const [pauze, setPauze] = useState(basis?.pauzeMinuten || 0);
  const [notitie, setNotitie] = useState(basis?.notitie || '');

  const magBewerken = !bestaand || bestaand.eigenaar === user.email || bestaand.categorie === 'samen';

  function opslaan(e) {
    e.preventDefault();
    if (!titel.trim() || !datum || !startTijd || !eindTijd) return;

    const start = new Date(`${datum}T${startTijd}`);
    const eind = new Date(`${datum}T${eindTijd}`);
    if (eind <= start) eind.setDate(eind.getDate() + 1); // bijv. nachtdienst tot na middernacht

    db.transact(
      db.tx.afspraken[bestaand?.id || id()].update({
        titel: titel.trim(),
        categorie,
        start: start.toISOString(),
        eind: eind.toISOString(),
        pauzeMinuten: categorie === 'werk' ? Number(pauze) || 0 : 0,
        notitie: notitie.trim(),
        eigenaar: bestaand?.eigenaar || user.email,
      })
    );
    onSluit();
  }

  function verwijderen() {
    if (confirm('Weet je zeker dat je deze afspraak wilt verwijderen?')) {
      db.transact(db.tx.afspraken[bestaand.id].delete());
      onSluit();
    }
  }

  return (
    <div className="modaal-achtergrond" onClick={onSluit}>
      <div className="modaal" onClick={(e) => e.stopPropagation()}>
        <h2>{bestaand ? '✏️ Afspraak bewerken' : '✨ Nieuwe afspraak'}</h2>

        <form onSubmit={opslaan}>
          <div className="veld">
            <label>Wat ga je doen?</label>
            <input
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="bijv. Werk, tandarts, uit eten…"
              disabled={!magBewerken}
            />
          </div>

          <div className="veld">
            <label>Categorie</label>
            <div className="chips">
              {CATEGORIEEN.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip ${categorie === c.id ? `actief ${c.id}` : ''}`}
                  onClick={() => magBewerken && setCategorie(c.id)}
                >
                  {c.naam}
                </button>
              ))}
            </div>
          </div>

          <div className="veld">
            <label>Datum</label>
            <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} disabled={!magBewerken} />
          </div>

          <div className="velden-rij">
            <div className="veld">
              <label>Van</label>
              <input type="time" value={startTijd} onChange={(e) => setStartTijd(e.target.value)} disabled={!magBewerken} />
            </div>
            <div className="veld">
              <label>Tot</label>
              <input type="time" value={eindTijd} onChange={(e) => setEindTijd(e.target.value)} disabled={!magBewerken} />
            </div>
          </div>

          {categorie === 'werk' && (
            <div className="veld">
              <label>Pauze (minuten, onbetaald)</label>
              <input
                type="number" min="0" step="5" inputMode="numeric"
                value={pauze}
                onChange={(e) => setPauze(e.target.value)}
                disabled={!magBewerken}
              />
            </div>
          )}

          <div className="veld">
            <label>Notitie (niet verplicht)</label>
            <textarea
              rows={2}
              value={notitie}
              onChange={(e) => setNotitie(e.target.value)}
              disabled={!magBewerken}
            />
          </div>

          {magBewerken && (
            <button className="knop" type="submit">
              {bestaand ? 'Wijzigingen opslaan 💾' : 'Toevoegen ✨'}
            </button>
          )}

          {bestaand && !bestaand.bezet && (
            <>
              <div style={{ height: 10 }} />
              <button
                className="knop rustig" type="button"
                onClick={() => downloadIcs([bestaand], `${bestaand.titel}.ics`)}
              >
                📲 Zet in mijn telefoonagenda
              </button>
            </>
          )}

          {bestaand && magBewerken && (
            <>
              <div style={{ height: 10 }} />
              <button className="knop gevaar" type="button" onClick={verwijderen}>
                🗑️ Verwijderen
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
