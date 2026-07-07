// Demo-modus: bekijk de app met voorbeeldgegevens, zonder account.
// Opslaan werkt hier niet — het is alleen om te kijken.

export const demoGebruiker = { email: 'kay@demo.nl' };

function overDagen(dagen, uur, minuut = 0) {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dagen, uur, minuut).toISOString();
}

export function maakDemoData() {
  const profielen = [
    {
      id: 'demo-kay', email: 'kay@demo.nl', naam: 'Kay', kleur: '#7c3aed',
      uurloon: 14.5,
      toeslagen: JSON.stringify([{ label: 'Zaterdagtoeslag', dagen: [6], van: '18:00', tot: '24:00', pct: 25 }]),
      deelWerk: 'delen', deelPrive: 'bezet',
    },
    {
      id: 'demo-partner', email: 'partner@demo.nl', naam: 'Lisa', kleur: '#ec4899',
      uurloon: 0, toeslagen: '[]', deelWerk: 'delen', deelPrive: 'bezet',
    },
  ];

  const afspraken = [
    { id: 'd1', titel: 'Werk', categorie: 'werk', start: overDagen(0, 9), eind: overDagen(0, 17), pauzeMinuten: 30, notitie: '', eigenaar: 'kay@demo.nl' },
    { id: 'd2', titel: 'Sporten', categorie: 'prive', start: overDagen(1, 19), eind: overDagen(1, 20, 30), pauzeMinuten: 0, notitie: '', eigenaar: 'kay@demo.nl' },
    { id: 'd3', titel: 'Werk', categorie: 'werk', start: overDagen(2, 12), eind: overDagen(2, 21, 30), pauzeMinuten: 30, notitie: '', eigenaar: 'kay@demo.nl' },
    { id: 'd4', titel: 'Uit eten 🍕', categorie: 'samen', start: overDagen(3, 18, 30), eind: overDagen(3, 21), pauzeMinuten: 0, notitie: 'Bij de Italiaan', eigenaar: 'partner@demo.nl' },
    { id: 'd5', titel: 'Verrassing', categorie: 'prive', start: overDagen(4, 14), eind: overDagen(4, 16), pauzeMinuten: 0, notitie: 'geheim!', eigenaar: 'partner@demo.nl' },
    { id: 'd6', titel: 'Werk', categorie: 'werk', start: overDagen(5, 9), eind: overDagen(5, 14), pauzeMinuten: 15, notitie: '', eigenaar: 'partner@demo.nl' },
  ];

  const notities = [
    { id: 'n1', tekst: 'Melk kopen 🥛', eigenaar: 'kay@demo.nl', gemaaktOp: new Date().toISOString() },
    { id: 'n2', tekst: 'Cadeau regelen voor mama', eigenaar: 'partner@demo.nl', gemaaktOp: new Date().toISOString() },
  ];

  return { profielen, afspraken, notities };
}

export function maakDemoDb() {
  const data = maakDemoData();
  const nepActie = { update: () => ({}), delete: () => ({}) };
  const tx = new Proxy({}, {
    get: () => new Proxy({}, { get: () => nepActie }),
  });
  return {
    tx,
    transact: () => {
      alert('Dit is de demo — hier wordt niets echt opgeslagen. Vul je eigen InstantDB-sleutel in om te beginnen! 🙂');
      return Promise.resolve();
    },
    useQuery: () => ({ isLoading: false, error: null, data }),
    auth: { signOut: () => window.location.reload() },
  };
}
