// Serverfunctie (draait op Vercel): het agenda-abonnement.
//
// Apple/Google Agenda vraagt dit adres regelmatig op en houdt zo je
// telefoonagenda automatisch gelijk met Transparant Agenda:
//   webcal://transparant-agenda.vercel.app/api/ics?token=JOUW-GEHEIME-TOKEN
//
// De token maak je in de app aan (Instellingen -> Telefoonagenda) en hoort
// bij één persoon. Zonder geldige token krijgt niemand iets te zien.
//
// Nodig op Vercel: de omgevingsvariabele INSTANT_APP_ADMIN_TOKEN
// (te vinden op instantdb.com bij je app onder "Admin").

import { init } from '@instantdb/admin';
import { maakIcs } from '../src/lib/ics.js';
import { zichtbareAfspraken } from '../src/lib/delen.js';

const APP_ID = 'd217992d-fcff-41a3-85db-ea033f616c8d';

export default async function handler(req, res) {
  const token = String(req.query.token || '');
  if (token.length < 10) {
    return res.status(400).send('Er mist een token in de link.');
  }
  if (!process.env.INSTANT_APP_ADMIN_TOKEN) {
    return res.status(500).send('De INSTANT_APP_ADMIN_TOKEN is nog niet ingesteld op Vercel.');
  }

  const db = init({ appId: APP_ID, adminToken: process.env.INSTANT_APP_ADMIN_TOKEN });

  // Bij wie hoort deze token?
  const profielData = await db.query({ profielen: { $: { where: { feedToken: token } } } });
  const profiel = profielData.profielen?.[0];
  if (!profiel) {
    return res.status(403).send('Deze abonnementslink is niet (meer) geldig.');
  }

  // Alle afspraken ophalen en dezelfde privacy-regels toepassen als in de app:
  // deze persoon krijgt precies te zien wat hij/zij in de app ook zou zien.
  const data = await db.query({ afspraken: {}, profielen: {} });
  const zichtbaar = zichtbareAfspraken(data.afspraken || [], profiel.email, data.profielen || []);

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300'); // max 5 min oude versie serveren
  res.status(200).send(maakIcs(zichtbaar));
}
