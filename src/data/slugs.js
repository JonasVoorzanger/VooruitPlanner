// Het eerste stuk van het pad is het adres van een school: vooruitplanner.nl/<slug>.
// Dit bestand heeft geen imports, zodat de Cloud Functions (fase 4) dezelfde
// regels kunnen gebruiken bij het aanmelden van een school.

// Paden die de app zelf gebruikt of nog gaat gebruiken. Geen school krijgt zo'n
// slug.
export const RESERVED_SLUGS = new Set([
  'aanmelden',
  'admin',
  'api',
  'app',
  'assets',
  'beheer',
  'bewerk',
  'bewerklijst',
  'contact',
  'export',
  'help',
  'inloggen',
  'intro',
  'jaar',
  'login',
  'logout',
  'over',
  'privacy',
  'school',
  'scholen',
  'static',
  'superadmin',
  'uitloggen',
  'voorwaarden',
  'www',
  'zoeken',
])

// Een slug: kleine letters en cijfers, eventueel met losse streepjes ertussen,
// 2 tot 40 tekens. Bijvoorbeeld `hal` of `het-baarnsch-lyceum`.
const SLUG_PATTERN = /^[a-z0-9](?:-?[a-z0-9])+$/

export function isValidSlug(slug) {
  return typeof slug === 'string' && slug.length <= 40 && SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug)
}

// Of een stuk pad een schooladres kan zijn: een slug (hoofdletters mogen) of
// het document-id van een school die nog niet is goedgekeurd. Zo vragen we
// Firestore nooit naar ids die het niet accepteert.
export function isSchoolAddress(segment) {
  return (
    typeof segment === 'string' &&
    /^[A-Za-z0-9-]{2,40}$/.test(segment) &&
    !RESERVED_SLUGS.has(segment.toLowerCase())
  )
}
