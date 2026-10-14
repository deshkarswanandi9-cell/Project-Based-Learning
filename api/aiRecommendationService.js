import sdgData from '../src/data/sdgTargets.json' with { type: 'json' };
import poData from '../src/data/programmeOutcomes.json' with { type: 'json' };
import psoData from '../src/data/programmeSpecificOutcomes.json' with { type: 'json' };

const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview';

// Quick lookup maps for authoritative reference data validation
const sdgMap = new Map(sdgData.map(s => [s.sdgNumber, s]));
const poMap = new Map(poData.map(p => [p.poNumber, p]));
const psoMap = new Map(psoData.map(p => [p.id.toUpperCase(), p]));

/**
 * Validates incoming project input fields.
 */
export function validateRecommendationInput(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body. Expected JSON object with project details.' };
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';

  if (!title || title.length < 3) {
    return { valid: false, error: 'A meaningful project title (at least 3 characters) is required to generate recommendations.' };
  }

  if (title.length > 250) {
    return { valid: false, error: 'Project title cannot exceed 250 characters.' };
  }

  if (!description || description.length < 100) {
    return {
      valid: false,
      error: `Project description is too short (${description.length} characters). Please provide at least 100 characters detailing your problem statement, methodology, and expected outcomes.`
    };
  }

  if (description.length > 6000) {
    return { valid: false, error: 'Project description cannot exceed 6,000 characters.' };
  }

  return {
    valid: true,
    data: {
      title,
      description,
      type: typeof body.type === 'string' ? body.type.trim() : 'Project',
      domain: typeof body.domain === 'string' ? body.domain.trim() : 'General',
      technologies: Array.isArray(body.technologies)
        ? body.technologies.filter(t => typeof t === 'string' && t.trim()).slice(0, 20)
        : []
    }
  };
}

/**
 * Sanitizes and validates the raw JSON returned by the model against the official SDG, PO, and PSO definitions.
 */
