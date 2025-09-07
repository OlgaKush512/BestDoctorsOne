export class RealAIDoctorExtractor {
  
  public async extractDoctorsFromHTML(html: string, searchParams: any): Promise<any[]> {
    console.log('🤖 Using REAL AI to extract doctors from HTML...');
    
    try {
      // Извлекаем чистый текст из HTML
      const textContent = this.extractTextFromHTML(html);
      console.log(`📝 Extracted ${textContent.length} characters of text content`);
      
      // Используем реальную AI модель для анализа
      const doctors = await this.useRealAI(textContent, searchParams);
      
      console.log(`🤖 Real AI extracted ${doctors.length} doctors`);
      return doctors;
      
    } catch (error) {
      console.error('Real AI extraction error:', error);
      return [];
    }
  }

  private async useRealAI(textContent: string, searchParams: any): Promise<any[]> {
    // Создаем промпт для AI модели
    const prompt = this.createAIPrompt(textContent, searchParams);
    
    try {
      // Вызываем реальную AI модель (OpenAI GPT, Claude, или локальную модель)
      const aiResponse = await this.callAIModel(prompt);
      
      // Парсим ответ AI
      const doctors = this.parseAIResponse(aiResponse);
      
      return doctors;
      
    } catch (error) {
      console.error('AI model call failed:', error);
      return [];
    }
  }

  private createAIPrompt(textContent: string, searchParams: any): string {
    return `
You are an expert at extracting structured information from French medical website content.

TASK: Extract doctor information from the following text content from a French medical website search results page.

SEARCH CONTEXT:
- Specialty: ${searchParams.specialty}
- Location: ${searchParams.location}

INSTRUCTIONS:
1. Analyze the text content and identify sections that describe individual doctors/medical professionals
2. For each doctor found, extract:
   - Name (including title like Dr./Docteur if present)
   - Medical specialty
   - Address/location
   - Availability information if mentioned
3. Ignore navigation elements, filters, advertisements, and other non-doctor content
4. Return ONLY a valid JSON array of doctor objects
5. If no doctors are found, return an empty array []

EXPECTED OUTPUT FORMAT:
[
  {
    "name": "Dr. [First Name] [Last Name]",
    "specialty": "[Medical Specialty]",
    "address": "[Address or Location]",
    "availability": ["[Availability info]"],
    "next_availability": "[Next available slot or null]"
  }
]

TEXT CONTENT TO ANALYZE:
${textContent.substring(0, 8000)}

Return only the JSON array, no other text or explanation.
`;
  }

  private async callAIModel(prompt: string): Promise<string> {
    // Здесь должен быть вызов к реальной AI модели
    // Например, OpenAI GPT API, Claude API, или локальная модель
    
    // Для демонстрации используем fetch к OpenAI API
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log('⚠️ No OpenAI API key found, using fallback analysis');
      return this.fallbackAIAnalysis(prompt);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at extracting structured medical information from French websites. Always return valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data: any = await response.json();
      return data.choices?.[0]?.message?.content || '[]';

    } catch (error) {
      console.error('OpenAI API call failed:', error);
      return this.fallbackAIAnalysis(prompt);
    }
  }

  private fallbackAIAnalysis(prompt: string): string {
    // Fallback анализ если AI API недоступен
    console.log('🔄 Using fallback AI analysis...');
    
    // Извлекаем текст из промпта
    const textMatch = prompt.match(/TEXT CONTENT TO ANALYZE:\s*([\s\S]*)/);
    if (!textMatch) return '[]';
    
    const text = textMatch[1];
    
    // Простой анализ для поиска врачей
    const doctors: any[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 20);
    
    for (let i = 0; i < lines.length && doctors.length < 5; i++) {
      const line = lines[i].trim();
      
      // Ищем строки, которые могут содержать информацию о врачах
      if (this.looksLikeDoctorInfo(line)) {
        const doctor = this.extractDoctorFromLine(line);
        if (doctor) {
          doctors.push({
            id: `fallback_${i}`,
            ...doctor
          });
        }
      }
    }
    
    return JSON.stringify(doctors);
  }

  private looksLikeDoctorInfo(line: string): boolean {
    const doctorIndicators = [
      /dr\.?\s+[a-z]/i,
      /docteur\s+[a-z]/i,
      /[A-Z][a-z]+\s+[A-Z][a-z]+.*(?:cardiologue|dentiste|médecin|gynécologue)/i,
      /rendez-vous.*[A-Z][a-z]+\s+[A-Z][a-z]+/i
    ];
    
    return doctorIndicators.some(pattern => pattern.test(line)) && 
           line.length > 30 && 
           line.length < 300;
  }

  private extractDoctorFromLine(line: string): any | null {
    // Простое извлечение информации из строки
    const nameMatch = line.match(/(?:Dr\.?\s+|Docteur\s+)?([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    if (!nameMatch) return null;
    
    const name = nameMatch[1];
    const fullName = nameMatch[0].includes('Dr') ? nameMatch[0] : `Dr. ${name}`;
    
    // Ищем специальность
    let specialty = 'Médecin';
    const specialtyMatch = line.match(/(cardiologue|dentiste|médecin|gynécologue|dermatologue|ophtalmologue|pédiatre)/i);
    if (specialtyMatch) {
      specialty = specialtyMatch[1].charAt(0).toUpperCase() + specialtyMatch[1].slice(1).toLowerCase();
    }
    
    // Ищем адрес
    let address = 'Paris';
    const addressMatch = line.match(/(\d+[^,]*(?:rue|avenue|boulevard)[^,]*)/i);
    if (addressMatch) {
      address = addressMatch[1];
    }
    
    return {
      name: fullName,
      specialty,
      address,
      availability: [],
      next_availability: null
    };
  }

  private parseAIResponse(aiResponse: string): any[] {
    try {
      // Очищаем ответ от возможного мусора
      const cleanResponse = aiResponse.trim();
      
      // Ищем JSON массив в ответе
      const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.log('⚠️ No JSON array found in AI response');
        return [];
      }
      
      const jsonString = jsonMatch[0];
      const doctors = JSON.parse(jsonString);
      
      // Валидируем результат
      if (!Array.isArray(doctors)) {
        console.log('⚠️ AI response is not an array');
        return [];
      }
      
      // Фильтруем и валидируем каждого врача
      const validDoctors = doctors.filter(doctor => 
        doctor && 
        typeof doctor === 'object' && 
        doctor.name && 
        typeof doctor.name === 'string' &&
        doctor.name.length > 3
      );
      
      console.log(`✅ AI parsed ${validDoctors.length} valid doctors from response`);
      return validDoctors;
      
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.log('Raw AI response:', aiResponse.substring(0, 500));
      return [];
    }
  }

  private extractTextFromHTML(html: string): string {
    // Удаляем HTML теги и извлекаем текст
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
