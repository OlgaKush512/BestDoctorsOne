# 🔧 Руководство по отладке проблемы с логами

## Проблема
Запросы через curl показывают логи в бэкенде, но запросы через браузер/фронтенд - нет.

## Внесенные изменения

### 1. Исправлена маршрутизация API
- **Было**: `/api` + `/doctors/search` = дублирование
- **Стало**: `/api/doctors` + `/search` = правильный путь `/api/doctors/search`

### 2. Добавлено подробное логирование
- **Бэкенд**: Логирование всех входящих запросов с headers и body
- **Фронтенд**: Логирование прокси запросов в Vite

## Как тестировать

### Шаг 1: Запуск бэкенда
```bash
cd backend
npm install
npm run dev
```
Должны увидеть: `🚀 Server running on port 5000`

### Шаг 2: Запуск фронтенда (в новом терминале)
```bash
cd frontend
npm install
npm run dev
```
Должны увидеть: `Local: http://localhost:3000`

### Шаг 3: Тест через curl (должен работать)
```bash
curl -X POST http://localhost:5000/api/doctors/search \
  -H "Content-Type: application/json" \
  -d '{
    "specialty": "Cardiologue",
    "location": "Paris", 
    "date": "2024-01-15"
  }'
```

### Шаг 4: Тест через браузер
1. Откройте http://localhost:3000
2. Заполните форму поиска
3. Нажмите "Trouver les Meilleurs Docteurs"
4. **Теперь должны появиться логи в терминале бэкенда!**

### Шаг 5: Дополнительный тест
```bash
node test-connection.js
```

## Что искать в логах

### В терминале бэкенда должно появиться:
```
🌐 2024-01-15T10:30:00.000Z - POST /api/doctors/search
📋 Headers: { ... }
📦 Body: { specialty: "Cardiologue", location: "Paris", ... }
🔍 Searching for Cardiologue in Paris on 2024-01-15
```

### В терминале фронтенда должно появиться:
```
📤 Sending Request to Backend: POST /api/doctors/search
📥 Received Response from Backend: 200 /api/doctors/search
```

## Если проблема остается

1. **Проверьте порты**: Бэкенд на 5000, фронтенд на 3000
2. **Проверьте CORS**: В логах не должно быть CORS ошибок
3. **Проверьте Network tab**: F12 → Network → посмотрите статус запросов
4. **Проверьте Console**: F12 → Console → ошибки JavaScript

## Возможные причины, если не работает

1. **Порт занят**: Другое приложение использует порт 5000 или 3000
2. **Firewall**: Блокирует соединения
3. **Antivirus**: Блокирует Node.js
4. **Кэш браузера**: Очистите кэш (Ctrl+Shift+R)
