// Hulpfuncties voor datums, met Nederlandse namen

export const DAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
export const DAGEN_KORT = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
export const MAANDEN = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

// "2026-07-07" voor een Date (in lokale tijd, niet UTC!)
export function naarISODatum(d) {
  const j = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dag = String(d.getDate()).padStart(2, '0');
  return `${j}-${m}-${dag}`;
}

export function zelfdeDag(a, b) {
  return naarISODatum(a) === naarISODatum(b);
}

// "maandag 7 juli"
export function mooieDatum(d) {
  return `${DAGEN[d.getDay()]} ${d.getDate()} ${MAANDEN[d.getMonth()]}`;
}

// "14:30"
export function mooieTijd(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Alle dagen van de maandweergave: begint op maandag, eindigt op zondag
export function maandRaster(jaar, maand) {
  const eerste = new Date(jaar, maand, 1);
  // getDay(): zondag = 0. Wij willen maandag als eerste kolom.
  const offset = (eerste.getDay() + 6) % 7;
  const start = new Date(jaar, maand, 1 - offset);
  const dagen = [];
  for (let i = 0; i < 42; i++) {
    dagen.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  // Laatste rij weglaten als die helemaal in de volgende maand valt
  if (dagen[35].getMonth() !== maand) return dagen.slice(0, 35);
  return dagen;
}

// Duur tussen twee ISO-strings in minuten
export function duurInMinuten(startIso, eindIso) {
  return Math.max(0, (new Date(eindIso) - new Date(startIso)) / 60000);
}

// "2u 30m" van een aantal minuten
export function mooieDuur(minuten) {
  const u = Math.floor(minuten / 60);
  const m = Math.round(minuten % 60);
  if (u === 0) return `${m}m`;
  if (m === 0) return `${u}u`;
  return `${u}u ${m}m`;
}

// Geld netjes weergeven: "€ 1.234,56"
export function mooiGeld(bedrag) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(bedrag);
}
