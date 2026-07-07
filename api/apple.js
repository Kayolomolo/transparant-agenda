// Serverfunctie (draait op Vercel): haalt een openbare iCloud-agenda op.
//
// De browser mag zelf niet rechtstreeks bij iCloud naar binnen (dat blokkeert
// Apple), dus deze functie doet het namens de app. Uit veiligheid werkt hij
// ALLEEN met echte iCloud-agenda-links, zodat niemand hem kan misbruiken om
// andere websites op te vragen.

export default async function handler(req, res) {
  const ruweUrl = String(req.query.url || '').replace(/^webcal:/i, 'https:');

  let url;
  try {
    url = new URL(ruweUrl);
  } catch {
    return res.status(400).send('Dat is geen geldige link.');
  }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.icloud.com')) {
    return res.status(400).send('Alleen iCloud-agenda-links (…icloud.com) zijn toegestaan.');
  }

  const antwoord = await fetch(url, { headers: { 'user-agent': 'TransparantAgenda/1.0' } });
  if (!antwoord.ok) {
    return res.status(502).send(`iCloud gaf een fout (${antwoord.status}). Staat de agenda nog op openbaar?`);
  }

  const tekst = await antwoord.text();
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300'); // 5 min cache, scheelt wachttijd
  res.status(200).send(tekst);
}
