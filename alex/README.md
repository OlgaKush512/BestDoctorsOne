**MCP Doctolib MVP**

- **Цель:** показать, как работает function-calling через OpenAI-совместимый API и как вызывать действия через MCP Playwright для получения данных со стороннего сайта (Doctolib).
- **Провайдер моделей:** Blackbox AI или OpenAI (оба через OpenAI-совместимый API).
- **Инструмент:** один function/tool `search_doctors_on_doctolib`, который под капотом использует MCP Playwright.

**Требования**
- Node.js 18+
- NPM/Yarn
- Доступ к Blackbox AI API (ключ)
- Возможность запускать MCP сервер Playwright (`@modelcontextprotocol/server-playwright`)

**Установка**
- Установите зависимости: `npm install` (потребуется сеть)
- Скопируйте `.env.example` в `.env` и заполните ОДНОГО из провайдеров:
  - Blackbox AI:
    - `BLACKBOX_API_KEY` — ключ Blackbox
    - `BLACKBOX_BASE_URL` — базовый URL Blackbox (например `https://api.blackbox.ai` или `https://api.blackbox.ai/v1`)
    - `BLACKBOX_MODEL` — модель (например `blackbox-omni` — уточните в документации Blackbox)
  - OpenAI:
    - `OPENAI_API_KEY` — ключ OpenAI
    - `OPENAI_BASE_URL` — базовый URL OpenAI (по умолчанию `https://api.openai.com/v1`)
    - `OPENAI_MODEL` — опционально, модель (по умолчанию `gpt-4o-mini`)
  - `DEBUG=1` для подробного вывода (по желанию)
  - `DRY_RUN=1` чтобы протестировать логику function-calling без реального MCP

Пример `.env`:
```
BLACKBOX_API_KEY=sk-...
BLACKBOX_BASE_URL=https://api.blackbox.ai
BLACKBOX_MODEL=blackbox-omni
# ИЛИ используйте OpenAI:
# OPENAI_API_KEY=sk-...
# OPENAI_BASE_URL=https://api.openai.com/v1
# OPENAI_MODEL=gpt-4o-mini
DEBUG=1
DRY_RUN=0
MCP_PLAYWRIGHT_COMMAND=npx
MCP_PLAYWRIGHT_ARGS=@modelcontextprotocol/server-playwright@latest
# If required by your provider (in addition to Authorization):
# BLACKBOX_EXTRA_HEADER_NAME=X-API-KEY
# BLACKBOX_EXTRA_HEADER_VALUE=sk-...
# To bypass LLM and directly call the tool (offline/MCP-only test):
# BYPASS_LLM=1
```

**MCP Playwright**
- Вам нужен совместимый MCP-сервер Playwright. Имя пакета в примере может отличаться или отсутствовать в npm-реестре.
- Укажите реальную команду запуска в `.env`:
  - Если используете npx и опубликованный пакет: `MCP_PLAYWRIGHT_COMMAND=npx` и `MCP_PLAYWRIGHT_ARGS=<имя_пакета>@<версия>`
  - Если используете локальный скрипт: `MCP_PLAYWRIGHT_COMMAND=node` и `MCP_PLAYWRIGHT_ARGS=path/to/server.js`
- Клиент автоматически добавит `-y` только для `npx`. Для других команд ничего не добавляется.
- При невозможности запустить сервер (например, пакет отсутствует) клиент автоматически переключится в DRY_RUN на текущую сессию, чтобы не падать.

Важно: Имена MCP-tools могут отличаться по версиям. В `src/tools/searchDoctors.js` используется базовый набор имён (`page.new`, `page.goto`, `page.fill`, `page.click`, `page.press`, `page.waitForSelector`, `page.evaluate`). Если ваш сервер публикует иные имена, замените их на актуальные (посмотрите список, который печатается при `DEBUG=1`).

**Запуск**
- Интерактивно: `npm start` и введите запрос, например: «Найди кардиолога в Париже на следующей неделе».
- Или передайте текст запроса: `node src/index.js "Найди стоматолога в Лионе завтра"`

**Как это работает**
- Приложение отправляет ваш запрос в LLM (OpenAI или Blackbox AI — выбирается автоматически по наличию ключа в `.env`) через OpenAI-совместимый `chat.completions` с описанием function `search_doctors_on_doctolib`.
- Если модель решает вызвать функцию, хост-приложение выполняет функцию: включает MCP Playwright, переходит на Doctolib, вводит критерии, извлекает результаты и возвращает их назад в модель.
- Модель формирует финальный ответ для пользователя на основе данных инструмента.

**Обратите внимание**
- Это MVP. Селекторы и шаги для Doctolib могут меняться. При ошибках включите `DEBUG=1`, посмотрите какие MCP-tools доступны, и скорректируйте селекторы/вызовы.
- Если Blackbox AI не поддерживает нужную модель/параметры, измените `BLACKBOX_MODEL` или `BLACKBOX_BASE_URL` в `.env` в соответствии с документацией провайдера.
- Если хотите использовать встроенную в платформу поддержку MCP (через OpenAI Responses API и `tools: [{type:"mcp", ...}]`), это потребует моделей OpenAI. Здесь выбран независимый путь — function-calling с собственным исполнителем, чтобы сохранить совместимость с Blackbox.

**Файлы**
- `src/index.js` — CLI и цикл function-calling
- `src/llm.js` — клиент OpenAI-совместимого API (Blackbox)
- `src/mcpClient.js` — обёртка MCP-клиента (stdio)
- `src/tools/searchDoctors.js` — описание function и имплементация с MCP Playwright
- `.env.example` — пример конфигурации

**Быстрые подсказки по отладке**
- `DRY_RUN=1` — проверить только логику function-calling без MCP
- `DEBUG=1` — увидеть список MCP-инструментов и подробные шаги
- Проверьте, что npx может подтянуть `@modelcontextprotocol/server-playwright` (или установите глобально)

**Траблшутинг 404 при вызове LLM**
- 404 без тела часто означает неверный базовый URL. Клиент формирует путь как `{baseURL}/chat/completions`. Используйте корень провайдера:
  - OpenAI: `https://api.openai.com/v1`
  - Blackbox: `https://api.blackbox.ai` или `https://api.blackbox.ai/v1`
- Уточните поддерживаемую модель (`OPENAI_MODEL` или `BLACKBOX_MODEL`).
- Для Blackbox при необходимости используйте дополнительные заголовки `BLACKBOX_EXTRA_HEADER_NAME`/`VALUE`.
- При ограниченном доступе к сети временно используйте `BYPASS_LLM=1` для проверки MCP-инструмента напрямую.