export function sanitizeModelRecommendations(rawOutput) {
  const result = {
    recommendedSDGs: [],
    recommendedPOs: [],
    recommendedPSOs: []
  };

  if (!rawOutput || typeof rawOutput !== 'object') {
    return result;
  }

  // 1. Process SDGs (Max 5, score >= 40, strictly verified against sdgTargets.json)
  if (Array.isArray(rawOutput.recommendedSDGs)) {
    const seenSDGs = new Set();
    for (const item of rawOutput.recommendedSDGs) {
      if (!item || typeof item !== 'object') continue;
      const num = parseInt(item.sdgNumber, 10);
      if (isNaN(num) || num < 1 || num > 17 || seenSDGs.has(num)) continue;

      const officialSDG = sdgMap.get(num);
      if (!officialSDG) continue;

      const score = Math.max(0, Math.min(100, parseInt(item.relevanceScore, 10) || 0));
      if (score < 40) continue; // Omit weak alignment (< 40)

      // Validate targets against official targets for this specific SDG
      const validTargets = [];
      if (Array.isArray(item.targetReferences)) {
        const officialTargetMap = new Map(officialSDG.targets.map(t => [t.id.toLowerCase(), t]));
        for (const tr of item.targetReferences) {
          const tId = typeof tr === 'string' ? tr.trim() : (tr?.id ? String(tr.id).trim() : '');
          const match = officialTargetMap.get(tId.toLowerCase());
          if (match) {
            validTargets.push({
              id: match.id,
              description: match.description
            });
          }
        }
      }

      seenSDGs.add(num);
      result.recommendedSDGs.push({
        sdgNumber: num,
        sdgTitle: officialSDG.title,
        sdgName: officialSDG.officialName,
        relevanceScore: score,
        reason: typeof item.reason === 'string' ? item.reason.trim() : 'Direct alignment with project objectives.',
        targetReferences: validTargets,
        evidenceFromProject: typeof item.evidenceFromProject === 'string' ? item.evidenceFromProject.trim() : '',
        limitations: typeof item.limitations === 'string' && item.limitations.trim() ? item.limitations.trim() : null
      });

      if (result.recommendedSDGs.length >= 5) break; // Quality rule: at most 5 SDGs
    }
  }

  // 2. Process NBA POs (Max 6, score >= 40, strictly verified against programmeOutcomes.json)
  if (Array.isArray(rawOutput.recommendedPOs)) {
    const seenPOs = new Set();
    for (const item of rawOutput.recommendedPOs) {
      if (!item || typeof item !== 'object') continue;
      const poNum = parseInt(item.poNumber, 10);
      if (isNaN(poNum) || poNum < 1 || poNum > 11 || seenPOs.has(poNum)) continue;

      const officialPO = poMap.get(poNum);
      if (!officialPO) continue;

      const score = Math.max(0, Math.min(100, parseInt(item.relevanceScore, 10) || 0));
      if (score < 40) continue; // Omit weak alignment (< 40)

      seenPOs.add(poNum);
      result.recommendedPOs.push({
        poNumber: poNum,
        poId: officialPO.id,
        poName: officialPO.title,
        poDescription: officialPO.description,
        relevanceScore: score,
        reason: typeof item.reason === 'string' ? item.reason.trim() : 'Aligns with engineering problem solving methodology.',
        evidenceFromProject: typeof item.evidenceFromProject === 'string' ? item.evidenceFromProject.trim() : '',
        limitations: typeof item.limitations === 'string' && item.limitations.trim() ? item.limitations.trim() : null
      });

      if (result.recommendedPOs.length >= 6) break; // Quality rule: at most 6 POs
    }
  }

  // 3. Process RSCOE Department PSOs (Max 3, score >= 40, strictly verified against programmeSpecificOutcomes.json)
  if (Array.isArray(rawOutput.recommendedPSOs)) {
    const seenPSOs = new Set();
    for (const item of rawOutput.recommendedPSOs) {
      if (!item || typeof item !== 'object') continue;
      const rawId = String(item.psoId || item.id || '').toUpperCase().trim();
      if (!rawId || !psoMap.has(rawId) || seenPSOs.has(rawId)) continue;

      const officialPSO = psoMap.get(rawId);
      if (!officialPSO) continue;

      const score = Math.max(0, Math.min(100, parseInt(item.relevanceScore, 10) || 0));
      if (score < 40) continue; // Omit weak alignment (< 40)

      seenPSOs.add(rawId);
      result.recommendedPSOs.push({
        psoNumber: officialPSO.psoNumber,
        psoId: officialPSO.id,
        psoName: officialPSO.name || officialPSO.title,
        psoDescription: officialPSO.description,
        relevanceScore: score,
        reason: typeof item.reason === 'string' ? item.reason.trim() : 'Aligns with department programme specific outcome.',
        evidenceFromProject: typeof item.evidenceFromProject === 'string' ? item.evidenceFromProject.trim() : '',
        limitations: typeof item.limitations === 'string' && item.limitations.trim() ? item.limitations.trim() : null
      });

      if (result.recommendedPSOs.length >= 3) break;
    }
  }

  // Sort descending by relevance score
  result.recommendedSDGs.sort((a, b) => b.relevanceScore - a.relevanceScore);
  result.recommendedPOs.sort((a, b) => b.relevanceScore - a.relevanceScore);
  result.recommendedPSOs.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return result;
}

/**
 * Builds the evaluation prompt embedding project context and official reference data.
 * Reference catalogs are formatted concisely to optimize latency and token limits.
 */
