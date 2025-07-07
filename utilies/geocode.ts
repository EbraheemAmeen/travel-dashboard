// utils/geocode.ts
import axios from "axios";

export async function geocodeLocation(location: string) {
  const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY; // from .env
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${apiKey}`;

  const response = await axios.get(url);
  return response.data;
}
