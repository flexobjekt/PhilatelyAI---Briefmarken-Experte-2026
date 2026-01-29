
import { GoogleGenAI, Type } from "@google/genai";
import { Stamp, PhilatelicNews } from "../types";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Safe initializer that doesn't crash if API key is missing (for demo mode)
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    // Return a dummy object or handle this in the calls.
    // However, the SDK constructor requires a key. 
    // We pass a dummy string if missing to prevent immediate constructor crash,
    // knowing that calls will fail later.
    return new GoogleGenAI({ apiKey: "DEMO_MODE_NO_KEY" });
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Extracts JSON from a string, handling potential Markdown wrapping.
 */
const extractJson = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const cleaned = match[0].replace(/```json/g, '').replace(/```/g, '');
        return JSON.parse(cleaned);
      } catch (innerError) {
        // Simple fallback to regex-based object extraction
        const objMatch = text.match(/\{[\s\S]*\}/);
        if (objMatch) return JSON.parse(objMatch[0]);
        throw new Error("JSON_PARSE_FAILED");
      }
    }
    // Try to find array if not object
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) return JSON.parse(arrayMatch[0]);
    
    throw new Error("JSON_NOT_FOUND");
  }
};

/**
 * Validates the API key.
 */
export const validateApiKey = async (): Promise<boolean> => {
  try {
    if (!process.env.API_KEY) return false;
    
    const ai = getAiClient();
    await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "ping",
      config: {
        maxOutputTokens: 1,
        thinkingConfig: { thinkingBudget: 0 },
        tools: [{ googleSearch: {} }] 
      }
    });
    return true;
  } catch (error: any) {
    console.error("Key Validation Failed:", error);
    return false;
  }
};

/**
 * Fetches current philatelic news using Google Search grounding.
 */
export const fetchPhilatelicNews = async (): Promise<PhilatelicNews[]> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Provide 4 current and significant news headlines or market trends in the world of philately (stamp collecting) for late 2024 or early 2025. Include auction results, rare discoveries, or global market shifts. Format as a JSON array of objects.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              source: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['auction', 'discovery', 'trend'] }
            },
            required: ["title", "summary", "source", "type"]
          }
        }
      }
    });

    if (!response.text) return [];
    const news = extractJson(response.text);
    const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return news.map((item: any, idx: number) => ({
      ...item,
      url: grounding[idx]?.web?.uri || 'https://www.philately.live'
    }));
  } catch (error) {
    console.error("Failed to fetch news (Demo mode or Error):", error);
    return [];
  }
};

/**
 * Creates a chat session for the Philatelic Advisor.
 */
export const createAdvisorChat = (collection: Stamp[]) => {
  const ai = getAiClient();
  const collectionSummary = collection.map(s => `${s.name} (${s.origin}, ${s.year}) - Wert: ${s.estimatedValue}`).join('\n');
  
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are the Philatelic Advisor for 'PhilatelyAI Pro Suite 2026'. 
      Your tone is professional, sophisticated, and expert.
      
      The user currently has the following stamps in their archive:
      ${collectionSummary || 'No stamps in archive yet.'}
      
      Your goal is to help users identify stamps, understand historical context, provide tips on preservation, and discuss market trends.
      Be concise but high-value. If asked about a specific stamp in their collection, refer to the provided data.
      Use professional terminology (e.g., serration, watermark, intaglio, fiscal stamps, etc.).`,
      tools: [{ googleSearch: {} }]
    }
  });
};

/**
 * Analyzes a stamp image using Gemini 3 Pro with Google Search for worldwide database matching.
 */
export const analyzeStamp = async (
  base64Image: string, 
  existingData?: Partial<Stamp>, 
  options?: { keywords?: string; qualityHint?: string; deepAnalysis?: boolean }
): Promise<Partial<Stamp>> => {
  let retries = 0;
  const maxRetries = 1;
  
  while (retries <= maxRetries) {
    try {
      const ai = getAiClient();
      const modelName = 'gemini-3-pro-image-preview';
      
      const prompt = `GLOBAL PHILATELY DATABASE MATCH & VALUATION (PRO v2026)
      
      TASK:
      1. PRECISE IDENTIFICATION: Identify the stamp using image recognition.
      2. GLOBAL DATABASE MATCH: Cross-reference against major catalogs (Michel, Scott, Yvert, Stanley Gibbons).
      3. MARKET VALUATION: Determine the current market value based on recent auction results (2023-2025) and dealer price lists.
      
      CONTEXT: ${options?.keywords || 'None'}.

      RETURN ONLY JSON SCHEMA:
      {
        "name": "Full precise catalog name (e.g. 'One Penny Black Plate 11')",
        "origin": "Country/Entity",
        "year": "Year",
        "catalogId": "Primary Catalog Number (e.g. 'Michel Nr. 5' or 'Scott #3')",
        "estimatedValue": "Estimated value in € (e.g. '150.00 €')",
        "priceSource": "Source of price (e.g. 'Sotheby\'s 2024' or 'Michel Katalog 2024')",
        "rarity": "Rarity (Common, Scarce, Rare, Unique)",
        "condition": "Condition grade (e.g. 'Used, Light Cancellation')",
        "description": "Short visual and technical description",
        "historicalContext": "Why this stamp was issued and its significance",
        "printingMethod": "e.g. Intaglio, Typography",
        "paperType": "e.g. Wove paper, Watermark Crown"
      }`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image.split(',')[1] || base64Image,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              origin: { type: Type.STRING },
              year: { type: Type.STRING },
              catalogId: { type: Type.STRING },
              estimatedValue: { type: Type.STRING },
              priceSource: { type: Type.STRING },
              rarity: { type: Type.STRING },
              condition: { type: Type.STRING },
              description: { type: Type.STRING },
              historicalContext: { type: Type.STRING },
              printingMethod: { type: Type.STRING },
              paperType: { type: Type.STRING },
            },
            required: ["name", "origin", "year", "estimatedValue", "rarity", "condition", "description"],
          },
        },
      });

      if (!response.text) throw new Error("EMPTY_RESPONSE");
      
      const parsedData = extractJson(response.text);

      const webRefs: { title: string; uri: string }[] = [];
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        groundingMetadata.groundingChunks.forEach(chunk => {
          if (chunk.web?.uri && chunk.web?.title) {
            webRefs.push({ title: chunk.web.title, uri: chunk.web.uri });
          }
        });
      }

      return {
        ...parsedData,
        webRefs: webRefs.slice(0, 5)
      };
    } catch (error: any) {
      const errorStr = JSON.stringify(error).toLowerCase();
      const message = error?.message?.toLowerCase() || "";
      
      if (
        errorStr.includes("403") || 
        errorStr.includes("permission_denied") || 
        message.includes("permission") ||
        message.includes("403") ||
        errorStr.includes("401") ||
        message.includes("401") ||
        errorStr.includes("requested entity was not found")
      ) {
        throw new Error("KEY_INVALID");
      }

      if (errorStr.includes("429") || errorStr.includes("quota")) {
        if (retries < maxRetries) {
          retries++;
          await sleep(2000 * retries);
          continue;
        }
        throw new Error("QUOTA_EXHAUSTED");
      }

      throw new Error("ANALYSE_FEHLGESCHLAGEN");
    }
  }
  throw new Error("MAX_RETRIES");
};
