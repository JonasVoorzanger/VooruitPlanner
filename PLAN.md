# VooruitPlanner — build plan

## What this is
VooruitPlanner (vooruitplanner.nl) turns PeriodePlanner, a single-school period
planner, into a service that any school can use. This repo started as a copy of
PeriodePlanner, with its git history. The student-facing planner views stay; the
data layer, login and admin screens are new. The app's interface stays in Dutch.

## Where we are (handoff, 2026-09-24)

Phases 0, 1 and 2 are done; phase 3 is next. Phase 2 is on branch
`claude/determined-goodall-0rbypw`, not yet merged into `main`.

**Next steps, in order:**

1. Load the demo school into dev (blocked on access, see below):
   `npm run seed:demo -- --project vooruitplanner-development`.
2. Phase 3: editor access.

**Waiting on Jonas:**

- Write access to dev Firestore for `npm run seed:demo`. The scripts need the
  role "Cloud Datastore User" (`roles/datastore.user`) on
  `vooruitplanner-development` only, never on prod. Either:
  - on his own machine: give `jonas@leerlevels.nl` that role, or run
    `gcloud auth application-default login` with the Gmail account, then run
    the command above; or
  - for a remote session: a service account with only that role, its JSON key
    stored as the environment variable `FIREBASE_SERVICE_ACCOUNT` in the cloud
    environment's settings. The scripts refuse a key for another project.

**State of the Firebase projects:**

- `vooruitplanner-development`: Firestore `(default)` in europe-west4, rules
  from `firestore.rules` deployed, one web app ("VooruitPlanner",
  `1:892654467731:web:1776b967b3f57db6316b66`), hosting site exists. No data
  yet; it gets the demo school.
- `vooruitplanner` (prod): hosting site only. No database, no web app, nothing
  deployed. Don't touch it without asking Jonas.

**Setting up a fresh machine or remote session:**

- `npm install` (and `npm --prefix functions install` once functions exist).
- `.env.development.local` is not in git. Either get the values with
  `firebase apps:sdkconfig WEB 1:892654467731:web:1776b967b3f57db6316b66 --project dev`
  (needs a Firebase login with access), or set `VITE_USE_EMULATOR=true` and work
  fully locally. See `.env.example` and the README.
- Local run without Firebase access: `firebase emulators:start --project
  demo-vooruitplanner`, then `npm run seed:demo -- --emulator` (and/or
  `npm run migrate -- --emulator` for `hal`), then `npm run dev` and open
  `/demo`.
  The emulator needs Java.
- Checks before committing: `npm run build` and `npm run test:rules`.

**Map of the code:**

- `src/firebase.js`: Firebase app and Firestore, emulator switch.
- `src/stores/planner.js`: loads school → year → subjects. `loadSchool(slug)`
  already falls back from `slugs/{slug}` to `schools/{id}` for pending schools.
  The getters `events`, `subjects`, `weeks` and `profiles` keep the shape the
  views had with the old spreadsheet store.
- `src/router/index.js`: history mode, every school route under `/:school/`.
  The guard loads the school and the subjects a screen needs, and redirects to
  the school's real address (`/HAL` → `/hal`, an approved school's id address
  → its slug, old `/hal#/jaar/…` links → `/hal/jaar/…`).
- `src/data/slugs.js`: reserved slugs and slug validation, without imports so
  the phase 4 sign-up function can reuse it.
- `src/views/SchoolSearchView.vue` + `src/utils/schools.js`: the front page.
  It loads all active schools and searches in the browser (fine for a few
  hundred schools), and remembers the last school in localStorage.
