import OpenAI from 'openai';
import {
  BLACKBOX_API_KEY,
  BLACKBOX_BASE_URL,
  BLACKBOX_MODEL,
  BLACKBOX_EXTRA_HEADER_NAME,
  BLACKBOX_EXTRA_HEADER_VALUE,
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  OPENAI_MODEL,
  DEBUG,
} from './config.js';

function normalizeBaseURL(url, provider) {
  let u = (url || '').trim();
  // Strip accidental endpoints
  if (/\/chat\/completions\b/.test(u)) {
    const root = u.split('/chat/completions')[0];
    u = root;
    console.warn('[LLM] Detected baseURL includes /chat/completions. Stripping to', u);
  }
  if (/\/models(\/.*)?$/.test(u)) {
    const root = u.replace(/\/models(\/.*)?$/, '');
    console.warn('[LLM] Detected baseURL includes /models. Stripping to', root);
    u = root;
  }
  // Ensure /v1 root
  if (!/\/v\d+(\/)?$/.test(u)) {
    u = u.replace(/\/$/, '');
    u = `${u}/v1`;
  }
  return u;
}

/**
 * Decide provider by env presence:
 * - If OPENAI_API_KEY set -> use OpenAI
 * - Else if BLACKBOX_API_KEY set -> use Blackbox
 * - Else throw
 */
export function createLLM() {
  let provider = null;
  let apiKey = '';
  let baseURL = '';
  let model = '';
  let defaultHeaders = {};

  if (OPENAI_API_KEY) {
    provider = 'openai';
    apiKey = OPENAI_API_KEY;
    baseURL = normalizeBaseURL(OPENAI_BASE_URL, provider);
    model = OPENAI_MODEL;
  } else if (BLACKBOX_API_KEY) {
    provider = 'blackbox';
    apiKey = BLACKBOX_API_KEY;
    baseURL = normalizeBaseURL(BLACKBOX_BASE_URL, provider);
    model = BLACKBOX_MODEL;
    if (BLACKBOX_EXTRA_HEADER_NAME && BLACKBOX_EXTRA_HEADER_VALUE) {
      defaultHeaders[BLACKBOX_EXTRA_HEADER_NAME] = BLACKBOX_EXTRA_HEADER_VALUE;
    }
  } else {
    throw new Error('No API key provided. Set OPENAI_API_KEY or BLACKBOX_API_KEY in environment');
  }

  if (DEBUG) {
    console.log('[LLM] provider=', provider, 'baseURL=', baseURL, 'model=', model);
    if (provider === 'blackbox' && BLACKBOX_EXTRA_HEADER_NAME) {
      console.log('[LLM] extra header:', BLACKBOX_EXTRA_HEADER_NAME);
    }
  }

  const client = new OpenAI({ apiKey, baseURL, defaultHeaders });
  return { client, model, provider };
}

// One-pass function-calling loop: single tool call supported for MVP
export async function runWithFunctionCalling({ system, user, tools }) {
  const { client, model } = createLLM();
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: user });

  let first;
  try {
    first = await client.chat.completions.create({
      model,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 1,
    });
  } catch (err) {
    const status = err?.status;
    const msg = err?.message || err;
    console.error('[LLM] request failed:', status || '', msg);
    if (status === 404) {
      console.error('Hint: Verify base URL (root like https://api.openai.com/v1 or https://api.blackbox.ai/v1), avoid /models or /chat/completions in base URL, and verify model name.');
    }
    throw err;
  }

  const choice = first.choices?.[0];
  if (!choice) throw new Error('No completion choices returned');

  const toolCalls = choice.message?.tool_calls || [];
  if (DEBUG) console.log('DEBUG: tool_calls=', JSON.stringify(toolCalls, null, 2));

  // If there is a tool call, the caller should resolve it and pass function result back
  return { initial: first, toolCalls };
}

export async function continueAfterTool({ pastMessages, functionName, functionResult }) {
  const { client, model } = createLLM();
  const messages = [
    ...pastMessages,
    { role: 'tool', tool_call_id: functionName, content: JSON.stringify(functionResult) },
  ];
  // NOTE: different providers vary; we keep it simple and re-ask model
  const res = await client.chat.completions.create({
    model,
    messages,
    temperature: 1,
  });
  return res;
}
