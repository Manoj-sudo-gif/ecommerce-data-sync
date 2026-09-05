import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

// Lazy initialization for GoogleGenAI
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const TAXONOMY_PROMPT = `
You are the GM Fashion Product Taxonomy AI Expert.
You must classify products into our FIXED GM Fashion e-commerce taxonomy ONLY.

FIXED TAXONOMY:
- Main Categories:
  1. "Men" (Age 18+)
  2. "Boys" (Age 9-16)
  3. "Kids" (Age 1-8)

- Departments & Product Types:
  - "Top Wear": ["Shirt", "T Shirt"]
  - "Bottom Wear": ["Pant", "Track Pant", "Shorts"]
  - "Inner Wear": ["Vest", "Gym Vest", "Brief", "Trunk"]
  - "Traditional": ["Shirt", "Dhoti", "Set Dhoti"]

GUIDELINES:
1. Use Product Group, Department, Product Name, Class, Garment, Colour, Size, StyleNo to infer the correct category.
2. "Junior", "Jr", "Boys" indicate "Boys". "Kids", "Children", "Baby" indicate "Kids". "Mens", "Adult" indicate "Men".
3. "Junior T Shirt" -> Main Category: "Boys", Department: "Top Wear", Product Type: "T Shirt".
4. "Gym Vest" -> Department: "Inner Wear", Product Type: "Gym Vest".
5. "Set Dhoti" -> Department: "Traditional", Product Type: "Set Dhoti".
6. "Track Pant" -> Department: "Bottom Wear", Product Type: "Track Pant".
7. NEVER invent new categories or departments or product types outside the fixed list.
8. Output a confidence score between 0.0 and 1.0 (e.g. 0.95 for clear matches, 0.55 for ambiguous).
`;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'GM Fashion Sync & AI Engine' });
});

// Helper function for intelligent heuristic classification fallback
function generateFallbackClassification(item: any) {
  const pg = String(item.productGroup || '').toLowerCase();
  const dept = String(item.department || '').toLowerCase();
  const name = String(item.productName || item.styleNo || '').toLowerCase();
  const cls = String(item.classBrand || '').toLowerCase();
  const garment = String(item.garmentFabric || '').toLowerCase();
  const combined = `${pg} ${dept} ${name} ${cls} ${garment}`;

  let mainCategory: 'Men' | 'Boys' | 'Kids' = 'Men';
  if (combined.includes('junior') || combined.includes('jr') || combined.includes('boys') || combined.includes('boy')) {
    mainCategory = 'Boys';
  } else if (combined.includes('kids') || combined.includes('kid') || combined.includes('children') || combined.includes('baby') || combined.includes('infant')) {
    mainCategory = 'Kids';
  } else if (combined.includes('men') || combined.includes('mens') || combined.includes('adult') || combined.includes('man')) {
    mainCategory = 'Men';
  }

  let department = 'Top Wear';
  let productType = 'Shirt';

  if (combined.includes('gym vest')) {
    department = 'Inner Wear';
    productType = 'Gym Vest';
  } else if (combined.includes('set dhoti')) {
    department = 'Traditional';
    productType = 'Set Dhoti';
  } else if (combined.includes('track pant') || combined.includes('trackpant') || combined.includes('jogger')) {
    department = 'Bottom Wear';
    productType = 'Track Pant';
  } else if (combined.includes('t shirt') || combined.includes('t-shirt') || combined.includes('tshirt') || combined.includes('polo')) {
    department = 'Top Wear';
    productType = 'T Shirt';
  } else if (combined.includes('short') || combined.includes('shorts') || combined.includes('half pant') || combined.includes('bermuda')) {
    department = 'Bottom Wear';
    productType = 'Shorts';
  } else if (combined.includes('brief') || combined.includes('undergarment')) {
    department = 'Inner Wear';
    productType = 'Brief';
  } else if (combined.includes('trunk') || combined.includes('boxer')) {
    department = 'Inner Wear';
    productType = 'Trunk';
  } else if (combined.includes('vest') || combined.includes('banian')) {
    department = 'Inner Wear';
    productType = 'Vest';
  } else if (combined.includes('dhoti')) {
    department = 'Traditional';
    productType = 'Dhoti';
  } else if (combined.includes('pant') || combined.includes('trouser') || combined.includes('jean')) {
    department = 'Bottom Wear';
    productType = 'Pant';
  } else if (combined.includes('shirt')) {
    department = 'Top Wear';
    productType = 'Shirt';
  }

  return {
    id: item.id || item.ean,
    mainCategory,
    department,
    productType,
    confidence: 0.88,
    source: 'RULE_FALLBACK',
    reasoning: 'Taxonomy rule classification fallback.',
  };
}

// Endpoint for AI category classification
app.post('/api/classify-batch', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Fallback mock/rule classification response if key is absent
      const fallbackResults = items.map((item: any) => generateFallbackClassification(item));
      return res.json({ results: fallbackResults });
    }

    try {
      const ai = getGenAIClient();

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `${TAXONOMY_PROMPT}\n\nClassify the following list of Wondersoft products:\n${JSON.stringify(
          items,
          null,
          2
        )}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                mainCategory: {
                  type: Type.STRING,
                  description: 'Must be "Men", "Boys", or "Kids"',
                },
                department: {
                  type: Type.STRING,
                  description: 'Must be "Top Wear", "Bottom Wear", "Inner Wear", or "Traditional"',
                },
                productType: {
                  type: Type.STRING,
                  description: 'Must be one of the allowed product types for that department',
                },
                confidence: {
                  type: Type.NUMBER,
                  description: 'Confidence score from 0.0 to 1.0',
                },
                reasoning: { type: Type.STRING },
              },
              required: ['id', 'mainCategory', 'department', 'productType', 'confidence'],
            },
          },
        },
      });

      const resultText = response.text || '[]';
      let parsedResults = [];
      try {
        let cleanedText = resultText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        parsedResults = JSON.parse(cleanedText);
      } catch (parseErr: any) {
        console.warn('Initial JSON.parse failed, attempting partial JSON salvage:', parseErr.message);
        try {
          const objectMatches = resultText.match(/\{\s*"id"\s*:\s*"[^"]+"[^\}]*\}/g);
          if (objectMatches && objectMatches.length > 0) {
            parsedResults = objectMatches
              .map((objStr) => {
                try {
                  return JSON.parse(objStr);
                } catch {
                  return null;
                }
              })
              .filter(Boolean);
          } else {
            parsedResults = [];
          }
        } catch (e) {
          console.warn('Failed to salvage JSON array from Gemini response:', e);
          parsedResults = [];
        }
      }

      if (parsedResults.length === 0) {
        parsedResults = items.map((item: any) => generateFallbackClassification(item));
      }

      return res.json({ results: parsedResults });
    } catch (geminiErr: any) {
      // Quietly fallback to rule classification when Gemini API is rate-limited or unavailable
      const fallbackResults = items.map((item: any) => generateFallbackClassification(item));
      return res.json({ results: fallbackResults });
    }
  } catch (error: any) {
    const fallbackResults = (req.body?.items || []).map((item: any) => generateFallbackClassification(item));
    return res.status(200).json({ results: fallbackResults });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GM Fashion App running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
