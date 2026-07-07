// Afspraken exporteren naar je telefoonagenda via een .ics-bestand.
// Als je zo'n bestand opent op je iPhone of Android, vraagt je agenda-app
// of je de afspraak wilt toevoegen.

function icsDatum(iso) {
  // Agenda-apps willen dit formaat: 20260707T143000
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

function ontsnap(tekst) {
  return String(tekst || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function maakIcs(afspraken) {
  const regels = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Transparant Agenda//NL',
    'CALSCALE:GREGORIAN',
  ];
  for (const a of afspraken) {
    regels.push(
      'BEGIN:VEVENT',
      `UID:${a.id}@transparant-agenda`,
      `DTSTART:${icsDatum(a.start)}`,
      `DTEND:${icsDatum(a.eind)}`,
      `SUMMARY:${ontsnap(a.titel)}`,
      a.notitie ? `DESCRIPTION:${ontsnap(a.notitie)}` : null,
      'END:VEVENT',
    );
  }
  regels.push('END:VCALENDAR');
  return regels.filter(Boolean).join('\r\n');
}

export function downloadIcs(afspraken, bestandsnaam = 'agenda.ics') {
  const inhoud = maakIcs(afspraken);
  const blob = new Blob([inhoud], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = bestandsnaam;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
