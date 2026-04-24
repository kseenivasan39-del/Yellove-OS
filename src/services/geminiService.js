import { GoogleGenerativeAI } from "@google/generative-ai";
import DOMPurify from 'dompurify';

/**
 * Gemini Service - Intelligent Orchestration Layer for SmartStadium.
 * Dual-Mode: Authentic API Integration with Tactical Simulation Fallback.
 */

const getAPIKey = () => {
    // Robust access for both Vite and Vitest environments
    const key = import.meta.env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.VITE_GEMINI_API_KEY : "");
    return (String(key || '')).trim();
};
const isKeyValid = (key) => key && key !== 'undefined' && key !== '' && key !== 'ADD_YOUR_GEMINI_KEY_HERE';

/**
 * // Integrated Gemini Intelligence (Real + Simulated Fallback)
 * Handles tactical reasoning for stadium interventions.
 */

export const geminiService = {
    /**
     * Specialized reasoning engine for fan queries
     * @param {string} query User input
     * @param {Object} context { crowds, queues, transport, matchStatus }
     * @returns {Promise<string>} AI response
     */
    processQuery: async (query, context) => {
        // Security Check: Input Validation & Sanitization
        const cleanQuery = DOMPurify.sanitize(String(query || '').substring(0, 500));
        if (!cleanQuery || cleanQuery.trim().length === 0) {
            return "I'm ready to help, but I need a clear question. Whistle Podu! 💛";
        }

        const q = cleanQuery.toLowerCase();
        const { crowds, queues, transport } = context;
        const apiKey = getAPIKey();

        // MODE 1: Authentic Gemini API Integration
        if (isKeyValid(apiKey)) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

                const systemPrompt = `You are "Captain Yellove", a strategic AI assistant for the Chennai Super Kings at Chepauk Stadium. You are also an expert in cricket, tactical analytics, and IPL rules.
                Current Stadium Context:
                - Crowd Levels: ${JSON.stringify(crowds)}
                - Queue Times: ${JSON.stringify(queues)}
                - Transport Options: ${JSON.stringify(transport)}
                
                STRICT RULES:
                1. Answer in LESS THAN 30 WORDS. Be extremely concise.
                2. DO NOT use any Markdown formatting. NO asterisks (**), NO bold, NO bullet points. Plain text only.
                3. ONLY answer the specific question asked. Do not dump the stadium context or queue times if not explicitly asked.
                4. Maintain "Yellow" and tactical CSK theme.`;

                const result = await model.generateContent([systemPrompt, cleanQuery]);
                return DOMPurify.sanitize(result.response.text());
            } catch (_error) {
                console.warn("Intelligence fallback engaged.");
            }
        }

        // MODE 2: Tactical Simulation Fallback (Ensures 100% availability without API Key)
        await new Promise(r => setTimeout(r, 800));

        // TACTICAL INTELLIGENCE: Weighing Speed vs Cost vs Availability
        const getBestTransitMode = () => {
            const modes = [
                { type: 'Metro', speed: 8, cost: 5, availability: 9, emoji: '🚇' },
                { type: 'Cab', speed: 9, cost: 9, availability: 4, emoji: '🚖' },
                { type: 'Bus', speed: 4, cost: 2, availability: 8, emoji: '🚌' },
                { type: 'Train', speed: 7, cost: 1, availability: 8, emoji: '🚆' }
            ];

            if (q.includes("cheap") || q.includes("less cost") || q.includes("money")) {
                return modes.reduce((a, b) => a.cost < b.cost ? a : b);
            }
            if (q.includes("fast") || q.includes("quick") || q.includes("soon")) {
                return modes.reduce((a, b) => a.speed > b.speed ? a : b);
            }
            if (q.includes("convenient") || q.includes("easy") || q.includes("available")) {
                return modes.reduce((a, b) => (a.availability + a.speed) > (b.availability + b.speed) ? a : b);
            }
            // Default to Metro as the most balanced SmartStadium choice
            return modes[0];
        };

        const recommended = getBestTransitMode();

        if (q.includes("route") || q.includes("to") || q.includes("reach") || q.includes("way")) {
            const loc = cleanQuery.replace(/reach/i, '').replace(/to/i, '').trim() || "your destination";
            
            let reasoning = "";
            if (recommended.type === 'Metro') reasoning = "It's the most convenient balance of speed and availability right now.";
            if (recommended.type === 'Cab') reasoning = "It's the fastest way out, though costs are currently peaking.";
            if (recommended.type === 'Train') reasoning = "It's the most cost-effective solution for long-distance extraction.";
            if (recommended.type === 'Bus') reasoning = "It's a high-availability option if you prefer to avoid the station crowds.";

            return `[SIMULATED] Strategic analysis for ${loc} complete. I recommend ${recommended.emoji} ${recommended.type}. ${reasoning} Proceed to the designated hub for extraction. 💛`;
        }

        if (q.includes("crowd") || q.includes("busy") || q.includes("gate")) {
            const gate3 = crowds?.find(s => s.id === 'gate-3')?.count || 50;
            const gate5 = crowds?.find(s => s.id === 'gate-5')?.count || 50;
            const betterGate = gate3 < gate5 ? "Gate 3" : "Gate 5";
            return `[SIMULATED] Tactical analysis shows ${betterGate} is currently less congested. Recommended for high-speed extraction. Whistle Podu! 💛`;
        }

        return `[SIMULATED] Chepauk Strategic Assistant online. Most convenient mode right now: ${recommended.type}. How can I guide your Yellove experience? 💛`;
    }
};
