// Salarisberekening: uren × uurloon, met toeslagen en pauzes.
//
// Een toeslagregel ziet er zo uit:
//   { label: 'Avond', dagen: [1,2,3,4,5], van: '21:00', tot: '24:00', pct: 25 }
// dagen: 0 = zondag, 1 = maandag, ... 6 = zaterdag
//
// De berekening loopt in stapjes van 5 minuten door de dienst heen.
// Voor elk stapje kijken we of er een toeslag geldt (de hoogste telt).
// Pauze wordt afgetrokken tegen het basistarief.

function tijdNaarMinuten(tijd) {
  if (!tijd) return 0;
  const [u, m] = tijd.split(':').map(Number);
  return (u || 0) * 60 + (m || 0);
}

export function berekenDienst(afspraak, uurloon, toeslagen = []) {
  const start = new Date(afspraak.start);
  const eind = new Date(afspraak.eind);
  const STAP = 5; // minuten

  let minuten = 0;
  let gewogenMinuten = 0; // elke minuut telt als (1 + toeslag%) minuten
  let toeslagMinuten = 0;

  for (let t = start.getTime(); t < eind.getTime(); t += STAP * 60000) {
    const moment = new Date(t);
    const dag = moment.getDay();
    const minVanDag = moment.getHours() * 60 + moment.getMinutes();

    let pct = 0;
    for (const regel of toeslagen) {
      const van = tijdNaarMinuten(regel.van);
      const tot = regel.tot === '24:00' ? 24 * 60 : tijdNaarMinuten(regel.tot);
      if ((regel.dagen || []).includes(dag) && minVanDag >= van && minVanDag < tot) {
        pct = Math.max(pct, Number(regel.pct) || 0);
      }
    }
    minuten += STAP;
    gewogenMinuten += STAP * (1 + pct / 100);
    if (pct > 0) toeslagMinuten += STAP;
  }

  const pauze = Math.min(Number(afspraak.pauzeMinuten) || 0, minuten);
  const betaaldeMinuten = minuten - pauze;
  const betaaldGewogen = Math.max(0, gewogenMinuten - pauze); // pauze gaat van het basistarief af

  const loon = Number(uurloon) || 0;
  const bruto = (betaaldGewogen / 60) * loon;
  const basisBedrag = (betaaldeMinuten / 60) * loon;

  return {
    minuten: betaaldeMinuten,
    toeslagMinuten,
    basisBedrag,
    toeslagBedrag: bruto - basisBedrag,
    bruto,
  };
}

// Alle werkdiensten van één maand optellen
export function berekenMaand(afspraken, uurloon, toeslagen = []) {
  let totaal = { minuten: 0, toeslagBedrag: 0, bruto: 0, diensten: [] };
  for (const a of afspraken) {
    const d = berekenDienst(a, uurloon, toeslagen);
    totaal.minuten += d.minuten;
    totaal.toeslagBedrag += d.toeslagBedrag;
    totaal.bruto += d.bruto;
    totaal.diensten.push({ afspraak: a, ...d });
  }
  return totaal;
}
