import { useState } from 'react';
import { MAANDEN, mooieDatum, mooieTijd, mooieDuur, mooiGeld } from '../lib/datum.js';
import { berekenMaand } from '../lib/salaris.js';

// Het maandoverzicht: hoeveel ga je (ongeveer) verdienen?
export default function Salaris({ user, afspraken, mijnProfiel }) {
  const vandaag = new Date();
  const [jaar, setJaar] = useState(vandaag.getFullYear());
  const [maand, setMaand] = useState(vandaag.getMonth());

  const uurloon = Number(mijnProfiel.uurloon) || 0;
  let toeslagen = [];
  try { toeslagen = JSON.parse(mijnProfiel.toeslagen || '[]'); } catch { /* leeg laten */ }

  // Alleen mijn eigen werkdiensten in deze maand
  const diensten = afspraken.filter((a) => {
    const d = new Date(a.start);
    return a.eigenaar === user.email && a.categorie === 'werk' &&
      d.getFullYear() === jaar && d.getMonth() === maand;
  }).sort((x, y) => new Date(x.start) - new Date(y.start));

  const totaal = berekenMaand(diensten, uurloon, toeslagen);

  function vorige() { if (maand === 0) { setMaand(11); setJaar(jaar - 1); } else setMaand(maand - 1); }
  function volgende() { if (maand === 11) { setMaand(0); setJaar(jaar + 1); } else setMaand(maand + 1); }

  return (
    <>
      <div className="kaart">
        <div className="maand-kop">
          <button onClick={vorige}>‹</button>
          <h2>{MAANDEN[maand]} {jaar}</h2>
          <button onClick={volgende}>›</button>
        </div>
      </div>

      <div className="salaris-held">
        <div className="sub">Verwacht brutoloon deze maand</div>
        <div className="bedrag">{mooiGeld(totaal.bruto)}</div>
        <div className="sub">op basis van {mooiGeld(uurloon)} per uur</div>
      </div>

      <div className="salaris-cijfers">
        <div className="cijfer-tegel">
          <div className="groot">{mooieDuur(totaal.minuten)}</div>
          <div className="klein">Gewerkte uren</div>
        </div>
        <div className="cijfer-tegel">
          <div className="groot">{diensten.length}</div>
          <div className="klein">Diensten</div>
        </div>
        <div className="cijfer-tegel">
          <div className="groot">{mooiGeld(totaal.toeslagBedrag)}</div>
          <div className="klein">Waarvan toeslag</div>
        </div>
      </div>

      {uurloon === 0 && (
        <div className="kaart" style={{ borderLeft: '6px solid var(--kleur-werk)' }}>
          💡 <b>Tip:</b> vul eerst je uurloon in bij <b>⚙️ Instellingen</b>, dan rekent de app
          automatisch uit wat je gaat verdienen.
        </div>
      )}

      {diensten.length === 0 ? (
        <div className="leeg">
          <span className="groot">💼</span>
          Nog geen werkdiensten deze maand.<br />
          Zet een afspraak in de agenda met categorie <b>Werk</b>!
        </div>
      ) : (
        <div className="kaart">
          <h2>Je diensten</h2>
          {totaal.diensten.map(({ afspraak, minuten, bruto, toeslagBedrag }) => (
            <div key={afspraak.id} className="keuze-rij">
              <div>
                <div className="naam" style={{ textTransform: 'capitalize' }}>{mooieDatum(new Date(afspraak.start))}</div>
                <div className="uitleg">
                  {mooieTijd(new Date(afspraak.start))}–{mooieTijd(new Date(afspraak.eind))} · {mooieDuur(minuten)} betaald
                  {toeslagBedrag > 0.004 ? ` · ${mooiGeld(toeslagBedrag)} toeslag` : ''}
                </div>
              </div>
              <span className="badge">{mooiGeld(bruto)}</span>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12, color: 'var(--tekst-licht)', textAlign: 'center', padding: '0 12px' }}>
        Dit is een schatting van je <b>brutoloon</b>. Wat je op je rekening krijgt (netto) is lager
        door belasting en premies.
      </p>
    </>
  );
}
