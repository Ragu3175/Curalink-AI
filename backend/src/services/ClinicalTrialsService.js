const axios = require('axios');

class ClinicalTrialsService {
    constructor() {
        this.baseUrl = 'https://clinicaltrials.gov/api/v2/studies';
    }

    async searchTrials(query, condition, pageSize = 20) {
        const safeCondition = (condition || '').replace(/[\u2018\u2019]/g, "'").replace(/[^\x00-\x7F]/g, "");
        const safeQuery = (query || '').replace(/[\u2018\u2019]/g, "'").replace(/[^\x00-\x7F]/g, "");
        const keywords = safeQuery.split(',').map(s => s.trim()).filter(s => s.length > 2);

        console.log(`[Trials] Tiered Multi-Search for keywords: [${keywords.join(', ')}]`);
        
        try {
            // TIER 1: IDENTIFIER SEARCH
            // We now include any word > 10 chars as a potential technical drug name (e.g. exagamglogene)
            const identifiers = keywords.filter(k => 
                /[A-Z]+\-[0-9]+|[A-Z][0-9]+/.test(k) || 
                k.length > 10 ||
                ['casgevy', 'lyfgenia', 'tofersen', 'qalsody', 'kras', 'amg', 'mrtx'].some(w => k.toLowerCase().includes(w))
            );

            let studies = [];
            
            if (identifiers.length > 0) {
                const idPromises = identifiers.slice(0, 3).map(id => // Cap at 3 identifiers for speed
                    axios.get(`${this.baseUrl}?query.term=${encodeURIComponent(id)}&pageSize=10&format=json`)
                );
                const idResults = await Promise.all(idPromises);
                idResults.forEach(res => {
                    if (res.data?.studies) {
                        studies = [...studies, ...res.data.studies];
                    }
                });
            }

            // TIER 2: COMBINATION SEARCH
            if (studies.length < 5) {
                const searchTerms = keywords.slice(0, 2).join(' ');
                const comboUrl = `${this.baseUrl}?query.cond=${encodeURIComponent(safeCondition)}&query.term=${encodeURIComponent(searchTerms)}&pageSize=${pageSize}&format=json`;
                const comboRes = await axios.get(comboUrl);
                if (comboRes.data?.studies) {
                    studies = [...studies, ...comboRes.data.studies];
                }
            }

            // TIER 3: KEYWORD ONLY SEARCH (if Tier 1 & 2 failed)
            if (studies.length === 0 && keywords.length > 0) {
                console.log('[Trials] Tier 1 & 2 empty. Trying keyword-only search...');
                const searchTerms = keywords.slice(0, 3).join(' ');
                const kwUrl = `${this.baseUrl}?query.term=${encodeURIComponent(searchTerms)}&pageSize=${pageSize}&format=json`;
                const kwRes = await axios.get(kwUrl);
                if (kwRes.data?.studies) {
                    studies = [...kwRes.data.studies];
                }
            }

            // TIER 4: BROAD FALLBACK (ONLY if condition is specific)
            if (studies.length === 0 && safeCondition && !['General', 'General Research', 'World'].includes(safeCondition)) {
                console.log(`[Trials] Broad fallback for specific condition: ${safeCondition}`);
                const fallbackUrl = `${this.baseUrl}?query.cond=${encodeURIComponent(safeCondition)}&pageSize=${pageSize}&format=json`;
                const fallbackRes = await axios.get(fallbackUrl);
                studies = fallbackRes.data?.studies || [];
            }

            const uniqueStudiesMap = new Map();
            studies.forEach(s => {
                const id = s.protocolSection?.identificationModule?.nctId;
                if (id && !uniqueStudiesMap.has(id)) {
                    uniqueStudiesMap.set(id, s);
                }
            });

            const uniqueStudies = Array.from(uniqueStudiesMap.values());

            const mapped = uniqueStudies.map(study => {
                const info = study.protocolSection;
                const locations = info.contactsLocationsModule?.locations?.map(l => l.facility) || [];
                const truncatedLocations = locations.length > 3 
                    ? locations.slice(0, 3).join(', ') + ` and ${locations.length - 3} more...` 
                    : locations.join(', ') || 'Global';

                return {
                    id: info.identificationModule?.nctId,
                    title: info.identificationModule?.officialTitle || info.identificationModule?.briefTitle,
                    status: info.statusModule?.overallStatus,
                    eligibility: info.eligibilityModule?.eligibilityCriteria?.slice(0, 250) + '...',
                    conditions: info.conditionsModule?.conditions,
                    location: truncatedLocations,
                    url: `https://clinicaltrials.gov/study/${info.identificationModule?.nctId}`,
                    source: 'ClinicalTrials.gov'
                };
            });

            console.log(`[Trials] Success: Found ${mapped.length} records.`);
            return mapped;
        } catch (error) {
            console.error('[Trials] API Error:', error.message);
            return [];
        }
    }
}

module.exports = new ClinicalTrialsService();
