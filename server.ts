import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      assistant: 'Webby',
      model: 'gemini-3.8-flash',
      hasApiKey: Boolean(apiKey),
    });
  });

  // Assistant chat endpoint
  app.post('/api/assistant/chat', async (req, res) => {
    try {
      const { message, chatHistory = [], userContext = {} } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      if (!apiKey) {
        res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server.',
        });
        return;
      }

      const systemInstruction = `You are "Webby", the hyper-intelligent, adorable, caring cyber-spider AI companion in the futuristic productivity HUD system "WEB ASCEND".
You have a lovable, encouraging, and witty personality. You act like a mix of Peter Parker's AI (KAREN), a cute pocket spider-bot companion, and an elite personal routine strategist.

Your primary duty:
Answer all questions about the user's daily schedules, routine, habits (daily protocols), tasks (missions), what they have accomplished today, what is left to do, their streaks, XP, essence/coins, and ascension progression.

### Core Guidelines:
1. **Live Routine Accuracy**: You have real-time live telemetry of the user's exact daily tasks, completed habits, pending missions, time of day, and stats. ALWAYS use this actual live data to give precise, factual, direct answers.
2. **"What did I do today?"**:
   - List specifically which missions and daily protocols they have checked off today.
   - Mention total XP and Essence/Coins earned today so far.
   - Celebrate their wins enthusiastically with cute spider cyber energy!
3. **"What's on my schedule / What's left?"**:
   - List remaining incomplete missions and habits.
   - Highlight high-priority items or habits with ongoing streaks that need protection today.
   - State whether they are currently on track for a "Perfect Day" (which requires 100% of required missions + all active habits).
4. **Tone & Style**:
   - Cute, friendly, enthusiastic, yet organized and crisp.
   - Use cute cyber-spider phrases playfully ("Spidey-sensors detecting...", "Neural web sync complete!", "Great job, Operative!", "Let's weave that streak!").
   - Use clean Markdown with bullet points, bold keywords, and emojis (🕷️, 🕸️, ⚡, 🎯, 🪙, ✨, 🔥, 🏆, ✅, ⏳).
   - Keep answers readable, structured, and uplifting.

### Current Live Telemetry Context:
${JSON.stringify(userContext, null, 2)}
`;

      // Build conversation contents for Gemini
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      // Include previous conversation turns
      if (Array.isArray(chatHistory)) {
        for (const msg of chatHistory.slice(-8)) {
          if (msg.role === 'user' || msg.role === 'model') {
            contents.push({
              role: msg.role,
              parts: [{ text: String(msg.text || msg.content || '') }],
            });
          }
        }
      }

      // Append current user message
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      // Try Gemini 3.8 Flash first, then fallback models if 503/429
      let reply: string | undefined;
      const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
          if (response.text) {
            reply = response.text;
            break;
          }
        } catch (genError: any) {
          console.warn(`Model ${modelName} error:`, genError?.message || genError);
          // Try next model if transient error
          continue;
        }
      }

      if (!reply) {
        // Telemetry-grounded fallback response if external models are temporarily under peak load
        const opName = userContext?.operative?.username || 'Operative';
        const doneCount = userContext?.todaySummary?.completedCount ?? 0;
        const totalCount = userContext?.todaySummary?.totalObjectives ?? 0;
        const streak = userContext?.operative?.currentStreak ?? 0;
        const xp = userContext?.todaySummary?.xpEarnedToday ?? 0;
        const coins = userContext?.todaySummary?.essenceEarnedToday ?? 0;

        reply = `🕷️ **Webby Telemetry Sync!** ✨\n\nHey **${opName}**! Here is your live routine status:\n\n• **Objectives Completed:** ${doneCount} / ${totalCount} (${userContext?.todaySummary?.completionPercentage ?? 0}%)\n• **Daily Loot:** +${xp} XP | +${coins} Spidey Coins 🪙\n• **Active Streak:** 🔥 ${streak} Days\n• **Rank:** Tier ${userContext?.operative?.rank || 'D'}\n\nLet's keep your protocols locked in and weave a sensational day! ⚡`;
      }

      res.json({ reply });
    } catch (error: any) {
      console.error('Error in Webby assistant chat:', error);
      res.status(500).json({
        error: error.message || 'Failed to process request with Webby assistant',
      });
    }
  });

  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Web Ascend server with Webby AI companion online on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
