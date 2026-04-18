const mongoose = require('mongoose');
const PubMedService = require('../services/PubMedService');
const OpenAlexService = require('../services/OpenAlexService');
const ClinicalTrialsService = require('../services/ClinicalTrialsService');
const OllamaService = require('../services/OllamaService');
const Conversation = require('../models/Conversation');

class SearchController {
    /**
     * Sanitizes complex queries to prevent API errors (The Resilience Shield)
     */
    cleanSearchQuery(query) {
        if (!query) return "";
        // If the query is a long sentence, it's likely conversational noise or a failed expansion
        if (query.split(' ').length > 12) {
            const fillerWords = new Set(['based', 'on', 'the', 'shown', 'in', 'sidebar', 'session', 'which', 'one', 'discusses', 'specifically', 'what', 'was', 'main', 'takeaway', 'please', 'provide', 'information', 'about']);
            return query
                .toLowerCase()
                .replace(/[^\w\s-]/g, ' ') // Remove non-alphanumeric except hyphens
                .split(/\s+/)
                .filter(word => !fillerWords.has(word) && word.length > 2)
                .slice(0, 10) // Keep it focused
                .join(' ');
        }
        return query;
    }

    async handleChat(req, res) {
        const { message, conversationId, context } = req.body;
        const isConnected = mongoose.connection.readyState === 1;
        
        console.log('--- [START] handleChat ---');

        try {
            let conversation;
            if (isConnected && conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
                try {
                    conversation = await Conversation.findById(conversationId);
                } catch (err) {}
            }
            
            if (!conversation) {
                conversation = new Conversation({
                    patientContext: context || {},
                    history: [],
                    publications: [],
                    clinicalTrials: []
                });
            }

            const entityRegex = /\b([A-Z]+-[0-9]+|[A-Z][0-9]+|Vertex|Biogen|Moderna|Pfizer|BioNTech|Novo|Lilly|Amgen|Mirati|G[0-9]+[A-Z]|KRAS|TDP-[0-9]+|Qalsody|Tofersen|TN-[0-9]+|CAP-[0-9]+|Elevidys|Camzyos)\b/gi;
            const requestedEntities = Array.from(new Set((message.match(entityRegex) || []).map(e => e.toLowerCase())));
            
            const targetDisease = await OllamaService.detectDisease(message, conversation.patientContext.disease || 'General');
            let expandedQuery = await OllamaService.expandQuery(message, { disease: targetDisease });

            // [RESILIENCE SHIELD] Clean the query before sending to APIs
            const safeQuery = this.cleanSearchQuery(expandedQuery);
            console.log(`[PIPELINE] Optimized Query: "${safeQuery}"`);

            let [pubmedResults, openAlexResults, clinicalTrials] = await Promise.all([
                PubMedService.searchPublications(safeQuery, targetDisease, 25),
                OpenAlexService.searchPublications(safeQuery, targetDisease),
                ClinicalTrialsService.searchTrials(safeQuery, targetDisease, 15)
            ]);

            // Fallback for entity-specific zero-results
            if (pubmedResults.length === 0 && openAlexResults.length === 0 && requestedEntities.length > 0) {
                const idString = requestedEntities.join(', ');
                const [fallbackPubmed, fallbackOpenAlex] = await Promise.all([
                    PubMedService.searchPublications(idString, null, 15),
                    OpenAlexService.searchPublications(idString, null, 15)
                ]);
                pubmedResults = fallbackPubmed;
                openAlexResults = fallbackOpenAlex;
            }

            const allPublications = [...pubmedResults, ...openAlexResults];
            
            // PRECISION RANKING
            const boostedPublications = allPublications.map(p => {
                let boostScore = 0;
                const title = (p.title || "").toLowerCase();
                const snippet = (p.source || "").toLowerCase(); // Check source/snippet for entity
                
                requestedEntities.forEach(entity => {
                    if (title.includes(entity)) boostScore += 500; // Major boost
                    if (snippet.includes(entity)) boostScore += 250; // Minor boost
                });
                
                const yearInt = parseInt(p.year);
                const yearBoost = (yearInt >= 2024) ? (yearInt - 2020) * 10 : 0;
                return { ...p, boostScore: boostScore + yearBoost };
            });

            const cleanDisease = targetDisease.toLowerCase().replace(/[^\w\s]/g, ' ');
            const diseaseWords = cleanDisease.split(/\s+/).filter(w => w.length > 3 && w !== 'disease');
            
            const finalPublications = boostedPublications.filter(p => {
                const title = (p.title || "").toLowerCase();
                const matchesDisease = diseaseWords.some(dw => title.includes(dw));
                const hasHighBoost = p.boostScore > 50;
                return matchesDisease || hasHighBoost;
            }).sort((a, b) => b.boostScore - a.boostScore).slice(0, 8);
            
            const finalTrials = clinicalTrials.map(t => {
                let boostScore = 0;
                const title = (t.title || "").toLowerCase();
                const location = (t.location || "").toLowerCase();
                
                requestedEntities.forEach(entity => {
                    if (title.includes(entity)) boostScore += 500;
                    if (location.includes(entity)) boostScore += 250;
                });
                return { ...t, boostScore };
            }).sort((a, b) => b.boostScore - a.boostScore).slice(0, 10);

            // AI Synthesis
            const researchInsight = await OllamaService.synthesizeReport(
                message, 
                finalPublications.length > 0 ? finalPublications : conversation.publications, 
                finalTrials,
                { disease: targetDisease, history: conversation.history.slice(-5) }
            );

            // HISTORICAL LOCK
            if (finalPublications.length > 0) {
                conversation.publications = finalPublications;
            }
            if (finalTrials.length > 0) {
                conversation.clinicalTrials = finalTrials;
            }

            conversation.history.push({ role: 'user', content: message });
            conversation.history.push({ role: 'assistant', content: researchInsight });
            conversation.patientContext.disease = targetDisease;
            conversation.lastUpdated = Date.now();
            
            if (isConnected) {
                await conversation.save();
            }

            res.json({
                conversationId: conversation._id,
                report: researchInsight,
                publications: conversation.publications,
                clinicalTrials: conversation.clinicalTrials,
                context: conversation.patientContext
            });

        } catch (error) {
            console.error('[CRITICAL]', error.stack);
            res.status(500).json({ error: 'Research pipeline failure.' });
        }
    }

    async getConversation(req, res) {
        const { id } = req.params;
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: 'Invalid ID' });
            }
            const conversation = await Conversation.findById(id);
            if (!conversation) return res.status(404).json({ error: 'Not found' });
            res.json(conversation);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getHistory(req, res) {
        try {
            const history = await Conversation.find().sort({ lastUpdated: -1 }).limit(10);
            res.json(history);
        } catch (error) {
            res.json([]);
        }
    }
}

module.exports = new SearchController();
