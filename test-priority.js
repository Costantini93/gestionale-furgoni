// Test veloce per verificare la priorità AI
const { detectPriorityWithExplanation } = require('./utils/priorityDetector');

// Test cases
const tests = [
  "graffio alla carrozzeria",
  "Graffio sulla portiera",
  "Graffi sul cofano",
  "Freni che non funzionano",
  "Il motore non parte",
  "Ammaccatura sul paraurti",
  "Tergicristalli da sostituire",
  "Piccolo graffio dietro"
];

console.log('\n🤖 TEST AI PRIORITY DETECTION\n');
console.log('='.repeat(60));

tests.forEach(test => {
  const result = detectPriorityWithExplanation(test);
  const emoji = result.priority === 'alta' ? '🔴' : result.priority === 'media' ? '🟡' : '🟢';
  
  console.log(`\n📝 Test: "${test}"`);
  console.log(`${emoji} Priorità: ${result.priority.toUpperCase()}`);
  console.log(`📊 Confidence: ${result.confidence}%`);
  console.log(`💡 ${result.explanation}`);
});

console.log('\n' + '='.repeat(60));
