import { CrimeRecord, CityStats } from '../types/crime';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

class OpenAIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private generateSystemPrompt(data: CrimeRecord[], cityStats: CityStats[]): string {
    const totalCrimes = data.length;
    const citiesAnalyzed = cityStats.length;
    const safestCity = cityStats.find(city => city.safetyRating === Math.max(...cityStats.map(c => c.safetyRating)));
    const mostDangerousCity = cityStats.find(city => city.safetyRating === Math.min(...cityStats.map(c => c.safetyRating)));
    const averageAge = totalCrimes > 0 ? Math.round(data.reduce((sum, record) => sum + record.victimAge, 0) / totalCrimes) : 0;
    const closedCases = data.filter(record => record.caseClosed === 'Yes').length;
    const closureRate = totalCrimes > 0 ? ((closedCases / totalCrimes) * 100).toFixed(1) : '0';
    
    // Crime type analysis
    const crimeTypes = new Map<string, number>();
    data.forEach(record => {
      crimeTypes.set(record.crimeDescription, (crimeTypes.get(record.crimeDescription) || 0) + 1);
    });
    const topCrimes = Array.from(crimeTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([crime, count]) => `${crime}: ${count} cases`)
      .join(', ');

    // Time pattern analysis
    const hourMap = new Map<number, number>();
    data.forEach(record => {
      try {
        const hour = parseInt(record.timeOfOccurrence.split(':')[0]);
        if (hour >= 0 && hour <= 23) {
          hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
        }
      } catch (error) {
        // Skip invalid times
      }
    });
    const peakHour = Array.from(hourMap.entries()).reduce((max, current) =>
      current[1] > max[1] ? current : max, [0, 0]
    )[0];

