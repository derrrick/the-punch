// This file now just re-exports everything from the database module
// All data is fetched from Supabase instead of static JSON
export type { Foundry, FoundriesData } from './foundries-db';
export {
  getAllFoundries,
  getFoundryBySlug,
  getFoundriesByCountry,
  getFoundriesByStyle,
  searchFoundries,
  getAllStyles,
  getAllCountries,
} from './foundries-db';
