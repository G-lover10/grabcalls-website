// Model registry — all accessed via OpenRouter (one API key)
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

const MODELS = {
  // Lead orchestrator — complex reasoning, multi-step autonomous tasks
  fable5: {
    id: 'anthropic/claude-fable-5',
    name: 'Claude Fable 5',
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    strengths: ['orchestration', 'complex-reasoning', 'long-horizon', 'research'],
    costPer1MIn: 10.00,
    costPer1MOut: 50.00,
  },

  // Agentic coding — purpose-built, free right now
  lagunaMid: {
    id: 'poolside/laguna-m.1:free',
    name: 'Laguna M.1',
    contextWindow: 256_000,
    maxOutput: 16_000,
    strengths: ['coding', 'code-review', 'debugging', 'refactor'],
    costPer1MIn: 0,
    costPer1MOut: 0,
  },

  // Fast agentic coding
  lagunaSmall: {
    id: 'poolside/laguna-xs-2.1',
    name: 'Laguna XS.2',
    contextWindow: 256_000,
    maxOutput: 8_000,
    strengths: ['quick-code', 'snippets', 'fast-coding'],
    costPer1MIn: 0.06,
    costPer1MOut: 0.25,
  },

  // Cheap bulk tasks — 262K context
  ling1T: {
    id: 'inclusionai/ling-2.6-1t-20260423:free',
    name: 'Ling-2.6-1T',
    contextWindow: 262_000,
    maxOutput: 8_000,
    strengths: ['bulk', 'summarize', 'classify', 'extract', 'math', 'cheap-reasoning'],
    costPer1MIn: 0,
    costPer1MOut: 0,
  },

  // Standard tasks — keep for app API calls
  sonnet: {
    id: 'anthropic/claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    contextWindow: 200_000,
    maxOutput: 8_000,
    strengths: ['app-api', 'standard', 'balanced'],
    costPer1MIn: 3.00,
    costPer1MOut: 15.00,
  },
};

// Route a task type to the best model
function pickModel(taskType) {
  const routes = {
    orchestrate:   MODELS.fable5,
    research:      MODELS.fable5,
    'long-horizon': MODELS.fable5,
    code:          MODELS.lagunaMid,
    debug:         MODELS.lagunaMid,
    'code-review': MODELS.lagunaMid,
    'quick-code':  MODELS.lagunaSmall,
    summarize:     MODELS.ling1T,
    classify:      MODELS.ling1T,
    extract:       MODELS.ling1T,
    bulk:          MODELS.ling1T,
    math:          MODELS.ling1T,
    api:           MODELS.sonnet,
    standard:      MODELS.sonnet,
  };
  return routes[taskType] || MODELS.sonnet;
}

async function callModel(modelKey, messages, options = {}) {
  const model = typeof modelKey === 'string' ? MODELS[modelKey] : modelKey;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY env var not set');

  const resp = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://grabcalls.com',
      'X-Title': 'Glover Enterprise Agent',
    },
    body: JSON.stringify({
      model: model.id,
      messages,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.3,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenRouter ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  return data.choices[0].message.content;
}

module.exports = { MODELS, pickModel, callModel };
