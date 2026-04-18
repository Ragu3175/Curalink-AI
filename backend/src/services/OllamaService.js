const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

class OllamaService {
    constructor() {
        this.apiKey = process.env.GROQ_API_KEY;
        this.baseURL = 'https://api.groq.com/openai/v1/chat/completions';
        this.model = 'llama-3.3-70b-versatile'; // High-precision open-source model
    }

    async chat(messages) {
        if (!this.apiKey) {
            console.error('[CRITICAL] Groq API Key is missing. Please add GROQ_API_KEY to your .env file.');
            throw new Error('AI Service Configuration Error');
        }

        try {
            const response = await axios.post(
                this.baseURL,
                {
                    model: this.model,
                    messages: messages,
                    temperature: 0.1, // Low temperature for high precision medical data
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return {
                message: {
                    content: response.data.choices[0].message.content
                }
            };
        } catch (error) {
            console.error('[GROQ API ERROR]', error.response?.data || error.message);
            throw error;
        }
    }

    async detectDisease(userQuery, defaultDisease = 'General Research') {
        const systemPrompt = `You are a medical intelligence gatekeeper.
Task: Identify the primary disease, condition, or medical symptom. 

Query: "${userQuery}"

STRICT PROTOCOL:
1. If the query is just a greeting (hello, hi), small talk, or non-medical, output "CONVERSATIONAL".
2. If it's a symptom (tired, cold, pain), output "[Symptom] Etiology".
3. If it's a specific disease, output its formal name.
4. Output ONLY the detected entity. No talk.`;

        try {
            const response = await this.chat([{ role: 'user', content: systemPrompt }]);
            const detected = response.message.content.trim().replace(/[".]/g, '');
            const sanitized = detected.split('\n')[0].replace(/.*identif.*:\s*/i, '').trim();
            
            if (sanitized.toUpperCase().includes('CONVERSATIONAL')) return 'CONVERSATIONAL';
            return (sanitized.length > 2 && sanitized.length < 50) ? sanitized : defaultDisease;
        } catch (error) {
            return defaultDisease;
        }
    }

    async expandQuery(userQuery, context = {}) {
        const { disease } = context;
        if (disease === 'CONVERSATIONAL') return '';

        const systemPrompt = `You are a technical search engine optimizer. Transform the medical query into HIGH-PRECISION SEARCH KEYWORDS.
Current Context: ${disease || 'General Medical'}
User Request: "${userQuery}"

STRICT PROTOCOL:
1. Output ONLY 3-5 technical keywords separated by commas.
2. If the user mentions a symptom (e.g., "cold"), expand it to potential medical causes (e.g., "Thermoregulation, Cold Sensitivity, Etiology, Pathophysiology").
3. NO FILLER. NO QUESTIONS.
4. Example: "why am I cold in summer" -> "Cold Intolerance, Thermoregulation, Hypothyroidism, Anemia, Etiology"`;

        try {
            const response = await this.chat([{ role: 'user', content: systemPrompt }]);
            let content = response.message.content.trim().replace(/"/g, '');
            
            const noisePatterns = [/i can't/i, /i'm sorry/i, /disclaimers/i];
            if (noisePatterns.some(pattern => pattern.test(content)) || content.split(' ').length > 20) {
                return userQuery;
            }
            return content;
        } catch (error) {
            return userQuery;
        }
    }

    async synthesizeReport(userQuery, publications, clinicalTrials, context = {}) {
        const { disease, history = [], username = 'Researcher' } = context;
        const formattedHistory = history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n');

        const systemPrompt = `You are "Curalink", a High-Precision Medical Research Intelligence. 
You are an expert medical assistant talking to a scientist or doctor. 

USER PROFILE: ${username}
CURRENT TOPIC: ${disease}

CONVERSATION HISTORY:
${formattedHistory || 'No previous context.'}

CURRENT RESEARCH DATA:
Publications:
${publications.length > 0 ? publications.map((p, i) => `${i+1}. TITLE: ${p.title} (${p.year}) | SNIPPET: ${p.authors} - ${p.source}`).join('\n') : "No relevant publications found."}

Clinical Trials:
${clinicalTrials.length > 0 ? clinicalTrials.map((t, i) => `${i+1}. TITLE: ${t.title} | STATUS: ${t.status} | LOCATION: ${t.location}`).join('\n') : "No relevant clinical trials found."}

STRICT ANALYTICAL RULES:
1. GREETING: Start with a friendly, professional greeting like "Hey ${username}, good to see you," or "Welcome back to the lab, ${username}."
2. QUICK SUMMARY: Provide a 1-sentence Bold "QUICK SUMMARY".
3. NO HALLUCINATIONS: If current data is unrelated to the query, state "I've checked our active records, but I don't see direct overlap for this specific question yet."
4. CITATIONS: Use [1], [2] formatting.
5. TONE: Collaborative, technical but friendly. Like a high-level research peer.`;

        try {
            const response = await this.chat([{ role: 'user', content: systemPrompt }]);
            return response.message.content;
        } catch (error) {
            return "Critical Analysis Delay: Unable to synthesize report via cloud LLM.";
        }
    }
}

module.exports = new OllamaService();
