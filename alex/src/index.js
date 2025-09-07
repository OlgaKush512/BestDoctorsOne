#!/usr/bin/env node
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { runWithFunctionCalling, createLLM } from './llm.js';
import { searchDoctorsToolDef, searchDoctorsExecutor } from './tools/searchDoctors.js';
import { DEBUG, BYPASS_LLM } from './config.js';

async function promptUser(query) {
  return 'cardiologue a paris le 15 septembre 2025'
  // const rl = readline.createInterface({ input, output });
  // try { return await rl.question(one); } finally { rl.close(); }
}

async function main() {
  const q = process.argv.slice(2).join(' ') || (await promptUser('Введите ваш запрос (поиск врача): '));

  const system = [
    'Ты — помощник, который использует инструмент function-calling,',
    'чтобы выполнять поиск врачей на Doctolib через специальный инструмент search_doctors_on_doctolib.',
    'При необходимости обязательно вызывай этот инструмент с корректными аргументами.',
  ].join(' ');

  const tools = [searchDoctorsToolDef];

  if (BYPASS_LLM) {
    console.log('BYPASS_LLM=1: вызываю инструмент напрямую (без LLM).');
    const fallback = await searchDoctorsExecutor({ specialty: q, location: '', date: '' });
    console.log('\n— Результат инструмента —\n');
    console.log(JSON.stringify(fallback, null, 2));
    console.log('\n(Готово)');
    return;
  }

  const { initial, toolCalls } = await runWithFunctionCalling({ system, user: q, tools });

  const messages = [{ role: 'system', content: system }, { role: 'user', content: q }];
  const assistantMsg = initial.choices?.[0]?.message || { role: 'assistant', content: '' };
  messages.push(assistantMsg);

  if (toolCalls && toolCalls.length > 0) {
    const call = toolCalls[0];
    const fnName = call.function?.name;
    const rawArgs = call.function?.arguments || '{}';
    const args = JSON.parse(rawArgs);

    if (DEBUG) console.log('Вызов функции:', fnName, args);

    let result;
    if (fnName === 'search_doctors_on_doctolib') {
      result = await searchDoctorsExecutor(args);
    } else {
      result = { error: `Unknown function ${fnName}` };
    }

    messages.push({
      role: 'tool',
      tool_call_id: call.id,
      name: fnName,
      content: JSON.stringify(result),
    });

    const { client, model } = createLLM();
    const final = await client.chat.completions.create({
      model,
      messages,
      temperature: 1,
    });

    const text = final.choices?.[0]?.message?.content || '';
    console.log('\n— Итоговый ответ LLM —\n');
    console.log(text);
    console.log('\n(Готово)');
    return;
  }

  // No tool call; just print the model answer
  const text = initial.choices?.[0]?.message?.content || '';
  console.log('\n— Ответ LLM —\n');
  console.log(text);
  console.log('\n(Готово)');
}

main().catch(err => {
  console.error('Ошибка:', err?.message || err);
  if (DEBUG && err?.stack) console.error(err.stack);
  process.exit(1);
});