function buildEvaluationPrompt(projectData) {
  const sdgCatalog = sdgData.map(s => ({
    number: s.sdgNumber,
    title: s.title,
    name: s.officialName,
    targets: s.targets.map(t => t.id)
  }));

  const poCatalog = poData.map(p => ({
    number: p.poNumber,
    id: p.id,
    name: p.title,
    def: p.description
  }));

  const psoCatalog = psoData.map(p => ({
    id: p.id,
    name: p.name || p.title,
    def: p.description
  }));

  return `You are an expert evaluator for undergraduate engineering projects at JSPM's Rajarshi Shahu College of Engineering (RSCOE).
Your task is to analyze the student project details below and recommend genuinely relevant UN Sustainable Development Goals (SDGs), NBA Programme Outcomes (POs), and Department Programme Specific Outcomes (PSOs).

### STUDENT PROJECT DETAILS:
- Title: ${projectData.title}
- Type: ${projectData.type}
- Domain: ${projectData.domain}
- Technologies: ${projectData.technologies.length > 0 ? projectData.technologies.join(', ') : 'Not specified'}
- Detailed Description:
"""
${projectData.description}
"""

### EVALUATION RULES:
1. Ground every recommendation strictly in the reference catalogs provided below.
2. Recommend ONLY outcomes that have clear, identifiable evidence in the project description.
3. QUALITY THRESHOLD:
   - 80–100: Strong alignment supported by direct project deliverables or core methodology.
   - 60–79: Good potential alignment with identifiable supporting evidence.
   - 40–59: Partial or conditional alignment requiring further student justification.
   - Omit any outcome with score < 40.
4. DO NOT recommend every item by default.
   - Return at most 5 SDGs, at most 6 POs, and at most 3 PSOs.
   - Return fewer or an empty list if none genuinely match.
5. DO NOT treat the mere use of generic software, tools, or web frameworks as sufficient evidence for an SDG.
6. For PO4 (Conduct Investigations of Complex Problems), recommend ONLY if the project involves meaningful modeling, experimental design, research analysis, or empirical interpretation.
7. PSO EVALUATION CRITERIA (Computer Engineering):
   - PSO1 (Software Systems and Computing): Recommend when software systems, algorithms, architectures, software engineering processes, and modern developer tools are actively designed, analyzed, or evaluated. The reasoning must reflect actual engineering work.
   - PSO2 (Intelligent and Emerging Technologies): Recommend ONLY when intelligent or emerging technologies (Artificial Intelligence, Machine Learning, Data Science, Cloud Computing, Cyber Security, etc.) are substantively applied in the solution.
   - PSO3 (Innovation, Research, and Entrepreneurship): Recommend ONLY when research methodologies, novel experimentation, validation of complex engineering problems, or entrepreneurial/commercialization aspects are supported by the project text. Do not claim research, security, or scalability without concrete evidence.
8. For SDGs, specify the exact target IDs (e.g. "13.1") matching the target catalog below. Do not invent targets.
9. If the mapping is conditional or depends on future work, explicitly note this in "limitations".

### REFERENCE DATA:

SDG CATALOG:
${JSON.stringify(sdgCatalog)}

NBA PROGRAMME OUTCOMES CATALOG:
${JSON.stringify(poCatalog)}

DEPARTMENT PROGRAMME SPECIFIC OUTCOMES CATALOG:
${JSON.stringify(psoCatalog)}

### RESPONSE FORMAT:
Respond with a strict JSON object with this exact structure:
{
  "recommendedSDGs": [
    {
      "sdgNumber": 1 to 17,
      "relevanceScore": 40 to 100,
      "reason": "concise explanation of why this goal aligns",
      "targetReferences": [
        { "id": "target ID from catalog, e.g. 3.4" }
      ],
      "evidenceFromProject": "specific feature, objective, or deliverable supporting this match",
      "limitations": "optional note if alignment is conditional"
    }
  ],
  "recommendedPOs": [
    {
      "poNumber": 1 to 11,
      "relevanceScore": 40 to 100,
      "reason": "explanation of alignment with this programme outcome",
      "evidenceFromProject": "specific engineering activity or deliverable supporting this match",
      "limitations": "optional note if alignment depends on unverified assumptions"
    }
  ],
  "recommendedPSOs": [
    {
      "psoId": "PSO1" or "PSO2" or "PSO3",
      "psoName": "exact official PSO name",
      "relevanceScore": 40 to 100,
      "reason": "concise explanation grounded in the project",
      "evidenceFromProject": "relevant project objective, functionality, research activity, or deliverable",
      "limitations": "optional explanation of conditional or uncertain alignment"
    }
  ]
}`;
}

/**
 * Core service function to generate AI recommendations using the Gemini API.
 */
