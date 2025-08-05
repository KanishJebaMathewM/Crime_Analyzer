import { SafetyCenter, SafetyCenterSchema } from '../types/crime';
import emergencyContactsData from '../config/emergencyContacts.json';

export interface EmergencyContactsData {
  lastUpdated: string;
  version: string;
  source: string;
  cities: Record<string, CityEmergencyData>;
  nationalNumbers: Record<string, string>;
  fallbackContacts: Record<string, FallbackContact>;
}

export interface CityEmergencyData {
  police: EmergencyContact[];
  medical: EmergencyContact[];
  fire: EmergencyContact[];
}

export interface EmergencyContact {
  name: string;
  address: string;
  phone: string;
  alternatePhone?: string;
  available24x7: boolean;
  services: string[];
  verified: boolean;
  lastVerified: string;
}

export interface FallbackContact {
  name: string;
  phone: string;
  description: string;
}

export class EmergencyContactsService {
  private data: EmergencyContactsData;
  private cache = new Map<string, SafetyCenter[]>();
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  constructor() {
    this.data = emergencyContactsData as EmergencyContactsData;
    this.validateData();
  }

  /**
   * Validate the emergency contacts data structure
   */
  private validateData(): void {
    if (!this.data.cities || typeof this.data.cities !== 'object') {
      throw new Error('Invalid emergency contacts data: missing cities');
    }

    if (!this.data.nationalNumbers || typeof this.data.nationalNumbers !== 'object') {
      throw new Error('Invalid emergency contacts data: missing national numbers');
    }

    if (!this.data.fallbackContacts || typeof this.data.fallbackContacts !== 'object') {
      throw new Error('Invalid emergency contacts data: missing fallback contacts');
    }

    // Validate that each city has required contact types
    for (const [cityName, cityData] of Object.entries(this.data.cities)) {
      if (!cityData.police || !Array.isArray(cityData.police)) {
        console.warn(`City ${cityName} missing police contacts`);
      }
      if (!cityData.medical || !Array.isArray(cityData.medical)) {
        console.warn(`City ${cityName} missing medical contacts`);
      }
      if (!cityData.fire || !Array.isArray(cityData.fire)) {
        console.warn(`City ${cityName} missing fire contacts`);
      }
    }
  }

  /**
   * Get safety centers for a specific city
   */
  public getSafetyCentersForCity(city: string): SafetyCenter[] {
    const cacheKey = city.toLowerCase();
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return cached;
    }

    const centers: SafetyCenter[] = [];

    // Find city data (case-insensitive)
    const cityData = this.findCityData(city);

    if (cityData) {
      // Add police stations
      cityData.police.forEach(contact => {
        centers.push(this.convertToSafetyCenter(contact, 'Police Station'));
      });

      // Add hospitals
      cityData.medical.forEach(contact => {
        centers.push(this.convertToSafetyCenter(contact, 'Hospital'));
      });

      // Add fire stations
      cityData.fire.forEach(contact => {
        centers.push(this.convertToSafetyCenter(contact, 'Fire Station'));
      });
    }

    // If no city-specific data found, use fallbacks
    if (centers.length === 0) {
      centers.push(...this.getFallbackContacts(city));
    }

    // Add national emergency numbers
    centers.push(...this.getNationalEmergencyContacts());

    // Cache the results
    this.cache.set(cacheKey, centers);

