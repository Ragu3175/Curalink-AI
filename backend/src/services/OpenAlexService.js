const axios = require('axios');

class OpenAlexService {
    constructor() {
        this.baseUrl = 'https://api.openalex.org/works';
    }

    async searchPublications(query, disease, pageSize = 25) {
        // CLEANUP: OpenAlex doesn't like boolean logic in 'search' param. 
        // We convert comma-separated keywords to space-separated for broad fuzzy retrieval.
        const keywords = query.split(',').map(s => s.trim()).filter(s => s && s.length > 2);
        const dateFilter = 'from_publication_date:2022-01-01'; // Expanded to 2022 for better coverage
        
        const fuzzyString = `${disease || ''} ${keywords.join(' ')}`.trim();
        const url = `${this.baseUrl}?search=${encodeURIComponent(fuzzyString)}&filter=${dateFilter}&per-page=${pageSize}&sort=relevance_score:desc`;
        
        console.log(`[OpenAlex] Fuzzy Search initiated for: "${fuzzyString}"`);
        try {
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'Curalink/1.0 (mailto:hackathon@humanityfounders.com)' }
            });

            if (!response.data || !response.data.results) {
                return [];
            }

            const mapped = response.data.results.map(work => ({
                id: work.id,
                title: work.title,
                authors: work.authorships?.map(a => a.author.display_name).join(', '),
                year: work.publication_year,
                url: work.doi || work.ids?.mag || work.ids?.pmid || `https://openalex.org/${work.id.split('/').pop()}`,
                abstract: "Summary available in full text",
                source: 'OpenAlex',
                relevance: work.relevance_score
            }));

            console.log(`[OpenAlex] Successfully processed ${mapped.length} records.`);
            return mapped;
        } catch (error) {
            console.error('[OpenAlex] API Error:', error.message);
            return [];
        }
    }
}

module.exports = new OpenAlexService();