    return `You are an expert Crime Data Analysis AI Assistant for an Indian crime analysis dashboard. You have access to comprehensive crime data and should provide insightful, data-driven responses about crime patterns, safety recommendations, and statistical analysis.

CURRENT DATASET OVERVIEW:
- Total crimes analyzed: ${totalCrimes.toLocaleString()} records
- Cities covered: ${citiesAnalyzed} Indian cities
- Case closure rate: ${closureRate}%
- Average victim age: ${averageAge} years
- Peak crime hour: ${peakHour}:00
- Safest city: ${safestCity?.city || 'N/A'} (Safety rating: ${safestCity?.safetyRating || 'N/A'}/5)
- Highest risk city: ${mostDangerousCity?.city || 'N/A'} (Safety rating: ${mostDangerousCity?.safetyRating || 'N/A'}/5)
- Top crime types: ${topCrimes}

INSTRUCTIONS:
1. Always base your responses on the actual data provided
2. Provide specific statistics, percentages, and numbers when relevant
3. Give practical safety recommendations based on patterns in the data
4. Be professional but engaging in your communication style
5. When discussing cities, reference their actual safety ratings and crime statistics
6. Explain crime patterns in terms of time, location, demographics, and other factors
7. Provide actionable insights for crime prevention and personal safety
8. Use emojis sparingly but effectively to enhance readability
9. Keep responses concise but informative (aim for 150-300 words)
10. Always prioritize user safety and provide helpful, constructive advice

RESPONSE STYLE:
- Start with a brief acknowledgment of the user's question
- Provide relevant data-backed insights
- Include practical recommendations when appropriate
- End with an engaging question or offer for further analysis if relevant

Remember: You're analyzing real Indian crime data, so provide context-appropriate recommendations for Indian cities and situations.`;
  }

  private generateDataContext(data: CrimeRecord[], cityStats: CityStats[], userMessage: string): string {
    // Extract relevant data based on user query
    const query = userMessage.toLowerCase();
    let context = '';

    // City-specific analysis
    if (query.includes('city') || query.includes('cities')) {
      const topSafeCities = cityStats
        .sort((a, b) => b.safetyRating - a.safetyRating)
        .slice(0, 5)
        .map(city => `${city.city}: ${city.safetyRating}/5 rating, ${city.totalCrimes} crimes, ${((city.closedCases/city.totalCrimes)*100).toFixed(1)}% closure rate`)
        .join('; ');
      
      const bottomCities = cityStats
        .sort((a, b) => a.safetyRating - b.safetyRating)
        .slice(0, 3)
        .map(city => `${city.city}: ${city.safetyRating}/5 rating, ${city.totalCrimes} crimes`)
        .join('; ');

      context += `\nTOP SAFE CITIES: ${topSafeCities}\nHIGHER RISK CITIES: ${bottomCities}`;
    }

    // Time pattern analysis
    if (query.includes('time') || query.includes('when') || query.includes('hour')) {
      const hourMap = new Map<number, number>();
      data.forEach(record => {
        try {
          const hour = parseInt(record.timeOfOccurrence.split(':')[0]);
          if (hour >= 0 && hour <= 23) {
            hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
          }
        } catch (error) {
          // Skip invalid times
        }
      });

      const timePatterns = Array.from(hourMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([hour, count]) => `${hour}:00 (${count} crimes)`)
        .join(', ');

      context += `\nTIME PATTERNS - Peak hours: ${timePatterns}`;
    }

    // Crime type analysis
    if (query.includes('crime') || query.includes('type') || query.includes('most')) {
      const crimeTypes = new Map<string, number>();
      data.forEach(record => {
        crimeTypes.set(record.crimeDescription, (crimeTypes.get(record.crimeDescription) || 0) + 1);
      });

      const topCrimes = Array.from(crimeTypes.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([crime, count]) => `${crime} (${count} cases, ${((count/data.length)*100).toFixed(1)}%)`)
        .join('; ');

      context += `\nCRIME TYPES: ${topCrimes}`;
    }

    // Weapon analysis
    if (query.includes('weapon') || query.includes('armed')) {
      const weaponCrimes = data.filter(record => {
        const weapon = record.weaponUsed?.toLowerCase() || '';
        return weapon !== 'none' && weapon !== 'unknown' && weapon !== '' && weapon !== 'not specified';
      });

      const weaponRate = ((weaponCrimes.length / data.length) * 100).toFixed(1);
      context += `\nWEAPON DATA: ${weaponCrimes.length} armed incidents (${weaponRate}% of all crimes)`;
    }

    // Demographics
    if (query.includes('age') || query.includes('gender') || query.includes('victim')) {
      const genderMap = new Map<string, number>();
      data.forEach(record => {
        genderMap.set(record.victimGender, (genderMap.get(record.victimGender) || 0) + 1);
      });

      const genderStats = Array.from(genderMap.entries())
        .map(([gender, count]) => `${gender}: ${((count/data.length)*100).toFixed(1)}%`)
        .join(', ');

      const averageAge = Math.round(data.reduce((sum, record) => sum + record.victimAge, 0) / data.length);
      context += `\nDEMOGRAPHICS: Average age ${averageAge} years, Gender distribution: ${genderStats}`;
    }

    return context;
  }

  async generateResponse(userMessage: string, data: CrimeRecord[], cityStats: CityStats[]): Promise<string> {
    try {
      // Validate input
      if (!userMessage || userMessage.trim().length === 0) {
        throw new Error('Empty user message');
      }

      if (!this.apiKey || this.apiKey.trim().length === 0) {
        throw new Error('OpenAI API key not configured');
      }

      const systemPrompt = this.generateSystemPrompt(data, cityStats);
      const dataContext = this.generateDataContext(data, cityStats, userMessage);

      const messages: OpenAIMessage[] = [
        {
          role: 'system',
          content: systemPrompt + dataContext
        },
        {
          role: 'user',
          content: userMessage
        }
      ];

      console.log('Sending request to OpenAI API...');

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
          presence_penalty: 0.1,
          frequency_penalty: 0.1
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.text();
          errorMessage += ` - ${errorData}`;
        } catch (readError) {
          console.warn('Could not read error response body:', readError);
        }
        console.error('OpenAI API Error:', errorMessage);
        throw new Error(`OpenAI API request failed: ${errorMessage}`);
      }

      const result: OpenAIResponse = await response.json();

      if (!result.choices || result.choices.length === 0) {
        throw new Error('No response from OpenAI API');
      }

      return result.choices[0].message.content;

    } catch (error) {
      console.error('Error calling OpenAI API:', error);

      // Categorize error types for better debugging
      let errorType = 'unknown';
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorType = 'network';
      } else if (error instanceof Error && error.message.includes('aborted')) {
        errorType = 'timeout';
      } else if (error instanceof Error && error.message.includes('API key')) {
        errorType = 'auth';
      } else if (error instanceof Error && error.message.includes('stream')) {
        errorType = 'stream';
      }

      console.log(`OpenAI Error Type: ${errorType}`);

      // Return a fallback response based on the user's message
      return this.generateFallbackResponse(userMessage, data, cityStats);
    }
  }

  private generateFallbackResponse(userMessage: string, data: CrimeRecord[], cityStats: CityStats[]): string {
    const query = userMessage.toLowerCase();
    
    if (query.includes('safest') && query.includes('city')) {
      const safestCity = cityStats.reduce((prev, current) =>
        prev.safetyRating > current.safetyRating ? prev : current
      );
      return `🏆 Based on our analysis, **${safestCity.city}** is the safest city with a ${safestCity.safetyRating}/5 safety rating. This city has ${safestCity.totalCrimes.toLocaleString()} total crimes and a ${((safestCity.closedCases / safestCity.totalCrimes) * 100).toFixed(1)}% case closure rate. The low crime rate and effective policing make it a relatively secure location.`;
    }
    
    if (query.includes('total') || query.includes('statistics')) {
      const closedCases = data.filter(r => r.caseClosed === 'Yes').length;
      const closureRate = ((closedCases / data.length) * 100).toFixed(1);
      return `📊 **Crime Statistics Overview:**\n\n• Total crimes analyzed: ${data.length.toLocaleString()}\n• Cities covered: ${cityStats.length}\n• Case closure rate: ${closureRate}%\n• Average victim age: ${Math.round(data.reduce((sum, record) => sum + record.victimAge, 0) / data.length)} years\n\nThis comprehensive dataset provides valuable insights into crime patterns across Indian cities.`;
    }
    
    return `🤖 I understand you're asking about "${userMessage}". I can help analyze our crime dataset of ${data.length.toLocaleString()} records across ${cityStats.length} cities. Try asking about specific cities, crime types, safety statistics, or time patterns for detailed insights based on the actual data.`;
  }
}

// Singleton instance
let openAIService: OpenAIService | null = null;

export const initializeOpenAI = (apiKey: string): OpenAIService => {
  openAIService = new OpenAIService(apiKey);
  return openAIService;
};

export const getOpenAIService = (): OpenAIService | null => {
  return openAIService;
};

export default OpenAIService;
