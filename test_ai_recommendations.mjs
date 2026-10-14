import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sdgData from './src/data/sdgTargets.json' with { type: 'json' };
import poData from './src/data/programmeOutcomes.json' with { type: 'json' };
import psoData from './src/data/programmeSpecificOutcomes.json' with { type: 'json' };
import { SDG_LOGOS, getSdgLogo } from './src/utils/sdgLogos.js';
import { PSO_LIST } from './src/utils/constants.js';
import {
  validateRecommendationInput,
  sanitizeModelRecommendations,
  getRecommendations
} from './api/aiRecommendationService.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    failed++;
  }
}

console.log('=== AI SDG, PO & PSO Recommendation Unit & Regression Tests ===\n');

// 1. Data Integrity: UN SDGs
test('SDG Catalog has exactly 17 goals', () => {
  assert.equal(sdgData.length, 17);
  for (let i = 1; i <= 17; i++) {
    const goal = sdgData.find(g => g.sdgNumber === i);
    assert.ok(goal, `SDG ${i} must exist`);
    assert.ok(goal.title, `SDG ${i} must have title`);
    assert.ok(goal.officialName, `SDG ${i} must have officialName`);
    assert.ok(Array.isArray(goal.targets) && goal.targets.length > 0, `SDG ${i} must have targets`);
    for (const t of goal.targets) {
      assert.ok(t.id, `Target in SDG ${i} must have id`);
      assert.ok(t.description, `Target ${t.id} must have description`);
    }
  }
});

// 2. Data Integrity: NBA POs
test('Programme Outcomes Catalog has exactly 11 POs with exact definitions', () => {
  assert.equal(poData.length, 11);
  const expectedTitles = [
    'Engineering Knowledge',
    'Problem Analysis',
    'Design/Development of Solutions',
    'Conduct Investigations of Complex Problems',
    'Engineering Tool Usage',
    'The Engineer and The World',
    'Ethics',
    'Individual and Collaborative Team Work',
    'Communication',
    'Project Management and Finance',
    'Life-Long Learning'
  ];

  for (let i = 1; i <= 11; i++) {
    const po = poData.find(p => p.poNumber === i);
    assert.ok(po, `PO${i} must exist`);
    assert.equal(po.id, `PO${i}`);
    assert.equal(po.title, expectedTitles[i - 1]);
    assert.ok(po.description && po.description.length > 20, `PO${i} must have full description`);
  }
});

// 3. Data Integrity: RSCOE Department PSOs
test('Programme Specific Outcomes Catalog has exactly 3 PSOs with official RSCOE definitions', () => {
  assert.equal(psoData.length, 3, 'Must contain exactly 3 PSOs');
  
  const expectedPSOs = [
    {
      id: 'PSO1',
      title: 'Software Systems and Computing',
      desc: 'Graduates will be able to analyze, design, develop, and evaluate efficient software and computing systems by applying Computer Engineering fundamentals, software engineering principles, and modern development tools.'
    },
    {
      id: 'PSO2',
      title: 'Intelligent and Emerging Technologies',
      desc: 'Graduates will be able to develop secure, scalable, and intelligent solutions using emerging technologies such as Artificial Intelligence, Data Science, Cloud Computing, Cyber Security and related emerging technologies.'
    },
    {
      id: 'PSO3',
      title: 'Innovation, Research, and Entrepreneurship',
      desc: 'Graduates will be able to apply research methodologies, emerging technologies, and entrepreneurial skills to design, develop, and validate innovative computing solutions for complex engineering problems.'
    }
  ];

  for (const expected of expectedPSOs) {
    const found = psoData.find(p => p.id === expected.id);
    assert.ok(found, `${expected.id} must exist in programmeSpecificOutcomes.json`);
    assert.equal(found.title, expected.title, `${expected.id} title must match official RSCOE definition`);
    assert.equal(found.description, expected.desc, `${expected.id} description must match exact RSCOE text`);
  }

  // Verify PSO_LIST in constants.js aligns with catalog
  assert.equal(PSO_LIST.length, 3);
  for (let i = 0; i < 3; i++) {
    assert.equal(PSO_LIST[i].id, expectedPSOs[i].id);
    assert.equal(PSO_LIST[i].title, expectedPSOs[i].title);
    assert.equal(PSO_LIST[i].desc, expectedPSOs[i].desc);
  }
});

