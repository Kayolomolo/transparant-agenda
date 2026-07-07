import { useRef, useState } from 'react';
import { id } from '@instantdb/react';
import { verwerkSpraak, spreek, maakHerkenner } from '../lib/spraak.js';
import { zichtbareAfspraken } from '../lib/delen.js';
import { mooieDatum, mooieTijd, zelfdeDag } from '../lib/datum.js';
import AfspraakFormulier from './AfspraakFormulier.jsx';

// De spraakassistent: praat tegen je agenda 🎤
export default function SpraakKnop({ db, user, profielen, afspraken }) {
  const [open, setOpen] = useState(false);
  const [luistert, setLuistert] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [getypt, setGetypt] = useState('');
  const [antwoord, setAntwoord] = useState('');
  const [voorstel, setVoorstel] = useState(null);
  const [formulierOpen, setFormulierOpen] = useState(false);
  const herkennerRef = useRef(null);

  const kanLuisteren = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const zichtbaar = zichtbareAfspraken(afspraken, user.email, profielen);

  function naamVan(email) {
    return profielen.find((p) => p.email === email)?.naam || 'je partner';
  }

  function antwoordVoorDag(datum) {
    const items = zichtbaar.filter((a) => zelfdeDag(new Date(a.start), datum));
    if (items.length === 0) return `Op ${mooieDatum(datum)} staat er niets in de agenda. Lekker vrij! 🎉`;
    const stukjes = items.map((a) => {
      const wie = a.vanPartner ? ` (${naamVan(a.eigenaar)})` : '';
      const wat = a.bezet ? 'iets — dat staat op bezet' : a.titel;
      return `om ${mooieTijd(new Date(a.start))}: ${wat}${wie}`;
    });
    const aantal = items.length === 1 ? 'staat er 1 afspraak' : `staan er ${items.length} afspraken`;
    return `Op ${mooieDatum(datum)} ${aantal} in de agenda:\n• ${stukjes.join('\n• ')}`;
  }

  function antwoordVoorWeek() {
    const nu = new Date();
    const regels = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate() + i);
      const items = zichtbaar.filter((a) => zelfdeDag(new Date(a.start), d));
      if (items.length > 0) {
        regels.push(`${mooieDatum(d)}: ${items.map((a) => (a.bezet ? 'bezet' : a.titel)).join(', ')}`);
      }
    }
    if (regels.length === 0) return 'De komende week is helemaal leeg. Tijd voor iets leuks! 🎉';
    return `Dit staat er de komende week gepland:\n• ${regels.join('\n• ')}`;
  }

  function verwerk(tekst) {
    const resultaat = verwerkSpraak(tekst);
    setVoorstel(null);

    if (resultaat.type === 'vraag') {
      const a = antwoordVoorDag(resultaat.datum);
      setAntwoord(a);
      spreek(a.replace(/\n•/g, '.').replace(/[🎉]/g, ''));
    } else if (resultaat.type === 'vraag-week') {
      const a = antwoordVoorWeek();
      setAntwoord(a);
      spreek(a.replace(/\n•/g, '.').replace(/[🎉]/g, ''));
    } else if (resultaat.type === 'notitie') {
      db.transact(
        db.tx.notities[id()].update({
          tekst: resultaat.tekst.charAt(0).toUpperCase() + resultaat.tekst.slice(1),
          eigenaar: user.email,
          gemaaktOp: new Date().toISOString(),
        })
      );
      const a = `Genoteerd! 📝 “${resultaat.tekst}”`;
      setAntwoord(a);
      spreek('Genoteerd!');
    } else if (resultaat.type === 'afspraak') {
      setVoorstel(resultaat.voorstel);
      setAntwoord('');
    } else {
      setAntwoord(
        'Hmm, dat begreep ik niet helemaal. 🙈 Probeer bijvoorbeeld:\n' +
        '• “Wat staat er morgen in mijn agenda?”\n' +
        '• “Zet tandarts op vrijdag om 10 uur”\n' +
        '• “Notitie: melk kopen”'
      );
    }
  }

  function startLuisteren() {
    setTranscript('');
    setAntwoord('');
    setVoorstel(null);
    const herkenner = maakHerkenner({
      opResultaat: (tekst, definitief) => {
        setTranscript(tekst);
        if (definitief) verwerk(tekst);
      },
      opFout: (fout) => {
        setLuistert(false);
        if (fout === 'not-allowed') setAntwoord('Ik mag je microfoon niet gebruiken. Geef toestemming in je browser-instellingen. 🎙️');
        else if (fout !== 'aborted') setAntwoord('Ik kon je niet verstaan, probeer het nog eens. 🙉');
      },
      opEinde: () => setLuistert(false),
    });
    if (!herkenner) return;
    herkennerRef.current = herkenner;
    herkenner.start();
    setLuistert(true);
  }

  function sluit() {
    herkennerRef.current?.abort?.();
    window.speechSynthesis?.cancel();
    setOpen(false);
    setLuistert(false);
    setTranscript('');
    setAntwoord('');
    setVoorstel(null);
  }

  function bevestigVoorstel() {
    db.transact(
      db.tx.afspraken[id()].update({
        ...voorstel,
        pauzeMinuten: 0,
        notitie: '',
        eigenaar: user.email,
      })
    );
    const a = `Staat erin! ✅ ${voorstel.titel} op ${mooieDatum(new Date(voorstel.start))} om ${mooieTijd(new Date(voorstel.start))}.`;
    setAntwoord(a);
    setVoorstel(null);
    spreek('Staat in de agenda!');
  }

  return (
    <>
      <button className="zwevende-knop mic" onClick={() => { setOpen(true); if (kanLuisteren) startLuisteren(); }} aria-label="Spraakassistent">
        🎤
      </button>

      {open && (
        <div className="modaal-achtergrond" onClick={sluit}>
          <div className="modaal" onClick={(e) => e.stopPropagation()}>
            <div className="spraak-paneel">
              <h2>🎤 Spraakassistent</h2>

              {kanLuisteren ? (
                <>
                  <button className={`luister-bol ${luistert ? 'actief' : ''}`} onClick={startLuisteren}>
                    {luistert ? '👂' : '🎤'}
                  </button>
                  <div className="transcript">
                    {luistert && !transcript ? 'Ik luister…' : transcript}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--tekst-licht)', margin: '10px 0' }}>
                  Deze browser kan (nog) niet luisteren — typ je vraag hieronder. 👇
                </p>
              )}

              <form
                onSubmit={(e) => { e.preventDefault(); if (getypt.trim()) { setTranscript(getypt); verwerk(getypt); setGetypt(''); } }}
                style={{ display: 'flex', gap: 8, marginTop: 6 }}
              >
                <input
                  value={getypt}
                  onChange={(e) => setGetypt(e.target.value)}
                  placeholder="…of typ het hier"
                />
                <button className="knop klein" type="submit">➤</button>
              </form>

              {antwoord && <div className="spraak-antwoord">{antwoord}</div>}

              {voorstel && (
                <div className="spraak-antwoord">
                  <b>Zal ik dit toevoegen?</b><br />
                  ✨ {voorstel.titel}<br />
                  📅 <span style={{ textTransform: 'capitalize' }}>{mooieDatum(new Date(voorstel.start))}</span><br />
                  🕐 {mooieTijd(new Date(voorstel.start))}–{mooieTijd(new Date(voorstel.eind))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button className="knop klein" onClick={bevestigVoorstel}>Ja, zet erin ✅</button>
                    <button className="knop rustig klein" onClick={() => setFormulierOpen(true)}>Aanpassen ✏️</button>
                  </div>
                </div>
              )}

              {!antwoord && !voorstel && !luistert && (
                <p className="spraak-tips">
                  Probeer bijvoorbeeld:<br />
                  💬 “Wat staat er morgen in mijn agenda?”<br />
                  💬 “Zet werk op zaterdag van 9 tot 17 uur”<br />
                  💬 “Notitie: melk kopen”
                </p>
              )}

              <div style={{ height: 12 }} />
              <button className="knop rustig" onClick={sluit}>Sluiten</button>
            </div>
          </div>
        </div>
      )}

      {formulierOpen && voorstel && (
        <AfspraakFormulier
          db={db}
          user={user}
          voorstel={voorstel}
          onSluit={() => { setFormulierOpen(false); setVoorstel(null); sluit(); }}
        />
      )}
    </>
  );
}