- `src/App.vue`: "not found" and error messages based on `store.status`, the
  pending banner, and the school's name and colour in the title and theme
  (the colour's hue becomes `--accent`, see `src/style.css`).
- Store getters `address`, `basePath`, `isPending` and `years` replace the
  planned `useSchool()`; views build links with `plannerStore.basePath`.
- `firestore.rules` + `tests/firestore.rules.test.js`: rules and their tests.
- `scripts/demo/`: the demo school, "Demo College" on `/demo`. Everything is
  generated in `demo-school.js` (weeks, school-wide items, 20 subjects with
  planning and tests for klas 4 and 5); no real data. Checked by
  `tests/demo-school.test.js`.
- `scripts/migration/`: the `hal` migration and its source data, for phase 7.
- `scripts/lib/write-school.js`: shared by both: picks the target
  (`--emulator` / `--project`, refuses prod), logs in (gcloud ADC or
  `FIREBASE_SERVICE_ACCOUNT`) and writes one active school.
- `functions/`: empty scaffold from `firebase init` (JavaScript, eslint google
  config); first real use is phase 3.

**Loose ends to pick up along the way:**

- The pending banner cannot be seen yet: only admins can read a pending
  school, and admin login comes in phase 4. Check it then.
- The front page says sign-up and admin login are coming; phase 4 turns those
  into links to `/aanmelden` and `/beheer` (both already reserved).
- The student's choice is now stored per school (`plannerSelection:<schoolId>`),
  and the leerjaar buttons come from `school.years`.

- EditIndexView and SubjectEditView still tell teachers they download a CSV;
  phase 3 replaces this with saving to Firestore.
- The "Editors write inside a transaction" part of the data model is not built
  yet (phase 3).
- The emulator config in `firebase.json` also lists auth and functions ports;
  only Firestore is used so far.

**Conventions:** the interface and code comments are in Dutch; this plan and
commit messages are in English. Commit per phase. Never deploy to prod
without asking Jonas.

## Decisions already made (don't reopen these)
- **No spreadsheets.** All data lives in Firestore. Schools set themselves up;
  the owner (Jonas) should have as little management work as possible.
- **One path per school**: `vooruitplanner.nl/<slug>/…`, e.g.
  `vooruitplanner.nl/hal`. Every path after the slug is the same for all
  schools (`/hal/jaar/4/NL.EN.WI`, `/hal/bewerklijst`). The app gets the school
  from the first path segment. (This replaces the earlier one-subdomain-per-school
  plan.)
- **The root** `vooruitplanner.nl/` asks the visitor to search for their school.
  It also links to school sign-up and admin login.
- **Four kinds of user:**
  - Super-admin: only Jonas's own account (custom claim `superAdmin: true`,
    set once with an Admin SDK script, never through the app). Sees every
    school, can act as admin of any school to help with setup, and approves
    schools.
  - Students: no account, no personal data.
  - Admins (a small team per school): personal login via email magic link,
    Microsoft or Google. One person signs the school up and becomes its owner;
    the owner invites the other admins by email.
  - Editors (teachers): one shared password per school, which admins can change.
    A Cloud Function checks the password (stored hashed, never readable by
    clients) and returns a Firebase custom token with the claims
    `{ school: <schoolId>, role: 'editor' }`. Firestore rules check those claims.
    Optional later: one password per subject.
- **Approval gate:** a new school stays `pending` until Jonas approves it, or it
  is approved automatically when the owner's email is on a school domain.
- **Slugs of pending schools:** while a school is pending its address is its
  Firestore document id (`vooruitplanner.nl/<schoolId>`), and the onboarding
  says clearly that this is not its final address. The slug the school asked
  for becomes its address once it is approved.
- **Store as little personal data (AVG/GDPR) as possible.** The only personal
  data is admin email addresses, plus an optional free-text editor name on edits.
- **Firebase:** `vooruitplanner-development` (alias `dev`) and `vooruitplanner`
  (alias `prod`). Firestore region `europe-west4`. They replace the old
  `periodeplanner` project.
- **Hosting:** Firebase Hosting on vooruitplanner.nl, every path rewritten to
  index.html.
- **No analytics.** PostHog is removed. Student feedback is stored anonymously
  in Firestore (`feedback`) and is readable only by admins.
- **The Claude import runs server-side** in a Cloud Function, using Jonas's API
  key and a monthly limit per school. The browser never sees the key.
- **Test data is a demo school**, not Jonas's school: "Demo College" on
  `/demo`, fully generated (`npm run seed:demo`). Jonas's school keeps the slug
  `hal`; its migration (`npm run migrate`, from
  `scripts/migration/spreadsheet.json` and
  `scripts/migration/schoolwide-events-2026-2027.csv`) is used in phase 7, when
  the school moves to prod. Its full name and region are still to be filled in
  in `scripts/migration/migrate-hal.js` before then.

## Data model
Students should load a handful of documents per visit, not one document per
event. So events are grouped by subject.

Because a school's slug changes on approval, documents are keyed by a stable
school id, and a separate lookup maps slugs to ids:

- `slugs/{slug}`: schoolId. Public read. Created on approval. The app looks
  up the first path segment here, and falls back to `schools/{segment}` for a
  pending school's id address.
- `schools/{schoolId}`: slug, requestedSlug, name, color, logoUrl, status
  (pending | active), region (noord | midden | zuid), levels and years offered,
  profiles [{ key, label, name }], currentSchoolYear. Public read if the school
  is active.
- `schools/{schoolId}/members/{uid}`: role (owner | admin), email. Readable by
  admins of that school.
- `schools/{schoolId}/years/{schoolYear}`: weeks[] (generated) and schoolWide[]
  (school-wide items).