// 4. Official UN SDG Logos Mapping Verification
test('All 17 SDG logos resolve to valid local SVG assets', () => {
  for (let i = 1; i <= 17; i++) {
    const logo = getSdgLogo(i);
    assert.ok(logo, `Logo for SDG ${i} must resolve`);
    assert.equal(SDG_LOGOS[i], logo);
    // Verify physical file exists on disk
    const filePath = path.resolve('src/assets/sdg-icons', `sdg-${i}.svg`);
    assert.ok(fs.existsSync(filePath), `Physical file sdg-${i}.svg must exist`);
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.includes('<svg'), `sdg-${i}.svg must be valid XML SVG`);
  }

  // Invalid goal numbers should return null
  assert.equal(getSdgLogo(0), null);
  assert.equal(getSdgLogo(18), null);
  assert.equal(getSdgLogo('invalid'), null);
});

// 5. Input Validation
test('validateRecommendationInput rejects null/empty body', () => {
  const res = validateRecommendationInput(null);
  assert.equal(res.valid, false);
});

test('validateRecommendationInput rejects title < 3 characters', () => {
  const res = validateRecommendationInput({ title: 'AB', description: 'A'.repeat(120) });
  assert.equal(res.valid, false);
  assert.match(res.error, /title/i);
});

test('validateRecommendationInput rejects description < 100 characters', () => {
  const res = validateRecommendationInput({ title: 'Smart Irrigation', description: 'Too short.' });
  assert.equal(res.valid, false);
  assert.match(res.error, /description/i);
});

test('validateRecommendationInput accepts valid project details', () => {
  const res = validateRecommendationInput({
    title: 'Smart Solar Irrigation and Water Quality Monitoring System',
    type: 'Mini Project',
    domain: 'IoT',
    technologies: ['Arduino', 'React', 'Node.js'],
    description: 'This project develops an automated solar-powered IoT irrigation system aimed at smallholder farmers. It measures soil moisture, weather conditions, and water pH, conserving water and reducing agricultural runoff while optimizing crop yield in drought-prone areas.'
  });
  assert.equal(res.valid, true);
  assert.equal(res.data.title, 'Smart Solar Irrigation and Water Quality Monitoring System');
  assert.equal(res.data.technologies.length, 3);
});

