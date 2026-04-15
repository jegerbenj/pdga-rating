# PDGA Rating-kalkulator

En nettapp som beregner PDGA-rating automatisk fra et PDGA-nummer. Appen henter spillerdata fra pdga.com, viser ratede runder, og simulerer ratingendringer med hypotetiske runder og målsettinger.

**Live:** Deployet på Vercel

## Funksjoner

- **PDGA-søk** — Skriv inn et PDGA-nummer for å hente spillerens navn, profilbilde, offisiell rating og alle ratede runder.
- **Ratingberegning** — Beregner rating etter PDGA sine offisielle regler (se under).
- **Hva-hvis-runder** — Legg til hypotetiske rundetatinger for å se hvordan de påvirker ratingen ved neste oppdatering.
- **Målsetting** — Sett en målrating og se hvor høy snittrating du trenger per runde med ulike tempo (rask/middels/jevn).
- **Manuell modus** — Lim inn runde-ratinger manuelt for beregning uten PDGA-oppslag.
- **Profilbilde** — Viser spillerens profilbilde fra PDGA i sirkulær form.
- **Mobilvennlig** — Designet for bruk på mobil med store berøringsmål og responsivt layout.

## Hvordan PDGA-rating beregnes

Appen simulerer PDGA sin offisielle ratingalgoritme. Slik fungerer den steg for steg:

### 1. Tidsvindu

Ratingen beregnes fra runder innenfor **12 måneder** fra den nyeste ratede runden (eller en valgfri referansedato). Hvis færre enn **8 runder** finnes innen 12 måneder, utvides vinduet til **24 måneder**.

### 2. Fjerning av avvik (outliers)

Når det er **7 eller flere runder** i vinduet, fjernes runder som er:

- Mer enn **2,5 standardavvik under gjennomsnittet**, eller
- Mer enn **100 ratingpoeng under gjennomsnittet**

Den høyeste av disse to tersklene brukes. Runder under terskelen ekskluderes fra beregningen.

### 3. Dobbelvekting av nyeste runder

Når **9 eller flere runder** gjenstår etter fjerning av avvik, telles de nyeste **25 %** av rundene (rundet opp) dobbelt. Disse rundene får vekt 2 i stedet for 1 i beregningen.

### 4. Endelig rating

Ratingen beregnes som et **vektet gjennomsnitt** av alle inkluderte runder, **avrundet til nærmeste heltall**.

```
rating = sum(rundeRating × vekt) / sum(vekt)
```

### Eksempel

| Runde | Rating | Vekt | Bidrag |
|-------|--------|------|--------|
| Runde 1 (nyeste) | 950 | 2 | 1900 |
| Runde 2 | 930 | 2 | 1860 |
| Runde 3 | 920 | 1 | 920 |
| Runde 4 | 910 | 1 | 910 |
| ... | ... | ... | ... |

Vektet snitt = totalBidrag / totalVekt

### Kilde

Denne algoritmen er basert på PDGA sine publiserte regler for ratingberegning. Se [PDGA Rating FAQ](https://www.pdga.com/faq/ratings) for offisiell dokumentasjon.

## Teknologi

- [Next.js](https://nextjs.org) (App Router)
- TypeScript
- Tailwind CSS
- [Cheerio](https://cheerio.js.org) (HTML-parsing av PDGA-sider)
- Vercel (deploy)

## Kom i gang

```bash
# Klon repoet
git clone https://github.com/ditt-brukernavn/pdga-rating.git
cd pdga-rating

# Installer avhengigheter
npm install

# Opprett .env.local (se .env.example)
cp .env.example .env.local

# Start utviklingsserver
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

## Miljøvariabler

Se [`.env.example`](.env.example) for alle tilgjengelige variabler:

| Variabel | Beskrivelse |
|----------|-------------|
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | Google AdSense client-ID (valgfri) |
| `NEXT_PUBLIC_ADSENSE_SLOT_ID` | Google AdSense slot-ID (valgfri) |
| `PDGA_API_KEY` | PDGA API-nøkkel (valgfri — faller tilbake til scraping) |
| `PDGA_API_SECRET` | PDGA API-hemmelighet (valgfri) |

## Deploy

Appen er laget for deploy på [Vercel](https://vercel.com). Push til `main`-branchen for automatisk deploy.

## Datakilde

Spillerdata hentes fra [pdga.com](https://www.pdga.com). All data tilhører PDGA.

> Spillerdata © 2026 PDGA
