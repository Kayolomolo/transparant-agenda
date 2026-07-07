// De spraakassistent: begrijpt Nederlandse zinnen.
//
// Voorbeelden die werken:
//   "Wat staat er vandaag in mijn agenda?"        -> vraag
//   "Wat heb ik vrijdag?"                          -> vraag
//   "Notitie: melk kopen"                          -> notitie
//   "Zet tandarts op vrijdag om 10 uur"            -> afspraak (voorstel)
//   "Plan werk op zaterdag van 9 tot 17 uur"       -> afspraak (voorstel)

import { DAGEN, MAANDEN } from './datum.js';

// Zoek een datum in de zin: "vandaag", "morgen", "vrijdag", "12 augustus", ...
export function vindDatum(tekst) {
  const nu = new Date();
  const vandaag = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate());

  if (tekst.includes('overmorgen')) return new Date(vandaag.getFullYear(), vandaag.getMonth(), vandaag.getDate() + 2);
  if (tekst.includes('morgen')) return new Date(vandaag.getFullYear(), vandaag.getMonth(), vandaag.getDate() + 1);
  if (tekst.includes('vandaag') || tekst.includes('deze dag')) return vandaag;

  // "12 augustus" of "12 augustus 2026"
  const maandMatch = tekst.match(new RegExp(`(\\d{1,2}) (${MAANDEN.join('|')})( (\\d{4}))?`));
  if (maandMatch) {
    const dag = Number(maandMatch[1]);
    const maand = MAANDEN.indexOf(maandMatch[2]);
    const jaar = maandMatch[4] ? Number(maandMatch[4]) : vandaag.getFullYear();
    const d = new Date(jaar, maand, dag);
    // Als die datum al geweest is (en er geen jaar genoemd werd), bedoelen we volgend jaar
    if (!maandMatch[4] && d < vandaag) d.setFullYear(jaar + 1);
    return d;
  }

  // Een dagnaam: de eerstvolgende keer dat het die dag is
  for (let i = 0; i < DAGEN.length; i++) {
    if (tekst.includes(DAGEN[i])) {
      let verschil = (i - vandaag.getDay() + 7) % 7;
      if (verschil === 0 && !tekst.includes('deze')) verschil = 7; // "vrijdag" op een vrijdag = volgende week
      return new Date(vandaag.getFullYear(), vandaag.getMonth(), vandaag.getDate() + verschil);
    }
  }
  return null;
}

// Zoek tijden: "om 10 uur", "om 14:30", "van 9 tot 17 uur", "om half 3"
export function vindTijden(tekst) {
  // Zeg je "om 3 uur" of "om half 7"? Dan bedoel je meestal de middag of avond,
  // behalve als je er "'s ochtends" bij zegt.
  const isOchtend = /ochtend|'s morgens|vroeg/.test(tekst);
  const slimUur = (uur) => (uur >= 1 && uur <= 7 && !isOchtend ? uur + 12 : uur);

  // "van 9 tot 17", "van 9:30 tot 17:15"
  const bereik = tekst.match(/van (\d{1,2})(?:[:.](\d{2}))? tot (\d{1,2})(?:[:.](\d{2}))?/);
  if (bereik) {
    return {
      startUur: Number(bereik[1]), startMin: Number(bereik[2] || 0),
      eindUur: Number(bereik[3]), eindMin: Number(bereik[4] || 0),
    };
  }
  // "om half 3" = 14:30 ('s ochtends: 2:30)
  const half = tekst.match(/om half (\d{1,2})/);
  if (half) {
    return { startUur: slimUur(Number(half[1]) - 1), startMin: 30, eindUur: null, eindMin: null };
  }
  // "om 14:30" (precieze tijd: niets aan veranderen)
  const precies = tekst.match(/om (\d{1,2})[:.](\d{2})/);
  if (precies) {
    return { startUur: Number(precies[1]), startMin: Number(precies[2]), eindUur: null, eindMin: null };
  }
  // "om 10 uur"
  const los = tekst.match(/om (\d{1,2})/);
  if (los) {
    return { startUur: slimUur(Number(los[1])), startMin: 0, eindUur: null, eindMin: null };
  }
  return null;
}