// 6. Model Output Sanitization & Quality Rules (3-Array Schema)
test('sanitizeModelRecommendations produces correct 3-array schema with scores >= 40 and caps', () => {
  const mockRaw = {
    recommendedSDGs: [
      { sdgNumber: 6, relevanceScore: 92, reason: 'Water efficiency', targetReferences: [{ id: '6.4' }] },
      { sdgNumber: 7, relevanceScore: 85, reason: 'Solar energy', targetReferences: [{ id: '7.2' }] },
      { sdgNumber: 2, relevanceScore: 78, reason: 'Food security', targetReferences: [{ id: '2.4' }] },
      { sdgNumber: 13, relevanceScore: 70, reason: 'Climate adaptation', targetReferences: [{ id: '13.1' }] },
      { sdgNumber: 12, relevanceScore: 65, reason: 'Resource efficiency', targetReferences: [{ id: '12.2' }] },
      { sdgNumber: 9, relevanceScore: 60, reason: 'Tech infrastructure', targetReferences: [{ id: '9.4' }] }, // 6th SDG -> should be capped
      { sdgNumber: 1, relevanceScore: 25, reason: 'Weak correlation' } // score < 40 -> should be omitted
    ],
    recommendedPOs: [
      { poNumber: 1, relevanceScore: 88, reason: 'Engineering fundamentals' },
      { poNumber: 2, relevanceScore: 84, reason: 'Sensor analysis' },
      { poNumber: 3, relevanceScore: 82, reason: 'Solution design' },
      { poNumber: 5, relevanceScore: 80, reason: 'IoT tools' },
      { poNumber: 6, relevanceScore: 75, reason: 'Sustainability' },
      { poNumber: 8, relevanceScore: 70, reason: 'Team work' },
      { poNumber: 9, relevanceScore: 65, reason: 'Documentation' }, // 7th PO -> should be capped at 6
      { poNumber: 7, relevanceScore: 30, reason: 'Weak ethics' } // score < 40 -> should be omitted
    ],
    recommendedPSOs: [
      { psoId: 'PSO1', relevanceScore: 90, reason: 'Embedded computing and firmware development', evidenceFromProject: 'Arduino firmware and sensor polling' },
      { psoId: 'PSO2', relevanceScore: 85, reason: 'Cloud and IoT telemetry integration', evidenceFromProject: 'Real-time sensor transmission' },
      { psoId: 'PSO3', relevanceScore: 35, reason: 'Commercialization', evidenceFromProject: 'None' } // score < 40 -> should be omitted
    ]
  };

  const sanitized = sanitizeModelRecommendations(mockRaw);

  assert.ok(Array.isArray(sanitized.recommendedSDGs), 'recommendedSDGs must be an array');
  assert.ok(Array.isArray(sanitized.recommendedPOs), 'recommendedPOs must be an array');
  assert.ok(Array.isArray(sanitized.recommendedPSOs), 'recommendedPSOs must be an array');

  assert.equal(sanitized.recommendedSDGs.length, 5, 'Must cap at 5 SDGs');
  assert.equal(sanitized.recommendedPOs.length, 6, 'Must cap at 6 POs');
  assert.equal(sanitized.recommendedPSOs.length, 2, 'PSO3 with score < 40 must be omitted');

  // Verify PSO ground truth substitution
  const pso1 = sanitized.recommendedPSOs.find(p => p.psoId === 'PSO1');
  assert.ok(pso1);
  assert.equal(pso1.psoName, 'Software Systems and Computing');
  assert.match(pso1.psoDescription, /Computer Engineering fundamentals/);
  assert.equal(pso1.relevanceScore, 90);

  const pso2 = sanitized.recommendedPSOs.find(p => p.psoId === 'PSO2');
  assert.ok(pso2);
  assert.equal(pso2.psoName, 'Intelligent and Emerging Technologies');
  assert.match(pso2.psoDescription, /Artificial Intelligence, Data Science/);
  assert.equal(pso2.relevanceScore, 85);
});

// 7. Reject Invalid or Hallucinated PSO IDs
test('sanitizeModelRecommendations rejects invalid, hallucinated, or duplicate PSO IDs', () => {
  const mockRaw = {
    recommendedSDGs: [],
    recommendedPOs: [],
    recommendedPSOs: [
      { psoId: 'PSO1', relevanceScore: 95, reason: 'Valid software systems' },
      { psoId: 'PSO1', relevanceScore: 90, reason: 'Duplicate PSO1' }, // duplicate -> ignore
      { psoId: 'PSO4', relevanceScore: 80, reason: 'Hallucinated PSO4' }, // out of bounds -> ignore
      { psoId: 'PO1', relevanceScore: 75, reason: 'NBA PO passed as PSO' }, // PO instead of PSO -> ignore
      { psoId: 'UNKNOWN_PSO', relevanceScore: 90, reason: 'Invented outcome' }, // invalid -> ignore
      { psoId: null, relevanceScore: 70 },
      { psoId: '', relevanceScore: 85 }
    ]
  };

  const sanitized = sanitizeModelRecommendations(mockRaw);
  assert.equal(sanitized.recommendedPSOs.length, 1);
  assert.equal(sanitized.recommendedPSOs[0].psoId, 'PSO1');
});

// 8. Empty Recommendations When None Justified
test('sanitizeModelRecommendations returns empty arrays when no outcomes meet criteria', () => {
  const mockRaw = {
    recommendedSDGs: [{ sdgNumber: 1, relevanceScore: 20 }],
    recommendedPOs: [{ poNumber: 1, relevanceScore: 35 }],
    recommendedPSOs: [{ psoId: 'PSO1', relevanceScore: 25 }]
  };

  const sanitized = sanitizeModelRecommendations(mockRaw);
  assert.equal(sanitized.recommendedSDGs.length, 0);
  assert.equal(sanitized.recommendedPOs.length, 0);
  assert.equal(sanitized.recommendedPSOs.length, 0);
});