export async function getRecommendations(payload, env = process.env) {
  // 1. Validate payload
  const validation = validateRecommendationInput(payload);
  if (!validation.valid) {
    return {
      status: 400,
      body: { error: validation.error }
    };
  }

  // 2. Validate API key
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return {
      status: 503,
      body: {
        error: 'AI Recommendation service is not configured. Server environment variable GEMINI_API_KEY is missing.',
        code: 'MISSING_API_KEY'
      }
    };
  }

  const configuredModel = env.GEMINI_MODEL?.trim();
  const primaryModel = (configuredModel && configuredModel !== 'gemini-2.5-flash')
    ? configuredModel
    : DEFAULT_GEMINI_MODEL;

  const candidateModels = Array.from(new Set([
    primaryModel,
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-3.1-flash-lite-preview'
  ].filter(Boolean)));

  const prompt = buildEvaluationPrompt(validation.data);

  let lastStatus = 502;
  let lastErrorMessage = 'Failed to communicate with the AI recommendation service.';
  let lastErrorCode = 'SERVICE_ERROR';

  for (let i = 0; i < candidateModels.length; i++) {
    const modelName = candidateModels[i];
    const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(35000), // 35s timeout safeguard
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.2,
            topP: 0.8,
            maxOutputTokens: 2048
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        let parsedErr = {};
        try { parsedErr = JSON.parse(errBody); } catch { /* ignore */ }

        // 401/403: Safe auth/credential error
        if (response.status === 401 || response.status === 403) {
          return {
            status: 403,
            body: {
              error: 'AI service configuration or authorization error. Please verify server API credentials.',
              code: 'AUTH_FAILED'
            }
          };
        }

        // 429: Quota or rate limit exceeded
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get('retry-after');
          const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;
          return {
            status: 429,
            body: {
              error: retryAfterSec
                ? `AI recommendation quota or rate limit reached. Please wait ${retryAfterSec} seconds before retrying.`
                : 'AI recommendation quota or rate limit reached. Please wait a moment before trying again.',
              code: 'RATE_LIMIT_EXCEEDED',
              retryAfter: retryAfterSec
            }
          };
        }

        // 404: Model not found or deprecated
        if (response.status === 404) {
          lastStatus = 502;
          lastErrorCode = 'MODEL_NOT_FOUND';
          lastErrorMessage = `The configured AI model (${modelName}) is unavailable or deprecated.`;
          continue; // Try next candidate model
        }

        // 503 / 5xx: Service temporary unavailable / high demand
        if (response.status === 503 || response.status >= 500) {
          lastStatus = 503;
          lastErrorCode = 'SERVICE_UNAVAILABLE';
          lastErrorMessage = 'The AI model is experiencing temporary high demand across service endpoints. Please click Retry in a few moments.';
          
          // If there are more candidate models, wait briefly with backoff before switching
          if (i < candidateModels.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          continue;
        }

        lastStatus = 502;
        lastErrorCode = 'PROVIDER_ERROR';
        lastErrorMessage = parsedErr?.error?.message || `AI provider returned error (${response.status}).`;
        continue;
      }

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText) {
        lastStatus = 502;
        lastErrorCode = 'EMPTY_RESPONSE';
        lastErrorMessage = 'AI provider returned an empty recommendation response.';
        continue;
      }

      let parsedOutput;
      try {
        parsedOutput = JSON.parse(candidateText);
      } catch {
        // Strip code fences if present
        const cleaned = candidateText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
        parsedOutput = JSON.parse(cleaned);
      }

      // Authoritative sanitization and ground-truth enforcement
      const recommendations = sanitizeModelRecommendations(parsedOutput);

      return {
        status: 200,
        body: {
          success: true,
          projectSummary: {
            title: validation.data.title,
            type: validation.data.type,
            domain: validation.data.domain
          },
          recommendations
        }
      };
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        lastStatus = 504;
        lastErrorCode = 'GATEWAY_TIMEOUT';
        lastErrorMessage = 'AI recommendation request timed out after 35 seconds. Please click Retry to re-evaluate.';
        continue;
      }
      console.error(`[AI Recommendation] Attempt with ${modelName} failed:`, err.message);
      lastStatus = 500;
      lastErrorCode = 'INTERNAL_NETWORK_ERROR';
      lastErrorMessage = 'A network error occurred while communicating with the AI service. Please click Retry.';
    }
  }

  return {
    status: lastStatus,
    body: {
      error: lastErrorMessage,
      code: lastErrorCode
    }
  };
}
