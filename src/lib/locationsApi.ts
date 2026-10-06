import { api } from "./api";

export type LocationSuggestion = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  place_id: string;
  rating?: number;
  open_now?: boolean;
};

export type NearbySuggestionsResponse = {
  search_center: {
    lat: number;
    lng: number;
  };
  practitioner: any;
  radius_m: number;
  type: string;
  suggestions: LocationSuggestion[];
};

export async function getNearbySuggestions(
  slug: string,
  customer_pincode: string,
  type: string = "cafe",
  radius: number = 2000
): Promise<NearbySuggestionsResponse> {
  const params = new URLSearchParams({
    slug,
    type,
    radius: radius.toString(),
  });
  if (customer_pincode) {
    params.append("customer_pincode", customer_pincode);
  }
  return api<NearbySuggestionsResponse>(`/api/locations/nearby-suggestions?${params.toString()}`);
}
