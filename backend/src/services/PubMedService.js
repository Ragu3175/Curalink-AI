const axios = require('axios');

class PubMedService {
    constructor() {
        this.baseSearchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
        this.baseSummaryUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
    }

    async searchPublications(query, disease, pageSize = 25) {
        const keywords = query.split(',').map(s => s.trim()).filter(s => s && s.length > 2);
        const posKeywords = keywords.filter(k => !k.toUpperCase().startsWith('NOT '));
        const negKeywords = keywords.filter(k => k.toUpperCase().startsWith('NOT ')).map(k => k.substring(4).trim());
        
        const dateFilter = '("2022/01/01"[Date - Publication] : "3000"[Date - Publication])';
        const anchor = disease ? `(${disease})` : '';
        const mechanisms = posKeywords.length > 0 ? `(${posKeywords.join(' OR ')})` : '';
        const exclusions = negKeywords.length > 0 ? ` NOT (${negKeywords.join(' OR ')})` : '';
        
        // Simplified Boolean Logic for PubMed
        let strictQuery = '';
        if (anchor && mechanisms) {
            strictQuery = `${anchor} AND ${mechanisms}${exclusions} AND ${dateFilter}`;
        } else {
            strictQuery = `${anchor || mechanisms}${exclusions} AND ${dateFilter}`;
        }

        try {
            console.log(`[PubMed] Query: "${strictQuery}"`);
            let searchUrl = `${this.baseSearchUrl}?db=pubmed&term=${encodeURIComponent(strictQuery)}&retmax=${pageSize}&sort=pub+date&retmode=json`;
            let searchRes = await axios.get(searchUrl);
            let ids = searchRes.data.esearchresult?.idlist;

            if (!ids || ids.length === 0) {
                // FALLBACK: If combined search fails, try keywords alone ONLY if disease was too specific
                // but IF disease is 'General Research', don't just dump all recent papers.
                if (anchor && anchor !== '(General Research)' && anchor !== '(General)') {
                    console.log('[PubMed] 0 results. Trying disease-only fallback...');
                    const broadQuery = `${anchor} AND ${dateFilter}`;
                    searchUrl = `${this.baseSearchUrl}?db=pubmed&term=${encodeURIComponent(broadQuery)}&retmax=${pageSize}&sort=relevance&retmode=json`;
                    searchRes = await axios.get(searchUrl);
                    ids = searchRes.data.esearchresult?.idlist || [];
                } else if (mechanisms) {
                    console.log('[PubMed] 0 results. Trying mechanisms-only fallback...');
                    const keywordOnlyQuery = `${mechanisms}${exclusions} AND ${dateFilter}`;
                    searchUrl = `${this.baseSearchUrl}?db=pubmed&term=${encodeURIComponent(keywordOnlyQuery)}&retmax=${pageSize}&sort=relevance&retmode=json`;
                    searchRes = await axios.get(searchUrl);
                    ids = searchRes.data.esearchresult?.idlist || [];
                }
            }
            
            if (!ids || ids.length === 0) return [];

            const summaryUrl = `${this.baseSummaryUrl}?db=pubmed&id=${ids.join(',')}&retmode=json`;
            const summaryRes = await axios.get(summaryUrl);

            const results = summaryRes.data.result;
            const pubmedResults = ids.map(id => {
                const item = results[id];
                if (!item) return null;
                return {
                    id: id,
                    title: item.title,
                    authors: item.authors?.map(a => a.name).join(', '),
                    year: item.pubdate?.split(' ')[0],
                    url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
                    source: 'PubMed',
                    platform: 'NCBI'
                };
            }).filter(Boolean);

            return pubmedResults;
        } catch (error) {
            console.error('[PubMed] API Error:', error.message);
            return [];
        }
    }
}

module.exports = new PubMedService();