// Haal de titel uit de zin door datum/tijd-woorden en werkwoorden weg te strippen
function maakTitel(tekst) {
  let t = ' ' + tekst + ' ';
  t = t.replace(/van (\d{1,2})(?:[:.](\d{2}))? tot (\d{1,2})(?:[:.](\d{2}))?( uur)?/g, ' ');
  t = t.replace(/om half (\d{1,2})/g, ' ');
  t = t.replace(/om (\d{1,2})(?:[:.](\d{2}))?( uur)?/g, ' ');
  t = t.replace(new RegExp(`(\\d{1,2}) (${MAANDEN.join('|')})( \\d{4})?`, 'g'), ' ');
  t = t.replace(/('s |s )?(ochtends|ochtend|middags|middag|avonds|avond)\b/g, ' ');
  t = t.replace(new RegExp(`\\b(op|deze|volgende|aanstaande|${DAGEN.join('|')}|vandaag|morgen|overmorgen)\\b`, 'g'), ' ');
  t = t.replace(/\b(zet|plan|voeg|maak|toe|een|nieuwe|afspraak|in|de|agenda|erin|neer)\b/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Nieuwe afspraak';
}

// Hoofdfunctie: wat bedoelt de gebruiker?
export function verwerkSpraak(ruweTekst) {
  const tekst = ruweTekst.toLowerCase().replace(/[?!.]/g, '').trim();
  if (!tekst) return { type: 'onbekend', tekst: ruweTekst };

  // Een vraag over de agenda?
  if (/wat (staat|heb|hebben|is)|wat zit er|hoe ziet .* eruit/.test(tekst)) {
    if (tekst.includes('deze week') || tekst.includes('week')) {
      return { type: 'vraag-week' };
    }
    const datum = vindDatum(tekst) || new Date();
    return { type: 'vraag', datum };
  }

  // Een notitie?
  const notitie = tekst.match(/^(notitie|noteer|onthoud|schrijf op)[:,]?\s*(dat\s+)?(.+)/);
  if (notitie) {
    return { type: 'notitie', tekst: notitie[3].trim() };
  }

  // Een nieuwe afspraak?
  const datum = vindDatum(tekst);
  const tijden = vindTijden(tekst);
  if (/^(zet|plan|voeg|maak)/.test(tekst) || datum || tijden) {
    const d = datum || new Date();
    const start = new Date(d);
    start.setHours(tijden?.startUur ?? 9, tijden?.startMin ?? 0, 0, 0);
    const eind = new Date(start);
    if (tijden?.eindUur != null) {
      eind.setHours(tijden.eindUur, tijden.eindMin, 0, 0);
      if (eind <= start) eind.setDate(eind.getDate() + 1); // dienst over middernacht
    } else {
      eind.setHours(start.getHours() + 1); // standaard 1 uur
    }
    const titel = maakTitel(tekst);
    const isWerk = /\bwerk|dienst|shift\b/.test(tekst);
    return {
      type: 'afspraak',
      voorstel: {
        titel: isWerk && titel === 'Nieuwe afspraak' ? 'Werk' : titel,
        start: start.toISOString(),
        eind: eind.toISOString(),
        categorie: isWerk ? 'werk' : 'prive',
      },
    };
  }

  return { type: 'onbekend', tekst: ruweTekst };
}

// ===== Voorlezen (tekst-naar-spraak) =====

export function spreek(tekst) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const uiting = new SpeechSynthesisUtterance(tekst);
  uiting.lang = 'nl-NL';
  const stem = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('nl'));
  if (stem) uiting.voice = stem;
  uiting.rate = 1.0;
  window.speechSynthesis.speak(uiting);
}

// ===== Luisteren (spraak-naar-tekst) =====

export function maakHerkenner({ opResultaat, opFout, opEinde }) {
  const SpraakHerkenning = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpraakHerkenning) return null;
  const herkenner = new SpraakHerkenning();
  herkenner.lang = 'nl-NL';
  herkenner.interimResults = true;
  herkenner.continuous = false;
  herkenner.onresult = (e) => {
    const tekst = Array.from(e.results).map((r) => r[0].transcript).join(' ');
    const definitief = e.results[e.results.length - 1].isFinal;
    opResultaat(tekst, definitief);
  };
  herkenner.onerror = (e) => opFout?.(e.error);
  herkenner.onend = () => opEinde?.();
  return herkenner;
}
