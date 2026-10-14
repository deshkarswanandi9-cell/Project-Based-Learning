export const SDG_GOALS = [
  { id:1,  title:'No Poverty',              color:'#E5243B', desc:'End poverty in all its forms everywhere by providing social protection and equal access to resources.' },
  { id:2,  title:'Zero Hunger',             color:'#DDA63A', desc:'End hunger, achieve food security and improved nutrition, and promote sustainable agriculture.' },
  { id:3,  title:'Good Health & Well-Being',color:'#4C9F38', desc:'Ensure healthy lives and promote well-being for all at all ages through universal healthcare.' },
  { id:4,  title:'Quality Education',       color:'#C5192D', desc:'Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all.' },
  { id:5,  title:'Gender Equality',         color:'#FF3A21', desc:'Achieve gender equality and empower all women and girls by ending discrimination and violence.' },
  { id:6,  title:'Clean Water & Sanitation',color:'#26BDE2', desc:'Ensure availability and sustainable management of clean water and sanitation for all communities.' },
  { id:7,  title:'Affordable & Clean Energy',color:'#FCC30B', desc:'Ensure access to affordable, reliable, sustainable and modern energy for all by 2030.' },
  { id:8,  title:'Decent Work & Economic Growth',color:'#A21942', desc:'Promote sustained, inclusive and sustainable economic growth, full productive employment and decent work.' },
  { id:9,  title:'Industry Innovation & Infrastructure',color:'#FD6925', desc:'Build resilient infrastructure, promote inclusive industrialization and foster innovation for development.' },
  { id:10, title:'Reduced Inequalities',    color:'#DD1367', desc:'Reduce inequality within and among countries by empowering and promoting inclusion of all.' },
  { id:11, title:'Sustainable Cities',      color:'#FD9D24', desc:'Make cities and human settlements inclusive, safe, resilient and environmentally sustainable.' },
  { id:12, title:'Responsible Consumption', color:'#BF8B2E', desc:'Ensure sustainable consumption and production patterns that reduce waste and environmental impact.' },
  { id:13, title:'Climate Action',          color:'#3F7E44', desc:'Take urgent action to combat climate change and its impacts through education and policy.' },
  { id:14, title:'Life Below Water',        color:'#0A97D9', desc:'Conserve and sustainably use the oceans, seas and marine resources for sustainable development.' },
  { id:15, title:'Life On Land',            color:'#56C02B', desc:'Protect, restore and promote sustainable use of terrestrial ecosystems and halt biodiversity loss.' },
  { id:16, title:'Peace Justice & Institutions',color:'#00689D', desc:'Promote peaceful and inclusive societies, provide access to justice and build accountable institutions.' },
  { id:17, title:'Partnerships For Goals',  color:'#19486A', desc:'Strengthen the means of implementation and revitalize the global partnership for sustainable development.' },
];

export const PO_LIST = [
  { id:'PO1',  title:'Engineering Knowledge',
    desc:'Apply knowledge of mathematics, natural science, computing and engineering fundamentals to solve complex engineering problems.' },
  { id:'PO2',  title:'Problem Analysis',
    desc:'Identify, formulate, review research literature and analyze complex engineering problems reaching substantiated conclusions.' },
  { id:'PO3',  title:'Design/Development of Solutions',
    desc:'Design creative solutions for complex engineering problems considering public health, safety, cost, environment.' },
  { id:'PO4',  title:'Conduct Investigations of Complex Problems',
    desc:'Conduct investigations using research-based knowledge including design of experiments, modelling, analysis and interpretation.' },
  { id:'PO5',  title:'Engineering Tool Usage',
    desc:'Create, select and apply appropriate techniques, resources and modern engineering IT tools to solve complex problems.' },
  { id:'PO6',  title:'The Engineer and The World',
    desc:'Analyze and evaluate societal and environmental aspects while solving complex engineering problems for sustainability.' },
  { id:'PO7',  title:'Ethics',
    desc:'Apply ethical principles and commit to professional ethics, human values, diversity and adhere to national and international laws.' },
  { id:'PO8',  title:'Individual and Collaborative Team Work',
    desc:'Function effectively as an individual, and as a member or leader in diverse and multi-disciplinary teams.' },
  { id:'PO9',  title:'Communication',
    desc:'Communicate effectively within the engineering community and society -- reports, documentation, presentations.' },
  { id:'PO10', title:'Project Management and Finance',
    desc:'Apply engineering management principles and economic decision-making to manage projects in multidisciplinary environments.' },
  { id:'PO11', title:'Life-Long Learning',
    desc:'Recognize the need for independent and life-long learning, adaptability to new technologies and critical thinking.' },
];

