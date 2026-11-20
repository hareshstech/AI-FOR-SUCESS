import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Simple in-memory sliding-window rate limiter per IP for AI generation
const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = 15;
const ipRequests = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipRequests.get(ip) || []).filter((t) => now - t < rateLimitWindowMs);
  if (timestamps.length >= rateLimitMaxRequests) {
    ipRequests.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  ipRequests.set(ip, timestamps);
  return false;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
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

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'nexora-api' });
  });

  app.post('/api/ideas/analyze', async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (isRateLimited(clientIp)) {
      res.status(429).json({
        error: 'Too many idea analysis requests. Please wait a minute and try again.',
      });
      return;
    }

    const rawIdea = typeof req.body?.idea === 'string' ? req.body.idea.trim() : '';
    const rawCategory = typeof req.body?.category === 'string' ? req.body.category.trim() : '';
    const rawTimeframe = typeof req.body?.timeframe === 'string' ? req.body.timeframe.trim() : '';

    if (rawIdea.length < 10) {
      res.status(400).json({
        error: 'Please enter at least 10 characters describing your idea.',
      });
      return;
    }

    if (rawIdea.length > 2000) {
      res.status(400).json({
        error: 'Idea description must be 2,000 characters or fewer.',
      });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured in server secrets. Please configure GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    const allowedCategories = [
      'Software & SaaS',
      'Startup Venture',
      'Creative & Media',
      'Student Research',
      'Hardware & Product',
      'Community & Impact',
    ];
    const categoryContext = rawCategory && allowedCategories.includes(rawCategory)
      ? rawCategory
      : 'Auto-detect the best category from: Software & SaaS, Startup Venture, Creative & Media, Student Research, Hardware & Product, Community & Impact';

    const timeframeContext = rawTimeframe ? `Preferred target timeframe: ${rawTimeframe}.` : 'Estimate a realistic timeframe (e.g., "4 weeks", "8 weeks", "12 weeks").';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: [
          `Analyze this raw idea and transform it into a structured, execution-ready NEXORA project plan.`,
          `Idea: """${rawIdea}"""`,
          `Category preference: ${categoryContext}`,
          timeframeContext,
        ].join('\n\n'),
        config: {
          systemInstruction:
            'You are the NEXORA Principal Product Strategist. Convert raw ideas into concrete, realistic, execution-ready project blueprints with clear objectives, 3-5 sequential milestones, and 6-10 actionable tasks assigned to milestone indices. Keep titles concise, non-generic, and immediately actionable.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Concise, memorable project title (max 80 characters).',
              },
              summary: {
                type: Type.STRING,
                description: 'Two-sentence executive summary describing the problem, solution, and value.',
              },
              category: {
                type: Type.STRING,
                description: 'One of: Software & SaaS, Startup Venture, Creative & Media, Student Research, Hardware & Product, Community & Impact.',
              },
              estimatedTimeline: {
                type: Type.STRING,
                description: 'Realistic total duration such as "6 weeks" or "3 months".',
              },
              objectives: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 to 5 clear, measurable project objectives.',
              },
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    offsetWeeks: { type: Type.INTEGER },
                  },
                  required: ['title', 'description', 'offsetWeeks'],
                },
                description: '3 to 5 chronological milestones.',
              },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    priority: {
                      type: Type.STRING,
                      description: 'Must be one of: low, medium, high, urgent.',
                    },
                    milestoneIndex: {
                      type: Type.INTEGER,
                      description: 'Zero-based index referencing the milestones array.',
                    },
                  },
                  required: ['title', 'description', 'priority', 'milestoneIndex'],
                },
                description: '6 to 10 concrete execution tasks mapped to milestones.',
              },
            },
            required: [
              'title',
              'summary',
              'category',
              'estimatedTimeline',
              'objectives',
              'milestones',
              'tasks',
            ],
          },
        },
      });

      const rawText = (response.text || '').trim();
      if (!rawText) {
        res.status(502).json({
          error: 'The AI model returned an empty response. Please try again.',
        });
        return;
      }

      const parsed = JSON.parse(rawText);
      const validPriorities = new Set(['low', 'medium', 'high', 'urgent']);

      const milestones = Array.isArray(parsed.milestones)
        ? parsed.milestones.slice(0, 6).map((m: Record<string, unknown>, idx: number) => ({
            title: String(m.title || `Milestone ${idx + 1}`).slice(0, 140),
            description: String(m.description || '').slice(0, 500),
            offsetWeeks: Math.max(1, Math.min(52, Number(m.offsetWeeks) || idx + 1)),
          }))
        : [];

      const tasks = Array.isArray(parsed.tasks)
        ? parsed.tasks.slice(0, 15).map((t: Record<string, unknown>, idx: number) => {
            const p = String(t.priority || 'medium').toLowerCase();
            const mIdx = Number(t.milestoneIndex);
            return {
              title: String(t.title || `Task ${idx + 1}`).slice(0, 180),
              description: String(t.description || '').slice(0, 800),
              priority: validPriorities.has(p) ? p : 'medium',
              milestoneIndex:
                Number.isInteger(mIdx) && mIdx >= 0 && mIdx < milestones.length ? mIdx : 0,
            };
          })
        : [];

      res.json({
        title: String(parsed.title || 'Untitled Project').slice(0, 120),
        summary: String(parsed.summary || '').slice(0, 900),
        category: allowedCategories.includes(String(parsed.category))
          ? String(parsed.category)
          : rawCategory || 'Software & SaaS',
        estimatedTimeline: String(parsed.estimatedTimeline || '6 weeks').slice(0, 60),
        objectives: Array.isArray(parsed.objectives)
          ? parsed.objectives.slice(0, 6).map((o: unknown) => String(o).slice(0, 220))
          : [],
        milestones,
        tasks,
      });
    } catch (error) {
      console.error('Gemini idea analysis error:', error);
      const message =
        error instanceof Error ? error.message : 'Unexpected error analyzing idea.';
      if (message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')) {
        res.status(502).json({
          error: 'Invalid or unauthorized Gemini API key. Please check Settings > Secrets.',
        });
        return;
      }
      if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
        res.status(429).json({
          error: 'AI quota limit reached temporarily. Please try again shortly.',
        });
        return;
      }
      res.status(500).json({
        error: 'Unable to analyze idea right now. Please retry.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NEXORA server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start NEXORA server:', err);
  process.exit(1);
});
