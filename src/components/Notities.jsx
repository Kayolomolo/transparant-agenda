import { useState } from 'react';
import { id } from '@instantdb/react';

// Snelle notities — ook in te spreken via de microfoonknop
export default function Notities({ db, user, profielen }) {
  const [tekst, setTekst] = useState('');
  const { isLoading, data } = db.useQuery({ notities: {} });

  if (isLoading) return null;
  const notities = (data.notities || []).sort((a, b) => (b.gemaaktOp || '').localeCompare(a.gemaaktOp || ''));

  function toevoegen(e) {
    e.preventDefault();
    if (!tekst.trim()) return;
    db.transact(
      db.tx.notities[id()].update({
        tekst: tekst.trim(),
        eigenaar: user.email,
        gemaaktOp: new Date().toISOString(),
      })
    );
    setTekst('');
  }

  function naamVan(email) {
    return profielen.find((p) => p.email === email)?.naam || 'Partner';
  }

  return (
    <>
      <div className="kaart">
        <h2>📝 Nieuwe notitie</h2>
        <form onSubmit={toevoegen} style={{ display: 'flex', gap: 8 }}>
          <input
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            placeholder="bijv. melk kopen, cadeau regelen…"
          />
          <button className="knop klein" type="submit">＋</button>
        </form>
        <p style={{ fontSize: 12, color: 'var(--tekst-licht)', marginTop: 8 }}>
          💡 Je kunt notities ook inspreken: tik op de 🎤-knop en zeg bijvoorbeeld
          <i> “Notitie: melk kopen”</i>.
        </p>
      </div>

      {notities.length === 0 ? (
        <div className="leeg">
          <span className="groot">🗒️</span>
          Nog geen notities
        </div>
      ) : (
        notities.map((n) => (
          <div key={n.id} className="afspraak samen" style={{ cursor: 'default' }}>
            <div style={{ flex: 1 }}>
              <div className="titel">{n.tekst}</div>
              <div className="sub">
                👤 {naamVan(n.eigenaar)} · {new Date(n.gemaaktOp).toLocaleDateString('nl-NL')}
              </div>
            </div>
            {n.eigenaar === user.email && (
              <button
                onClick={() => db.transact(db.tx.notities[n.id].delete())}
                style={{ fontSize: 18, padding: 6 }}
                aria-label="Notitie verwijderen"
              >
                🗑️
              </button>
            )}
          </div>
        ))
      )}
    </>
  );
}
