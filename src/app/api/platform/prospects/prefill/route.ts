import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/gateway/requireAdmin';
import comuniData from '@/lib/data/comuni.json';

type ComuneRecord = { codice: string; nome: string; sigla: string; provincia: string; regione: string };
const comuni = comuniData as ComuneRecord[];

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function isGoogleMapsUrl(url: string): boolean {
  return /^https?:\/\/(maps\.app\.goo\.gl|www\.google\.com\/maps|maps\.google\.com)/.test(url);
}

async function resolveCanonicalUrl(url: string): Promise<string> {
  if (!url.includes('maps.app.goo.gl')) return url;
  const res = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
  });
  return res.url;
}

function extractPlaceId(url: string): string | null {
  const match = url.match(/[!&]1s(ChIJ[^!&\s]+)/);
  return match?.[1] ?? null;
}

function parseGoogleMapsUrl(url: string): { name: string | null; lat: number | null; lng: number | null } {
  const nameMatch = url.match(/\/maps\/place\/([^/@?]+)/);
  const name = nameMatch ? decodeURIComponent(nameMatch[1].replace(/\+/g, ' ')) : null;
  const coordMatch = url.match(/@(-?\d+\.?\d+),(-?\d+\.?\d+)/);
  const lat = coordMatch ? parseFloat(coordMatch[1]) : null;
  const lng = coordMatch ? parseFloat(coordMatch[2]) : null;
  return { name, lat, lng };
}

type AddressComponent = { longText: string; shortText: string; types: string[] };

function parseAddressComponents(components: AddressComponent[]): { city: string; province: string; region: string } {
  let city = '';
  let province = '';
  let region = '';
  for (const c of components) {
    if (c.types.includes('locality')) city = c.longText;
    if (c.types.includes('administrative_area_level_2')) province = c.shortText;
    if (c.types.includes('administrative_area_level_1')) region = c.longText;
  }
  return { city, province, region };
}

function findComune(cityName: string, province: string): ComuneRecord | null {
  const normCity = normalize(cityName);
  const normProv = normalize(province);
  return (
    comuni.find((c) => normalize(c.nome) === normCity && (c.sigla.toLowerCase() === normProv || normalize(c.provincia) === normProv)) ??
    comuni.find((c) => normalize(c.nome) === normCity) ??
    null
  );
}

const PLACES_BASE = 'https://places.googleapis.com/v1';
const DETAILS_MASK = 'displayName,nationalPhoneNumber,internationalPhoneNumber,formattedAddress,addressComponents';
const SEARCH_MASK  = 'places.id,places.displayName,places.formattedAddress,places.addressComponents,places.nationalPhoneNumber,places.internationalPhoneNumber';

async function googleJson(res: Response, label: string): Promise<unknown> {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (data as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`;
    console.error(`[prefill] ${label} error ${res.status}:`, msg);
    throw new Error(msg);
  }
  return data;
}

async function fetchPlaceDetails(placeId: string, apiKey: string) {
  const res = await fetch(`${PLACES_BASE}/places/${encodeURIComponent(placeId)}`, {
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': DETAILS_MASK },
  });
  return googleJson(res, 'PlaceDetails');
}

async function textSearch(query: string, lat: number | null, lng: number | null, apiKey: string) {
  const body: Record<string, unknown> = { textQuery: query };
  if (lat !== null && lng !== null) {
    body.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius: 500 } };
  }
  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: 'POST',
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': SEARCH_MASK, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await googleJson(res, 'TextSearch') as { places?: unknown[] };
  console.log('[prefill] TextSearch results:', data?.places?.length ?? 0, 'for query:', query);
  return data?.places?.[0] ?? null;
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Chiave API Google non configurata' }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { url?: string } | null;
  if (!body?.url) {
    return NextResponse.json({ error: 'URL mancante' }, { status: 400 });
  }

  if (!isGoogleMapsUrl(body.url)) {
    return NextResponse.json({ error: 'URL non valido' }, { status: 400 });
  }

  try {
    const canonicalUrl = await resolveCanonicalUrl(body.url);
    console.log('[prefill] canonical URL:', canonicalUrl.slice(0, 120));

    let placeData: unknown = null;
    const placeId = extractPlaceId(canonicalUrl);
    console.log('[prefill] extracted place ID:', placeId);

    if (placeId) {
      placeData = await fetchPlaceDetails(placeId, apiKey);
    }

    if (!placeData) {
      const { name, lat, lng } = parseGoogleMapsUrl(canonicalUrl);
      if (!name) {
        return NextResponse.json({ error: 'Impossibile estrarre dati dal link' }, { status: 400 });
      }
      placeData = await textSearch(name, lat, lng, apiKey);
    }

    if (!placeData) {
      return NextResponse.json({ error: 'Nessun risultato trovato per questo link' }, { status: 404 });
    }

    const pd = placeData as {
      displayName?: { text?: string };
      nationalPhoneNumber?: string;
      internationalPhoneNumber?: string;
      formattedAddress?: string;
      addressComponents?: AddressComponent[];
    };

    const { city, province, region } = parseAddressComponents(pd.addressComponents ?? []);
    const comune = city ? findComune(city, province) : null;

    return NextResponse.json({
      name:        pd.displayName?.text ?? null,
      phone_shop:  pd.nationalPhoneNumber ?? pd.internationalPhoneNumber ?? null,
      address:     pd.formattedAddress ?? null,
      comune_code: comune?.codice ?? null,
      city:        comune?.nome ?? city ?? null,
      province:    comune?.sigla ?? province ?? null,
      region:      comune?.regione ?? region ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