// 9. Malformed Model Output Handling
test('sanitizeModelRecommendations handles malformed/empty/corrupted output gracefully', () => {
  assert.deepEqual(sanitizeModelRecommendations(null), { recommendedSDGs: [], recommendedPOs: [], recommendedPSOs: [] });
  assert.deepEqual(sanitizeModelRecommendations('invalid string'), { recommendedSDGs: [], recommendedPOs: [], recommendedPSOs: [] });
  assert.deepEqual(sanitizeModelRecommendations({}), { recommendedSDGs: [], recommendedPOs: [], recommendedPSOs: [] });
});

// 10. Selection Preservation, Duplicate Prevention, and Deselection Simulation
test('Accepting PSOs preserves existing SDG & PO selections and prevents duplicates', () => {
  let selectedSDGs = [6, 7];
  let selectedPOs = ['PO1', 'PO5'];
  let selectedPSOs = ['PSO1'];

  // Simulation of accept handlers from RegisterProject.jsx:
  const acceptSDG = (num) => {
    if (!selectedSDGs.includes(num)) selectedSDGs = [...selectedSDGs, num];
  };
  const acceptPO = (id) => {
    if (!selectedPOs.includes(id)) selectedPOs = [...selectedPOs, id];
  };
  const acceptPSO = (id) => {
    if (!selectedPSOs.includes(id)) selectedPSOs = [...selectedPSOs, id];
  };
  const deselectPSO = (id) => {
    selectedPSOs = selectedPSOs.filter(p => p !== id);
  };
  const acceptAllPSOs = (ids) => {
    selectedPSOs = Array.from(new Set([...selectedPSOs, ...ids]));
  };

  // 1. Accept already selected PSO1 -> duplicate prevented
  acceptPSO('PSO1');
  assert.equal(selectedPSOs.filter(p => p === 'PSO1').length, 1);

  // 2. Accept new PSO2 -> adds without touching SDGs or POs
  acceptPSO('PSO2');
  assert.deepEqual(selectedPSOs, ['PSO1', 'PSO2']);
  assert.deepEqual(selectedSDGs, [6, 7], 'SDGs must remain completely untouched');
  assert.deepEqual(selectedPOs, ['PO1', 'PO5'], 'POs must remain completely untouched');

  // 3. Batch accept PSOs
  acceptAllPSOs(['PSO2', 'PSO3']);
  assert.deepEqual(selectedPSOs, ['PSO1', 'PSO2', 'PSO3']);

  // 4. Deselect PSO2 manually
  deselectPSO('PSO2');
  assert.deepEqual(selectedPSOs, ['PSO1', 'PSO3']);

  // 5. Rerun recommendations: form state remains intact
  const newRecommendations = {
    recommendedSDGs: [{ sdgNumber: 9, relevanceScore: 80 }],
    recommendedPOs: [{ poNumber: 2, relevanceScore: 75 }],
    recommendedPSOs: [{ psoId: 'PSO2', relevanceScore: 70 }]
  };
  // Selection arrays do NOT get reset by new recommendations arriving
  assert.deepEqual(selectedSDGs, [6, 7]);
  assert.deepEqual(selectedPOs, ['PO1', 'PO5']);
  assert.deepEqual(selectedPSOs, ['PSO1', 'PSO3']);
});

// 11. Backend Service Configuration Guard
await testAsync('getRecommendations returns 503 when GEMINI_API_KEY is missing', async () => {
  const result = await getRecommendations(
    {
      title: 'Real-time Autonomous Vehicle Lane Detection System',
      description: 'Using OpenCV and deep neural networks to accurately detect road lanes in various adverse weather conditions. Implemented on NVIDIA Jetson embedded board for real-time edge processing and driver assistance.'
    },
    { GEMINI_API_KEY: '' }
  );

  assert.equal(result.status, 503);
  assert.match(result.body.error, /GEMINI_API_KEY is missing/i);
});