    // Validate each center before returning
    return centers.filter(center => {
      const validation = SafetyCenterSchema.safeParse(center);
      if (!validation.success) {
        console.warn('Invalid safety center data:', center, validation.error);
        return false;
      }
      return true;
    });
  }

  /**
   * Find city data with fuzzy matching
   */
  private findCityData(city: string): CityEmergencyData | null {
    const normalizedCity = city.toLowerCase().trim();

    // Exact match first
    for (const [cityName, cityData] of Object.entries(this.data.cities)) {
      if (cityName.toLowerCase() === normalizedCity) {
        return cityData;
      }
    }

    // Partial match
    for (const [cityName, cityData] of Object.entries(this.data.cities)) {
      if (cityName.toLowerCase().includes(normalizedCity) || 
          normalizedCity.includes(cityName.toLowerCase())) {
        return cityData;
      }
    }

    return null;
  }

  /**
   * Convert emergency contact to safety center format
   */
  private convertToSafetyCenter(
    contact: EmergencyContact, 
    type: 'Police Station' | 'Hospital' | 'Fire Station'
  ): SafetyCenter {
    const phone = contact.alternatePhone 
      ? `${contact.phone} / ${contact.alternatePhone}`
      : contact.phone;

    return {
      name: contact.name,
      type,
      address: contact.address,
      phone,
      availability: contact.available24x7 ? '24/7' : 'Business Hours',
      services: contact.services || [],
    };
  }

  /**
   * Get fallback contacts when city-specific data is not available
   */
  private getFallbackContacts(city: string): SafetyCenter[] {
    const centers: SafetyCenter[] = [];

    if (this.data.fallbackContacts.police) {
      centers.push({
        name: `${city} Police Station`,
        type: 'Police Station',
        address: `Police Headquarters, ${city}`,
        phone: this.data.fallbackContacts.police.phone,
        availability: '24/7',
        services: ['Emergency Response', 'Crime Reporting', 'Traffic Control'],
      });
    }

    if (this.data.fallbackContacts.medical) {
      centers.push({
        name: `${city} Government Hospital`,
        type: 'Hospital',
        address: `Government Hospital, ${city}`,
        phone: this.data.fallbackContacts.medical.phone,
        availability: '24/7',
        services: ['Emergency Care', 'Trauma Unit', 'Ambulance Services'],
      });
    }

    if (this.data.fallbackContacts.fire) {
      centers.push({
        name: `${city} Fire Station`,
        type: 'Fire Station',
        address: `Fire Station, ${city}`,
        phone: this.data.fallbackContacts.fire.phone,
        availability: '24/7',
        services: ['Fire Emergency', 'Rescue Operations', 'Emergency Medical'],
      });
    }

    return centers;
  }

  /**
   * Get national emergency contacts
   */
  private getNationalEmergencyContacts(): SafetyCenter[] {
    const centers: SafetyCenter[] = [];

    if (this.data.nationalNumbers.police) {
      centers.push({
        name: 'National Police Emergency',
        type: 'Emergency Services',
        address: 'Available nationwide',
        phone: this.data.nationalNumbers.police,
        availability: '24/7',
        services: ['Emergency Police Response'],
      });
    }

    if (this.data.nationalNumbers.ambulance) {
      centers.push({
        name: 'National Ambulance Service',
        type: 'Emergency Services',
        address: 'Available nationwide',
        phone: this.data.nationalNumbers.ambulance,
        availability: '24/7',
        services: ['Emergency Medical Response', 'Ambulance Services'],
      });
    }

    if (this.data.nationalNumbers.fire) {
      centers.push({
        name: 'National Fire Emergency',
        type: 'Emergency Services',
        address: 'Available nationwide',
        phone: this.data.nationalNumbers.fire,
        availability: '24/7',
        services: ['Fire Emergency', 'Rescue Operations'],
      });
    }

    return centers;
  }

  /**
   * Get all supported cities
   */
  public getSupportedCities(): string[] {
    return Object.keys(this.data.cities).sort();
  }

  /**
   * Check if a city has specific emergency contact data
   */
  public hasCityData(city: string): boolean {
    return this.findCityData(city) !== null;
  }

  /**
   * Get national emergency numbers
   */
  public getNationalNumbers(): Record<string, string> {
    return { ...this.data.nationalNumbers };
  }

  /**
   * Get data freshness information
   */
  public getDataInfo(): {
    lastUpdated: string;
    version: string;
    source: string;
    supportedCities: number;
  } {
    return {
      lastUpdated: this.data.lastUpdated,
      version: this.data.version,
      source: this.data.source,
      supportedCities: Object.keys(this.data.cities).length,
    };
  }

  /**
   * Refresh/clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update emergency contacts data (for future API integration)
   */
  public async updateEmergencyContacts(): Promise<void> {
    // In the future, this could fetch updated data from an API
    // For now, just clear the cache to force fresh data loading
    this.clearCache();
    console.log('Emergency contacts cache cleared');
  }

  /**
   * Search for emergency contacts by service type
   */
  public searchByServiceType(
    city: string, 
    serviceType: 'police' | 'medical' | 'fire' | 'emergency'
  ): SafetyCenter[] {
    const allCenters = this.getSafetyCentersForCity(city);

    switch (serviceType) {
      case 'police':
        return allCenters.filter(center => center.type === 'Police Station');
      case 'medical':
        return allCenters.filter(center => center.type === 'Hospital');
      case 'fire':
        return allCenters.filter(center => center.type === 'Fire Station');
      case 'emergency':
        return allCenters.filter(center => center.type === 'Emergency Services');
      default:
        return allCenters;
    }
  }

  /**
   * Format emergency contact for sharing
   */
  public formatContactForSharing(center: SafetyCenter): string {
    return `${center.name}\n📍 ${center.address}\n📞 ${center.phone}\n🕒 ${center.availability}\n🚨 Services: ${center.services.join(', ')}`;
  }

  /**
   * Get closest emergency contact by type (placeholder for future GPS integration)
   */
  public getClosestContact(
    city: string,
    serviceType: 'police' | 'medical' | 'fire',
    userLocation?: { lat: number; lng: number }
  ): SafetyCenter | null {
    const contacts = this.searchByServiceType(city, serviceType);
    
    if (contacts.length === 0) return null;

    // For now, return the first contact
    // In the future, this could calculate distance based on userLocation
    return contacts[0];
  }
}

// Singleton instance
let emergencyContactsService: EmergencyContactsService | null = null;

export const getEmergencyContactsService = (): EmergencyContactsService => {
  if (!emergencyContactsService) {
    emergencyContactsService = new EmergencyContactsService();
  }
  return emergencyContactsService;
};