- `schools/{schoolId}/years/{schoolYear}/subjects/{abbr}`: fullName,
  profiles { '4_CM': true, … }, required { '4': bool, … }, items[] (the
  subject's events for every leerjaar, only filled fields), updatedAt,
  updatedBy (optional name). Editors write inside a transaction.
- `feedback/{id}`: message, context, schoolId, createdAt. Anyone may create
  (with size limits); school admins read their own school's feedback, the
  super-admin reads all.
- `private/{schoolId}`: editorPasswordHash and similar. No client access; Cloud
  Functions only.

Keep the item field names close to today's event fields, so the planner
components and utils/plannerModel.js need few changes.

## Phases
Commit per phase. Test security rules against the Firebase emulator. Never deploy
to prod without asking Jonas first.

### Phase 0: Trim and rebrand (done)
- Removed PostHog; feedback goes to Firestore.
- Removed the spreadsheet loader, the upload and settings screens, the old
  PeriodePlanner Firebase config and the unused files.
- Moved the existing data to `scripts/migration/`.
- Renamed to VooruitPlanner everywhere.
- Firebase config comes from `.env.*.local` files (see `.env.example`);
  firebase aliases `dev` and `prod`.

### Phase 1: Data model and migration (done)
- firestore.rules for the model above, tested against the emulator
  (`npm run test:rules`).
- `npm run migrate` loads the existing data as school `hal` (emulator or dev;
  it refuses prod).
- The Pinia store (`stores/planner.js`) loads from Firestore: school, year and
  the subjects a screen needs. A router guard loads them before a screen opens.
- Dev gets the demo school instead (`npm run seed:demo`); see the handoff.

### Phase 2: Choosing the school from the path (done)
- Switch to history mode; all school routes live under `/:school/`
  (`/:school/jaar/:year/:courses`, `/:school/bewerklijst`,
  `/:school/bewerk/:year/:course`).
- `useSchool()` resolves the slug via `slugs/{slug}`.
- `/` → school search. Unknown slug → a friendly "not found" page. A pending
  school is only visible to its own admins, with a banner that it is not live yet.
- Reserved slugs: every top-level route the app uses (e.g. beheer, admin,
  aanmelden, login, api, static, assets, privacy).
- The school's name, colour and logo drive the theme and the title.

### Phase 3: Editor access
- Cloud Function `editorLogin(schoolId, password)`: rate-limited; returns a
  custom token with the claims.
- Password screen in front of the bewerklijst and bewerk routes; the session
  stays signed in.
- SubjectEditView saves directly to Firestore instead of offering a CSV
  download, with an optional "your name" field.
- Rules: editors may write only their own school's subject documents.

### Phase 4: Admin area
- Sign-up: email link, Microsoft or Google. Create the school (requested slug,
  name, region, first day of the school year) with status pending, reachable
  at its id address until approval.
- Setup wizard:
  - generate the weeks from the start date;
  - pre-fill the vacations for the chosen region (a bundled table per school
    year to start with);
  - pick subjects from Dutch presets;
  - pick profiles from presets (C&M, E&M, N&G, N&T);
  - set the editor password.
- Admin screens: invite and remove admins, change the editor password, edit
  school-wide items, manage subjects and profiles, bulk PDF export (reuse
  BulkExportView).
- Super-admin screen for Jonas: an overview of all schools with status
  (pending | active), number of subjects and admins, and approve/deactivate
  buttons. Approving moves the school to its requested slug. From the overview
  Jonas can open any school's admin area to help with setup.

### Phase 5: Server-side Claude import
- Cloud Function: upload a PDF, DOCX or XLSX planner and get back proposed items
  for a subject, which the editor reviews before saving. Port the logic from
  .claude/skills/planner-import.
- Monthly usage limit per school; the API key is stored in Secret Manager.

### Phase 6: Hosting and domain
- Deploy to Firebase Hosting and connect vooruitplanner.nl.
- Add vooruitplanner.nl to Firebase Auth's allowed domains.
- Set a budget alert on the prod project.

### Phase 7: Privacy and launch
- Privacy statement, and a data processing agreement template based on the
  Privacyconvenant Onderwijs model. Mention that Firebase Auth processes data
  partly in the US (covered by the EU-US Data Privacy Framework).
- Move Jonas's school to prod, point the old PeriodePlanner domain to
  vooruitplanner.nl/hal, then archive the PeriodePlanner repo.

## Open questions (ask Jonas when they come up)
- Do schools need havo/vwo/mavo as separate levels next to leerjaar?
- Where the vacation dates come from (a bundled table or rijksoverheid data).
- Does the planner need to show several school years at once, or only the
  current one plus an archive?
