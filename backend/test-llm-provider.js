require('dotenv').config();

// Test LLM provider configuration
console.log('🧪 Testing LLM Provider Configuration...');
console.log('================================');
console.log(`LLM_PROVIDER: ${process.env.LLM_PROVIDER}`);
console.log(`BLACKBOX_API_KEY: ${process.env.BLACKBOX_API_KEY ? 'SET ✅' : 'NOT SET ❌'}`);
console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'SET ✅' : 'NOT SET ❌'}`);

// Import and test the LLM factory
async function testLLMFactory() {
  try {
    // Compile TypeScript files first
    const { execSync } = require('child_process');
    console.log('\n📦 Compiling TypeScript...');
    execSync('npm run build', { cwd: __dirname });
    
    // Now import the compiled JS
    const { LLMFactory } = require('./dist/services/llm/LLMFactory');
    
    console.log('\n🏭 Creating LLM Provider...');
    const providerInfo = LLMFactory.getProviderInfo();
    console.log('Provider Info:', providerInfo);
    
    const llm = LLMFactory.create();
    console.log(`✅ LLM Provider created successfully: ${llm.constructor.name}`);
    
    // Test a simple chat
    console.log('\n🤖 Testing chat functionality...');
    const response = await llm.chat([
      { role: 'user', content: 'Say "Hello World" and nothing else' }
    ], {
      temperature: 0.1,
      maxTokens: 50
    });
    
    console.log('✅ Chat response:', response.content);
    console.log('📊 Usage:', response.usage);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testLLMFactory();