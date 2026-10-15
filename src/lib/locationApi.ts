import { api } from "./api";

export interface SuggestedPlace {
  name: string;
  address: string;
  lat: number;
  lng: number;
  place_id: string;
  rating: number | null;
  user_ratings_total: number;
}

export interface NearbySuggestionsResponse {
  search_center: { lat: number; lng: number };
  practitioner: {
    name: string;
    base_lat: number;
    base_lng: number;
    base_address: string;
    pincode: string;
  };
  radius_m: number;
  type: string;
  suggestions: SuggestedPlace[];
}

export const getNearbySuggestions = async (
  slug: string,
  customer_pincode: string,
  type = "cafe",
  radius = 2000
): Promise<NearbySuggestionsResponse> => {
  return api<NearbySuggestionsResponse>(
    `/api/locations/nearby-suggestions?slug=${slug}&customer_pincode=${customer_pincode}&type=${type}&radius=${radius}`
  );
};

export type PartnerSpace = {
  id: string;
  space_name: string;
  address: string;
  city: string;
  pin: string;
  capacity: number;
  space_type: string;
  amenities: string[];
  notes: string;
  space_images?: { id: string; image_url: string; sort_order: number }[];
};

export async function getPublicSpacesByPin(pin: string): Promise<{ spaces: PartnerSpace[] }> {
  return api<{ spaces: PartnerSpace[] }>(`/api/spaces?pin=${pin}`);
}
