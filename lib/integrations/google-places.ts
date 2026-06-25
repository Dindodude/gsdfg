import { env } from "@/lib/env";

interface GooglePlace {
  id?: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  types?: string[];
}

interface GooglePlacesTextSearchResponse {
  places?: GooglePlace[];
}

export interface FoundLead {
  externalSourceId: string | null;
  businessName: string;
  industry: string;
  city: string;
  websiteUrl: string | null;
  email: string | null;
  phone: string | null;
  socialLinks: string[];
  currentWebsiteQualityScore: number;
  googlePresenceScore: number;
  leadScore: number;
  notes: string;
  source: string;
  estimatedValue: number;
  reviewCount: number;
  hasWebsite: boolean;
}

function inferCity(address: string | undefined, fallback: string) {
  if (!address) return fallback;
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.length >= 2 ? `${parts.at(-3) ?? parts[0]}, ${parts.at(-2) ?? ""}`.replace(/,\s*$/, "") : fallback;
}

function scoreGooglePresence(place: GooglePlace) {
  const rating = place.rating ?? 0;
  const reviews = place.userRatingCount ?? 0;
  return Math.min(100, Math.round(rating * 14 + Math.min(reviews, 300) / 6));
}

function scoreWebsiteQuality(place: GooglePlace) {
  return place.websiteUri ? 52 : 12;
}

function scoreLead(place: GooglePlace) {
  const missingWebsiteBoost = place.websiteUri ? 8 : 38;
  const reviewSignal = Math.min(place.userRatingCount ?? 0, 250) / 5;
  const ratingSignal = (place.rating ?? 0) * 6;
  return Math.min(98, Math.round(42 + missingWebsiteBoost + reviewSignal + ratingSignal));
}

function isTargetPlace(place: GooglePlace) {
  const reviewCount = place.userRatingCount ?? 0;
  const hasWebsite = Boolean(place.websiteUri);
  const isClosed = place.businessStatus === "CLOSED_PERMANENTLY";

  return reviewCount >= 100 && reviewCount <= 200 && !hasWebsite && !isClosed;
}

export async function findPlacesLeads(input: {
  industry: string;
  city: string;
  limit: number;
}): Promise<FoundLead[]> {
  if (!env.googlePlacesApiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is required for automatic lead finding.");
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.googlePlacesApiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.internationalPhoneNumber,places.googleMapsUri,places.rating,places.userRatingCount,places.businessStatus,places.types",
    },
    body: JSON.stringify({
      textQuery: `${input.industry} in ${input.city}`,
      pageSize: 20,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Places lead search failed: ${response.status} ${detail.slice(0, 240)}`);
  }

  const payload = (await response.json()) as GooglePlacesTextSearchResponse;
  return (payload.places ?? []).filter(isTargetPlace).slice(0, input.limit).map((place) => {
    const businessName = place.displayName?.text ?? "Unnamed business";
    const phone = place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null;
    const websiteQuality = scoreWebsiteQuality(place);
    const googlePresence = scoreGooglePresence(place);
    const leadScore = scoreLead(place);
    const reviewCount = place.userRatingCount ?? 0;

    return {
      externalSourceId: place.id ?? null,
      businessName,
      industry: input.industry,
      city: inferCity(place.formattedAddress, input.city),
      websiteUrl: place.websiteUri ?? null,
      email: null,
      phone,
      socialLinks: place.googleMapsUri ? [place.googleMapsUri] : [],
      currentWebsiteQualityScore: websiteQuality,
      googlePresenceScore: googlePresence,
      leadScore,
      notes: [
        `Found through Google Places for "${input.industry} in ${input.city}".`,
        place.formattedAddress ? `Address: ${place.formattedAddress}.` : null,
        place.rating ? `Google rating ${place.rating} from ${reviewCount} reviews.` : null,
        "Target match: 100-200 reviews and no website returned by Places API.",
        "Email enrichment required before cold outreach.",
      ]
        .filter(Boolean)
        .join(" "),
      source: "Google Places Text Search",
      estimatedValue: leadScore >= 85 ? 6500 : leadScore >= 70 ? 4800 : 3200,
      reviewCount,
      hasWebsite: Boolean(place.websiteUri),
    };
  });
}
