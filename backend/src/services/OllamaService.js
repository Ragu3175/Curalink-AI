const { Ollama } = require('ollama');
const dotenv = require('dotenv');

dotenv.config();

class OllamaService {
    constructor() {
        this.ollama = new Ollama();
        this.model = process.env.OLLAMA_MODEL || 'llama3.2';
    }

    async detectDisease(userQuery, defaultDisease = 'General Research') {
        const systemPrompt = `Identify the single primary clinical disease, condition, or medical topic mentioned in this query. 
If it's a specific disease (e.g., "Duchenne Muscular Dystrophy"), output the name.
If it's a general health question (e.g., "why people get cold"), output the core topic (e.g., "Thermoregulation").
If it's completely generic, output "General Research".
Query: "${userQuery}"
Output ONLY the detected entity name. No conversation.`;

        try {
            const response = await this.ollama.chat({
                model: this.model,
                messages: [{ role: 'user', content: systemPrompt }],
            });
            const detected = response.message.content.trim().replace(/[".]/g, '');
            // Sanitize: remove any "I identified..." conversational fluff
            const sanitized = detected.split('\n')[0].replace(/.*identif.*:\s*/i, '').trim();
            return (sanitized.length > 2 && sanitized.length < 50) ? sanitized : defaultDisease;
        } catch (error) {
            return defaultDisease;
        }
    }

    async expandQuery(userQuery, context = {}) {
        const { disease } = context;
        const systemPrompt = `You are a technical search engine optimizer. Transform the medical query into HIGH-PRECISION SEARCH KEYWORDS.
Current Context: ${disease || 'General Medical'}
User Request: "${userQuery}"

STRICT PROTOCOL:
1. Output ONLY 5-8 technical terms separated by commas.
2. NO DISCLAIMERS. NO CONVERSATION.
3. MEDICAL DISAMBIGUATION: If the query mentions "sugar", "insulin", or "glucose", prioritize "Diabetes Mellitus" and EXCLUDE "Diabetes Insipidus".
4. If the query is medical/health-related, EXCLUDE industrial terms using NOT (e.g., "sugarcane juice, microbiome, NOT milling, NOT ethanol").
5. Preserve drug names like "Elevidys" or "CAP-1002" exactly.
6. NO markdown, NO formatting.`;

        try {
            const response = await this.ollama.chat({
                model: this.model,
                messages: [{ role: 'user', content: systemPrompt }],
            });
            let content = response.message.content.trim().replace(/"/g, '');
            
            // EMERGENCY DEFENSE: If AI starts being chatty or apologetic, discard and use user query
            const noisePatterns = [/i can't/i, /i'm sorry/i, /disclaimers/i, /medical advice/i, /limitations/i];
            if (noisePatterns.some(pattern => pattern.test(content)) || content.split(' ').length > 20) {
                console.log('[DEFENSE] AI expansion failed/hallucinated. Falling back to original query.');
                return userQuery;
            }
            
            return content;
        } catch (error) {
            return userQuery;
        }
    }

    async synthesizeReport(userQuery, publications, clinicalTrials, context = {}) {
        const { disease, history = [] } = context;
        const formattedHistory = history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n');

        const systemPrompt = `You are "Curalink", a High-Precision Medical Research Intelligence. 
Analyze these specific records for: "${userQuery}"

CONVERSATION HISTORY:
${formattedHistory || 'No previous context.'}

CURRENT RESEARCH DATA:
Publications:
${publications.length > 0 ? publications.map((p, i) => `${i+1}. TITLE: ${p.title} (${p.year}) | SNIPPET: ${p.authors} - ${p.source}`).join('\n') : "No relevant publications found."}

Clinical Trials:
${clinicalTrials.length > 0 ? clinicalTrials.map((t, i) => `${i+1}. TITLE: ${t.title} | STATUS: ${t.status} | LOCATION: ${t.location}`).join('\n') : "No relevant clinical trials found."}

Task: Provide a technical, source-backed report.
STRICT RULES:
1. QUICK SUMMARY: Start the report with a 1-sentence "QUICK SUMMARY" in bold at the very top.
2. RELEVANCE FILTER: Before writing, verify if the provided data actually addresses "${userQuery}".
3. NO HALLUCINATIONS: If the data points are unrelated to the specific question (e.g. general research papers for a specific symptom), you MUST state: "The current research database (PubMed/ClinicalTrials) does not contain direct studies for this query."
4. ANALYZE AND CONNECT: Only connect dots that are scientifically plausible. Do NOT invent findings.
5. HONESTY: If you are making a general inference, clearly label it as such.
6. Professional tone, use [1], [2] citations.`;

        try {
            const response = await this.ollama.chat({
                model: this.model,
                messages: [{ role: 'user', content: systemPrompt }],
            });
            return response.message.content;
        } catch (error) {
            return "Critical Analysis Delay: Unable to synthesize report from provided data.";
        }
    }
}

module.exports = new OllamaService();
