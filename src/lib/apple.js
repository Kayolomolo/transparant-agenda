// Jouw Apple/iCloud-agenda inlezen in de app.
//
// Werkt met de "openbare agenda"-link van iCloud (webcal://p…icloud.com/published/…).
// De afspraken worden alleen bij JOU getoond — je partner ziet ze niet.
// Ze zijn alleen-lezen: bewerken doe je gewoon in je Apple Agenda.

import ICAL from 'ical.js';

// Hoe ver kijken we? Van vorige maand tot 3 maanden vooruit.
function venster() {
  const nu = new Date();
  return {
    van: new Date(nu.getFullYear(), nu.getMonth() - 1, 1),
    tot: new Date(nu.getFullYear(), nu.getMonth() + 4, 1),
  };
}

export function parseAppleIcs(icsTekst, eigenaar) {
  const jcal = ICAL.parse(icsTekst);
  const kalender = new ICAL.Component(jcal);

  // Tijdzones registreren die in het bestand meekomen (bijv. Europe/Amsterdam),
  // anders kloppen de tijden niet.
  for (const vtz of kalender.getAllSubcomponents('vtimezone')) {
    ICAL.TimezoneService.register(new ICAL.Timezone(vtz));
  }

  const { van, tot } = venster();
  const afspraken = [];

  const maakAfspraak = (uid, titel, start, eind, heleDag) => {
    if (eind <= van || start >= tot) return; // buiten ons venster
    afspraken.push({
      id: `apple-${uid}-${start.getTime()}`,
      titel: titel || '(geen titel)',
      categorie: 'apple',
      start: start.toISOString(),
      eind: eind.toISOString(),
      heleDag,
      pauzeMinuten: 0,
      notitie: '',
      eigenaar,
    });
  };

  for (const onderdeel of kalender.getAllSubcomponents('vevent')) {
    try {
      const ev = new ICAL.Event(onderdeel);
      const heleDag = !!ev.startDate?.isDate;

      if (ev.isRecurring()) {
        // Herhalende afspraak (bijv. elke week): reken de losse keren uit
        const iterator = ev.iterator();
        let keer;
        let teller = 0;
        while ((keer = iterator.next()) && teller < 500) {
          teller++;
          const details = ev.getOccurrenceDetails(keer);
          const start = details.startDate.toJSDate();
          if (start >= tot) break;
          maakAfspraak(ev.uid, ev.summary, start, details.endDate.toJSDate(), heleDag);
        }
      } else {
        maakAfspraak(ev.uid, ev.summary, ev.startDate.toJSDate(), ev.endDate.toJSDate(), heleDag);
      }
    } catch {
      // Eén onleesbare afspraak mag niet de hele agenda tegenhouden
    }
  }

  return afspraken.sort((a, b) => new Date(a.start) - new Date(b.start));
}

export async function haalAppleAgenda(webcalUrl, eigenaar) {
  const antwoord = await fetch(`/api/apple?url=${encodeURIComponent(webcalUrl)}`);
  if (!antwoord.ok) throw new Error(await antwoord.text());
  return parseAppleIcs(await antwoord.text(), eigenaar);
}
