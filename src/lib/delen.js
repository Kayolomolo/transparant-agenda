// De privacy-regels: wat mag je partner van jouw afspraken zien?
//
// Per categorie (werk / privé) kies je in Instellingen:
//   'delen'     -> je partner ziet alles
//   'bezet'     -> je partner ziet alleen "Bezet" op dat tijdstip
//   'verborgen' -> je partner ziet er niets van
// De categorie 'samen' is altijd zichtbaar voor jullie allebei.

export function zichtbareAfspraken(afspraken, mijnEmail, profielen) {
  const resultaat = [];
  for (const a of afspraken) {
    // Eigen afspraken en samen-afspraken zie je altijd volledig
    if (a.eigenaar === mijnEmail || a.categorie === 'samen') {
      resultaat.push({ ...a, bezet: false, vanPartner: a.eigenaar !== mijnEmail });
      continue;
    }
    const profiel = profielen.find((p) => p.email === a.eigenaar);
    const instelling = a.categorie === 'werk' ? profiel?.deelWerk || 'delen' : profiel?.deelPrive || 'delen';
    if (instelling === 'verborgen') continue;
    if (instelling === 'bezet') {
      resultaat.push({ ...a, titel: 'Bezet', notitie: '', bezet: true, vanPartner: true });
    } else {
      resultaat.push({ ...a, bezet: false, vanPartner: true });
    }
  }
  return resultaat.sort((x, y) => new Date(x.start) - new Date(y.start));
}