export const PSO_LIST = [
  {
    id: 'PSO1',
    psoNumber: 1,
    title: 'Software Systems and Computing',
    desc: 'Graduates will be able to analyze, design, develop, and evaluate efficient software and computing systems by applying Computer Engineering fundamentals, software engineering principles, and modern development tools.'
  },
  {
    id: 'PSO2',
    psoNumber: 2,
    title: 'Intelligent and Emerging Technologies',
    desc: 'Graduates will be able to develop secure, scalable, and intelligent solutions using emerging technologies such as Artificial Intelligence, Data Science, Cloud Computing, Cyber Security and related emerging technologies.'
  },
  {
    id: 'PSO3',
    psoNumber: 3,
    title: 'Innovation, Research, and Entrepreneurship',
    desc: 'Graduates will be able to apply research methodologies, emerging technologies, and entrepreneurial skills to design, develop, and validate innovative computing solutions for complex engineering problems.'
  }
];

/**
 * Normalizes raw PSO input into a clean string array of PSO IDs (e.g., ['PSO1', 'PSO2']).
 * Safely handles string representations (JSON strings, Postgres array formats), arrays of objects, or empty inputs.
 */
export const normalizePsos = (rawPsos) => {
  if (!rawPsos) return [];
  if (Array.isArray(rawPsos)) {
    return rawPsos
      .map(p => (typeof p === 'object' && p !== null ? (p.id || p.pso) : String(p).trim()))
      .filter(Boolean);
  }
  if (typeof rawPsos === 'string') {
    const trimmed = rawPsos.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String).map(s => s.trim()).filter(Boolean);
      } catch { /* fallback */ }
    }
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed.slice(1, -1).split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    }
    return trimmed.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
};

/**
 * Resolves a PSO identifier (like 'PSO1', 'PSO2', '1', or { id: 'PSO1' }) to its official full catalog object.
 */
export const resolvePsoDetails = (psoInput) => {
  if (!psoInput) return null;
  const rawId = typeof psoInput === 'object' && psoInput !== null ? (psoInput.id || psoInput.pso) : String(psoInput).trim();
  const num = rawId.replace(/\D/g, '');
  const match = PSO_LIST.find(p => 
    p.id.toUpperCase() === rawId.toUpperCase() || 
    p.id === `PSO${num}` || 
    String(p.psoNumber) === num
  );
  if (match) {
    return {
      id: match.id,
      psoNumber: match.psoNumber,
      title: match.title,
      desc: match.desc
    };
  }
  return {
    id: rawId.startsWith('PSO') ? rawId : `PSO${rawId}`,
    psoNumber: num ? parseInt(num, 10) : null,
    title: rawId,
    desc: ''
  };
};


export const PROJECT_DOMAINS = [
  'AI/ML','Web Development','DevOps','IoT',
  'Cybersecurity','Data Science','Mobile App',
  'Cloud Computing','Blockchain','Other'
];
export const PROJECT_TYPES = [
  'Mini Project',
  'Micro Project',
  'Complex Engineering Problems',
  'Industry Sponsored',
  'Hackathon'
];
export const DEPARTMENTS    = ['Computer Engineering','Information Technology','ENTC Engineering','Mechanical Engineering','Civil Engineering','Electrical Engineering'];
export const YEARS          = ['1st Year','2nd Year','3rd Year','4th Year'];
export const SEMESTERS      = ['Sem I','Sem II','Sem III','Sem IV','Sem V','Sem VI','Sem VII','Sem VIII'];
export const ACADEMIC_YEARS = ['2023-24', '2024-25', '2025-26', '2026-27', '2026-2027'];

// Aliases for component imports
export const PROGRAMME_OUTCOMES = PO_LIST;
export const DOMAINS = PROJECT_DOMAINS;
