// Простой тест для проверки соединения между фронтендом и бэкендом
const axios = require('axios');

async function testConnection() {
  console.log('🧪 Тестирование соединения...\n');
  
  // Тест 1: Проверка health endpoint
  try {
    console.log('1️⃣ Тестирование health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Health endpoint работает:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health endpoint не работает:', error.message);
  }
  
  // Тест 2: Проверка API endpoint через прямой запрос
  try {
    console.log('\n2️⃣ Тестирование API endpoint напрямую...');
    const directResponse = await axios.post('http://localhost:5000/api/doctors/search', {
      specialty: 'Cardiologue',
      location: 'Paris',
      date: '2024-01-15',
      additionalRequirements: 'Test'
    });
    console.log('✅ Прямой API запрос работает');
  } catch (error) {
    console.log('❌ Прямой API запрос не работает:', error.message);
    if (error.response) {
      console.log('📋 Status:', error.response.status);
      console.log('📋 Data:', error.response.data);
    }
  }
  
  // Тест 3: Проверка через Vite proxy (если запущен)
  try {
    console.log('\n3️⃣ Тестирование через Vite proxy...');
    const proxyResponse = await axios.post('http://localhost:3000/api/doctors/search', {
      specialty: 'Cardiologue',
      location: 'Paris',
      date: '2024-01-15',
      additionalRequirements: 'Test'
    });
    console.log('✅ Vite proxy работает');
  } catch (error) {
    console.log('❌ Vite proxy не работает:', error.message);
    if (error.response) {
      console.log('📋 Status:', error.response.status);
    }
  }
}

testConnection();
