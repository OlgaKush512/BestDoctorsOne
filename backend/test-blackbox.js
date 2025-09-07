require('dotenv').config();

// Dynamic import for node-fetch (ESM module)
async function loadFetch() {
  const module = await import('node-fetch');
  return module.default;
}

const fetchPromise = loadFetch();

async function testBlackboxAPI() {
  const fetch = await fetchPromise;
  console.log('🧪 Testing Blackbox AI API connection...');
  
  const apiKey = process.env.BLACKBOX_API_KEY;
  
  if (!apiKey) {
    console.error('❌ BLACKBOX_API_KEY not found in .env');
    return;
  }
  
  console.log(`📝 Using API key: ${apiKey.substring(0, 10)}...`);
  
  const requestBody = {
    model: 'blackboxai/google/gemini-2.0-flash-001',
    messages: [
      {
        role: 'user',
        content: 'Say "Hello from Blackbox AI" in JSON format with a field called "message"'
      }
    ],
    temperature: 0.1,
    max_tokens: 100
  };
  
  console.log('📤 Sending request to Blackbox AI...');
  console.log('Request body:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await fetch('https://api.blackbox.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`📥 Response status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('📥 Raw response:', responseText);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Parsed response:', JSON.stringify(data, null, 2));
        
        if (data.choices && data.choices[0]) {
          console.log('🤖 AI response:', data.choices[0].message.content);
        }
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
      }
    } else {
      console.error('❌ API error:', responseText);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Test with different models
async function testModels() {
  const fetch = await fetchPromise;
  const models = [
    'blackboxai/google/gemini-2.0-flash-001',
    'blackboxai',
    'gpt-3.5-turbo'
  ];
  
  for (const model of models) {
    console.log(`\n🧪 Testing model: ${model}`);
    console.log('='.repeat(50));
    
    try {
      const response = await fetch('https://api.blackbox.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.BLACKBOX_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'Reply with "OK"' }],
          max_tokens: 10
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Model ${model} works!`);
        console.log('Response:', data.choices?.[0]?.message?.content);
      } else {
        const error = await response.text();
        console.log(`❌ Model ${model} failed: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Model ${model} network error:`, error.message);
    }
  }
}

// Run tests
testBlackboxAPI().then(() => {
  console.log('\n🧪 Testing different models...');
  return testModels();
});