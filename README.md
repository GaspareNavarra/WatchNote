# WatchNote

App Vue 3 + TypeScript + Capacitor per tenere traccia di film, serie TV e anime visti, con possibilità di segnare il singolo episodio guardato. I dati sono salvati su Supabase, con autenticazione utente (email + password) e Row Level Security per isolare i dati di ciascun utente.

## Setup

1. **Database**: apri il progetto Supabase, vai su *SQL Editor* ed esegui il contenuto di [`supabase/schema.sql`](supabase/schema.sql). Crea le tabelle `titles` ed `episodes` con le relative policy RLS.
2. **Variabili d'ambiente**: il file `.env` contiene già `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Se cambi progetto Supabase, aggiorna questi valori (vedi `.env.example` come riferimento).
3. **Autenticazione**: assicurati che in Supabase, sotto *Authentication > Providers*, sia abilitato "Email" (con o senza conferma email a seconda delle tue preferenze).

## Sviluppo web

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Mobile (Capacitor)

Dopo ogni build, sincronizza gli asset con i progetti nativi:

```bash
npm run build
npx cap sync
```

Poi apri il progetto nativo:

```bash
npx cap open android   # richiede Android Studio
npx cap open ios       # richiede Xcode (solo su macOS)
```

## Struttura dati

- **titles**: film, serie o anime (`type`: `movie` | `series` | `anime`), con stato (`plan_to_watch`, `watching`, `completed`, `dropped`).
- **episodes**: singoli episodi collegati a un titolo (`title_id`), organizzati per stagione/numero episodio, con flag `watched`. Per i film non servono episodi: lo stato "visto" è lo stato del titolo stesso.
