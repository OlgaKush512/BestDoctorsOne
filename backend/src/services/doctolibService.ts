import axios from "axios";
import * as cheerio from "cheerio";

export interface DoctolibSearchParams {
  specialty: string;
  location: string;
  date: string;
}

export interface DoctolibDoctor {
  id: string;
  name: string;
  specialty: string;
  address: string;
  phone: string;
  availability: string[];
  doctolibUrl: string;
}

export class DoctolibService {
  private baseUrl = "https://www.doctolib.fr";

  async searchDoctors(params: DoctolibSearchParams): Promise<DoctolibDoctor[]> {
    try {
      console.log("🔍 Searching Doctolib for doctors...");

      // Note: This is a simplified implementation
      // In a real scenario, you would need to:
      // 1. Handle Doctolib's anti-bot measures
      // 2. Use proper web scraping techniques
      // 3. Potentially use their API if available
      // 4. Handle pagination and rate limiting

      const searchUrl = this.buildSearchUrl(params);
      console.log(`📡 Fetching: ${searchUrl}`);

      const response = await axios.get(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const doctors: DoctolibDoctor[] = [];

      // Parse doctor cards from Doctolib search results
      $(".search-result-card, .doctor-card, .dl-search-result").each(
        (index, element) => {
          try {
            const $card = $(element);

            const name = this.extractDoctorName($card);
            const specialty = this.extractSpecialty($card);
            const address = this.extractAddress($card);
            const phone = this.extractPhone($card);
            const availability = this.extractAvailability($card);
            const doctolibUrl = this.extractDoctolibUrl($card);

            if (name && specialty) {
              doctors.push({
                id: `doctolib_${index}_${Date.now()}`,
                name,
                specialty,
                address: address || "Address not available",
                phone: phone || "Phone not available",
                availability,
                doctolibUrl: doctolibUrl || this.baseUrl,
              });
            }
          } catch (error) {
            console.error("Error parsing doctor card:", error);
          }
        }
      );

      console.log(`✅ Found ${doctors.length} doctors on Doctolib`);

      // If no doctors found with real scraping, return mock data for development
      if (doctors.length === 0) {
        console.log(
          "⚠️ No doctors found via scraping, returning mock data for development"
        );
        return this.getMockDoctors(params);
      }

      return doctors;
    } catch (error) {
      console.error("Doctolib search error:", error);

      // Return mock data for development when scraping fails
      console.log(
        "⚠️ Doctolib scraping failed, returning mock data for development"
      );
      return this.getMockDoctors(params);
    }
  }

  private buildSearchUrl(params: DoctolibSearchParams): string {
    const specialtySlug = this.getSpecialtySlug(params.specialty);
    const locationSlug = this.getLocationSlug(params.location);

    return `${this.baseUrl}/${specialtySlug}/${locationSlug}`;
  }

  private getSpecialtySlug(specialty: string): string {
    const specialtyMap: { [key: string]: string } = {
      Endocrinologue: "endocrinologue",
      Cardiologue: "cardiologue",
      Dermatologue: "dermatologue",
      Gynécologue: "gynecologue",
      Neurologue: "neurologue",
      Psychiatre: "psychiatre",
      Ophtalmologue: "ophtalmologue",
      ORL: "orl",
      Rhumatologue: "rhumatologue",
      "Gastro-entérologue": "gastro-enterologue",
      Pneumologue: "pneumologue",
      Urologue: "urologue",
    };

    return (
      specialtyMap[specialty] ||
      specialty.toLowerCase().replace(/[^a-z0-9]/g, "-")
    );
  }

  private getLocationSlug(location: string): string {
    return location.toLowerCase().replace(/[^a-z0-9]/g, "-");
  }

  private extractDoctorName($card: any): string {
    return $card
      .find(".doctor-name, .dl-search-result-name, h3, .card-title")
      .first()
      .text()
      .trim();
  }

  private extractSpecialty($card: any): string {
    return $card
      .find(".doctor-specialty, .dl-search-result-specialty, .specialty")
      .first()
      .text()
      .trim();
  }

  private extractAddress($card: any): string {
    return $card
      .find(".doctor-address, .dl-search-result-address, .address")
      .first()
      .text()
      .trim();
  }

  private extractPhone($card: any): string {
    return $card.find(".doctor-phone, .phone").first().text().trim();
  }

  private extractAvailability($card: any): string[] {
    const availability: string[] = [];
    $card
      .find(".availability-slot, .time-slot")
      .each((_: number, slot: any) => {
        const time = cheerio.load(slot).text().trim();
        if (time) availability.push(time);
      });
    return availability;
  }

  private extractDoctolibUrl($card: any): string {
    const link = $card.find("a").first().attr("href");
    return link
      ? link.startsWith("http")
        ? link
        : `${this.baseUrl}${link}`
      : "";
  }

  private getMockDoctors(params: DoctolibSearchParams): DoctolibDoctor[] {
    // Mock data for development purposes
    return [
      {
        id: "mock_1",
        name: "Marie Dubois",
        specialty: params.specialty,
        address: `123 Rue de la Santé, ${params.location}`,
        phone: "01 42 34 56 78",
        availability: ["14:30", "15:00", "16:30"],
        doctolibUrl:
          "https://www.doctolib.fr/endocrinologue/paris/marie-dubois",
      },
      {
        id: "mock_2",
        name: "Pierre Martin",
        specialty: params.specialty,
        address: `456 Avenue des Médecins, ${params.location}`,
        phone: "01 43 45 67 89",
        availability: ["09:00", "10:30", "14:00"],
        doctolibUrl:
          "https://www.doctolib.fr/endocrinologue/paris/pierre-martin",
      },
      {
        id: "mock_3",
        name: "Sophie Laurent",
        specialty: params.specialty,
        address: `789 Boulevard de la République, ${params.location}`,
        phone: "01 44 56 78 90",
        availability: ["11:00", "15:30", "17:00"],
        doctolibUrl:
          "https://www.doctolib.fr/endocrinologue/paris/sophie-laurent",
      },
    ];
  }
}
