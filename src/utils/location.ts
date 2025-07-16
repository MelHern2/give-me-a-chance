import { Country, State, City } from 'country-state-city';

// Tipos para los datos de ubicación
export interface Country {
  countryName: string;
  countryShortCode: string;
  regions: Region[];
}

export interface Region {
  name: string;
  shortCode: string;
}

export interface City {
  name: string;
  country: string;
  population: number;
}



// Función para obtener todos los países
export const getCountries = (): string[] => {
  return Country.getAllCountries().map(country => country.name);
};

// Función para obtener regiones de un país
export const getRegions = (countryName: string): string[] => {
  const country = Country.getAllCountries().find(c => c.name === countryName);
  if (!country) return [];
  return State.getStatesOfCountry(country.isoCode).map(state => state.name);
};

// Función para obtener ciudades filtradas por país
export const getCitiesByCountry = (countryName: string): string[] => {
  const country = Country.getAllCountries().find(c => c.name === countryName);
  if (!country) return [];
  const cities = City.getCitiesOfCountry(country.isoCode);
  return cities ? cities.map((city: any) => city.name) : [];
};

// Función para obtener ciudades filtradas por país y región
export const getCitiesByCountryAndRegion = (countryName: string, regionName: string): string[] => {
  const country = Country.getAllCountries().find(c => c.name === countryName);
  if (!country) return [];
  
  const state = State.getStatesOfCountry(country.isoCode).find(s => s.name === regionName);
  if (!state) return getCitiesByCountry(countryName);
  
  const cities = City.getCitiesOfState(country.isoCode, state.isoCode);
  return cities ? cities.map((city: any) => city.name) : [];
};

// Función para buscar ciudades con autocompletado
export const searchCities = (searchTerm: string, country?: string): string[] => {
  let allCities: string[] = [];
  
  if (country) {
    allCities = getCitiesByCountry(country);
  } else {
    // Si no hay país seleccionado, obtener ciudades de todos los países
    const countries = Country.getAllCountries();
    countries.forEach(countryData => {
      const cities = City.getCitiesOfCountry(countryData.isoCode);
      if (cities) {
        allCities.push(...cities.map((city: any) => city.name));
      }
    });
  }
  
  if (!searchTerm) return allCities.slice(0, 10);
  
  return allCities
    .filter((city: string) => 
      city.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 10);
};

// Función para obtener información de una ciudad
export const getCityInfo = (cityName: string, countryName?: string): City | null => {
  if (countryName) {
    const cities = getCitiesByCountry(countryName);
    if (cities.includes(cityName)) {
      return {
        name: cityName,
        country: countryName,
        population: 0 // No tenemos datos de población en esta versión simplificada
      };
    }
  } else {
    // Buscar en todos los países
    const countries = Country.getAllCountries();
    for (const countryData of countries) {
      const cities = City.getCitiesOfCountry(countryData.isoCode);
      if (cities) {
        const cityNames = cities.map((city: any) => city.name);
        if (cityNames.includes(cityName)) {
          return {
            name: cityName,
            country: countryData.name,
            population: 0
          };
        }
      }
    }
  }
  
  return null;
}; 