// 12. Provider Error Handling Simulations
const sampleProjectPayload = {
  title: 'Real-time Autonomous Vehicle Lane Detection System',
  description: 'Using OpenCV and deep neural networks to accurately detect road lanes in various adverse weather conditions. Implemented on NVIDIA Jetson embedded board for real-time edge processing and driver assistance.'
};
const mockEnv = {
  GEMINI_API_KEY: 'test-api-key-mock',
  GEMINI_MODEL: 'gemini-3-flash-preview'
};

const originalFetch = globalThis.fetch;

await testAsync('getRecommendations handles provider 401/403 with safe 403 error', async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 403,
    headers: new Headers(),
    text: async () => JSON.stringify({ error: { message: 'API key not valid' } })
  });
  try {
    const result = await getRecommendations(sampleProjectPayload, mockEnv);
    assert.equal(result.status, 403);
    assert.equal(result.body.code, 'AUTH_FAILED');
    assert.doesNotMatch(result.body.error, /test-api-key-mock/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await testAsync('getRecommendations handles provider 429 and parses Retry-After header', async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 429,
    headers: new Headers({ 'retry-after': '45' }),
    text: async () => JSON.stringify({ error: { message: 'Resource has been exhausted' } })
  });
  try {
    const result = await getRecommendations(sampleProjectPayload, mockEnv);
    assert.equal(result.status, 429);
    assert.equal(result.body.code, 'RATE_LIMIT_EXCEEDED');
    assert.equal(result.body.retryAfter, 45);
    assert.match(result.body.error, /45 seconds/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await testAsync('getRecommendations handles provider 404 model not found', async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    headers: new Headers(),
    text: async () => JSON.stringify({ error: { message: 'models/gemini-old is not found' } })
  });
  try {
    const result = await getRecommendations(sampleProjectPayload, mockEnv);
    assert.equal(result.status, 502);
    assert.equal(result.body.code, 'MODEL_NOT_FOUND');
    assert.match(result.body.error, /unavailable or deprecated/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await testAsync('getRecommendations handles provider 503 service unavailable', async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 503,
    headers: new Headers(),
    text: async () => JSON.stringify({ error: { message: 'This model is currently experiencing high demand' } })
  });
  try {
    const result = await getRecommendations(sampleProjectPayload, mockEnv);
    assert.equal(result.status, 503);
    assert.equal(result.body.code, 'SERVICE_UNAVAILABLE');
    assert.match(result.body.error, /temporary high demand/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await testAsync('getRecommendations handles timeout error gracefully', async () => {
  globalThis.fetch = async () => {
    const err = new Error('The operation was aborted due to timeout');
    err.name = 'TimeoutError';
    throw err;
  };
  try {
    const result = await getRecommendations(sampleProjectPayload, mockEnv);
    assert.equal(result.status, 504);
    assert.equal(result.body.code, 'GATEWAY_TIMEOUT');
    assert.match(result.body.error, /timed out/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await testAsync('getRecommendations returns 200 with sanitized recommendations on successful API call', async () => {
  const sampleSuccessJson = JSON.stringify({
    candidates: [{
      content: {
        parts: [{
          text: JSON.stringify({
            recommendedSDGs: [{ sdgNumber: 9, relevanceScore: 88, reason: 'Edge computing infrastructure', targetReferences: [{ id: '9.5' }] }],
            recommendedPOs: [{ poNumber: 3, relevanceScore: 82, reason: 'Design and development of edge vision solutions' }],
            recommendedPSOs: [{ psoId: 'PSO2', relevanceScore: 85, reason: 'Intelligent deep learning models applied on embedded device' }]
          })
        }]
      }
    }]
  });

  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => JSON.parse(sampleSuccessJson)
  });
  try {
    const result = await getRecommendations(sampleProjectPayload, mockEnv);
    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.equal(result.body.recommendations.recommendedSDGs.length, 1);
    assert.equal(result.body.recommendations.recommendedSDGs[0].sdgNumber, 9);
    assert.equal(result.body.recommendations.recommendedPOs.length, 1);
    assert.equal(result.body.recommendations.recommendedPSOs.length, 1);
    assert.equal(result.body.recommendations.recommendedPSOs[0].psoId, 'PSO2');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
