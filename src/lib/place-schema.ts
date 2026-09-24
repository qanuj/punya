import { field, fieldNumber, itemImage, itemSummary, type CmsItem } from "@/lib/cms";
import { mapCoordinates } from "@/lib/embeds";

/**
 * A gaushala, in the form a search engine reads.
 *
 * Everything here was already in the CMS - the address in four fields, the
 * phone, the email, the coordinates inside the map link - and none of it was
 * described to anything but a human reader. The site's only structured data
 * was its FAQ list, so a shelter with a street address, a phone number and a
 * pin on a map published nothing a crawler could put on one.
 *
 * `AnimalShelter` rather than the generic `Place`: schema.org has the type,
 * Google understands it as a LocalBusiness, and it is what this is.
 */
export function placeSchema(item: CmsItem): Record<string, unknown> | null {
  const name = field(item, "name") || item.title;
  if (!name) return null;

  const street = field(item, "addressLine").trim();
  const city = field(item, "city").trim();
  const region = field(item, "region").trim();
  const postalCode = field(item, "postalCode").trim();
  const country = field(item, "country").trim();

  const phone = field(item, "phone").trim();
  const email = field(item, "email").trim();
  const mapUrl = field(item, "mapUrl").trim();
  const image = itemImage(item);
  const summary = itemSummary(item);
  const capacity = fieldNumber(item, "capacity");

  /*
   * The coordinates live in the map link in the body rather than in fields of
   * their own, so they are read back out of it. Absent is fine: an address
   * without a pin is still an address, and a made-up pin is worse than none.
   */
  const at = mapCoordinates(field(item, "description")) ?? mapCoordinates(mapUrl);

  const address =
    street || city || region || postalCode
      ? {
          "@type": "PostalAddress",
          ...(street ? { streetAddress: street } : {}),
          ...(city ? { addressLocality: city } : {}),
          ...(region ? { addressRegion: region } : {}),
          ...(postalCode ? { postalCode } : {}),
          ...(country ? { addressCountry: country } : {}),
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "AnimalShelter",
    name,
    ...(summary ? { description: summary } : {}),
    ...(image ? { image } : {}),
    ...(address ? { address } : {}),
    ...(phone ? { telephone: phone } : {}),
    ...(email ? { email } : {}),
    ...(mapUrl ? { hasMap: mapUrl } : {}),
    ...(at ? { geo: { "@type": "GeoCoordinates", latitude: at.lat, longitude: at.lng } } : {}),
    // A shelter's capacity is the number of animals it is built for, which is
    // what this field holds and what a reader of the page is told.
    ...(capacity ? { maximumAttendeeCapacity: capacity } : {}),
  };
}
