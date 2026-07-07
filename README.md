# 🗓️ Transparant Agenda

Een gedeelde agenda voor jou en je vriendin, met salarisberekening en een
Nederlandse spraakassistent. Gebouwd met React + Vite en [InstantDB](https://instantdb.com)
zodat alles live synchroniseert tussen jullie telefoons.

## Wat kan de app?

- 📅 **Gedeelde agenda** — categorieën Werk 💼, Privé 🙋 en Samen 💗
- 🫣 **Privacy per categorie** — alles delen, alleen "bezet" tonen, of verbergen
- 💶 **Salarisberekening** — uren × uurloon, met avond/weekend-toeslagen en pauzes
- 🎤 **Spraakassistent** — "Wat staat er morgen in mijn agenda?", "Zet tandarts op vrijdag om 10 uur", "Notitie: melk kopen" — en de app leest het antwoord voor
- 📲 **Telefoonagenda** — afspraken exporteren naar Apple/Google Agenda (.ics)
- 📝 **Notities** — snel iets opschrijven of inspreken

## Zelf draaien

1. Zorg dat [Node.js](https://nodejs.org) geïnstalleerd is
2. Open een terminal in deze map en typ:

   ```
   npm install
   npm run dev
   ```

3. Open http://localhost:5173 in je browser
4. Maak een gratis account op [instantdb.com](https://instantdb.com), klik op
   **Create app**, kopieer de **App ID** en plak die in het welkomstscherm
5. Log in met je e-mailadres (je krijgt een code gemaild)

Je vriendin gebruikt **dezelfde App ID** — dan kijken jullie in dezelfde agenda.

## Online zetten (zodat het op jullie telefoons werkt)

De makkelijkste manier is [Vercel](https://vercel.com) (gratis):

1. Zet dit project op GitHub
2. Koppel de repository aan Vercel — klaar!
3. Open de website op je telefoon en kies "Zet op beginscherm" — dan voelt het
   als een echte app

Daarna kunnen we ook het automatische agenda-abonnement (webcal) toevoegen,
zodat je telefoonagenda vanzelf up-to-date blijft.
