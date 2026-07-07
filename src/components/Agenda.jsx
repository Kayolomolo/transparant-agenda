import { useState } from 'react';
import { DAGEN_KORT, MAANDEN, maandRaster, naarISODatum, zelfdeDag, mooieDatum, mooieTijd, mooieDuur, duurInMinuten } from '../lib/datum.js';
import { zichtbareAfspraken } from '../lib/delen.js';
import AfspraakFormulier from './AfspraakFormulier.jsx';

export default function Agenda({ db, user, profielen, afspraken, mijnProfiel }) {
  const vandaag = new Date();
  const [jaar, setJaar] = useState(vandaag.getFullYear());
  const [maand, setMaand] = useState(vandaag.getMonth());
  const [gekozenDag, setGekozenDag] = useState(vandaag);
  const [formulier, setFormulier] = useState(null); // null | { bestaand } | { nieuw: true }

  // Privacy-regels toepassen: wat mag ik zien?
  const zichtbaar = zichtbareAfspraken(afspraken, user.email, profielen);

  const dagen = maandRaster(jaar, maand);
  const vanDag = (d) => zichtbaar.filter((a) => zelfdeDag(new Date(a.start), d));
  const dagAfspraken = vanDag(gekozenDag);

  function vorigeMaand() {
    if (maand === 0) { setMaand(11); setJaar(jaar - 1); } else setMaand(maand - 1);
  }
  function volgendeMaand() {
    if (maand === 11) { setMaand(0); setJaar(jaar + 1); } else setMaand(maand + 1);
  }

  function naamVan(email) {
    return profielen.find((p) => p.email === email)?.naam || 'Partner';
  }

  return (
    <>
      <div className="kaart">
        <div className="maand-kop">
          <button onClick={vorigeMaand}>‹</button>
          <h2>{MAANDEN[maand]} {jaar}</h2>
          <button onClick={volgendeMaand}>›</button>
        </div>

        <div className="raster">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <div key={d} className="dagkop">{DAGEN_KORT[d]}</div>
          ))}
          {dagen.map((d) => {
            const lijst = vanDag(d);
            const categorieen = [...new Set(lijst.map((a) => a.categorie))].slice(0, 3);
            const klassen = [
              'dag',
              d.getMonth() !== maand ? 'andere-maand' : '',
              zelfdeDag(d, vandaag) ? 'vandaag' : '',
              zelfdeDag(d, gekozenDag) ? 'gekozen' : '',
            ].join(' ');
            return (
              <button key={naarISODatum(d)} className={klassen} onClick={() => setGekozenDag(d)}>
                {d.getDate()}
                <span className="stipjes">
                  {categorieen.map((c) => <span key={c} className={`stip ${c}`} />)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 800, margin: '4px 4px 10px', textTransform: 'capitalize' }}>
        {mooieDatum(gekozenDag)}
      </h2>

      {dagAfspraken.length === 0 ? (
        <div className="leeg">
          <span className="groot">🌤️</span>
          Nog niets gepland op deze dag
        </div>
      ) : (
        dagAfspraken.map((a) => (
          <button
            key={a.id}
            className={`afspraak ${a.categorie} ${a.bezet ? 'bezet' : ''}`}
            onClick={() => !a.bezet && setFormulier({ bestaand: a })}
          >
            <div className="tijd">
              {mooieTijd(new Date(a.start))}<br />
              <span style={{ fontWeight: 500 }}>{mooieTijd(new Date(a.eind))}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div className="titel">{a.bezet ? '🔒 Bezet' : a.titel}</div>
              <div className="sub">
                {a.vanPartner ? `👤 ${naamVan(a.eigenaar)} · ` : ''}
                {mooieDuur(duurInMinuten(a.start, a.eind))}
                {a.categorie === 'werk' && a.pauzeMinuten > 0 ? ` · ${a.pauzeMinuten}m pauze` : ''}
              </div>
            </div>
          </button>
        ))
      )}

      <button className="zwevende-knop" onClick={() => setFormulier({ nieuw: true })} aria-label="Nieuwe afspraak">
        +
      </button>

      {formulier && (
        <AfspraakFormulier
          db={db}
          user={user}
          bestaand={formulier.bestaand || null}
          standaardDatum={gekozenDag}
          onSluit={() => setFormulier(null)}
        />
      )}
    </>
  );
}
