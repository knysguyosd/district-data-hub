import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dna, Play, RotateCcw, Settings, CheckCircle2, ChevronRight,
  TrendingUp, TrendingDown, Info, Home, Pause, GitBranch,
  Skull, Sprout, Zap, Mountain, Droplets, Thermometer,
  Bug, FlaskConical, TreePine, Sun, Waves, Snowflake,
  BarChart3, Activity, Clock, AlertTriangle
} from 'lucide-react';

// ─── Constants ───
const ENV_TYPES = {
  TEMPERATE: { name: "Temperate Forest", temp: 15, moisture: 70, resources: 80, icon: <TreePine className="w-6 h-6 text-green-600" />, color: "bg-green-50 border-green-200 text-green-900", accent: "green" },
  TROPICAL: { name: "Tropical Rainforest", temp: 28, moisture: 95, resources: 95, icon: <Droplets className="w-6 h-6 text-emerald-600" />, color: "bg-emerald-50 border-emerald-200 text-emerald-900", accent: "emerald" },
  ARID: { name: "Arid Desert", temp: 35, moisture: 10, resources: 25, icon: <Sun className="w-6 h-6 text-amber-600" />, color: "bg-amber-50 border-amber-200 text-amber-900", accent: "amber" },
  TUNDRA: { name: "Arctic Tundra", temp: -5, moisture: 30, resources: 30, icon: <Snowflake className="w-6 h-6 text-sky-600" />, color: "bg-sky-50 border-sky-200 text-sky-900", accent: "sky" },
  AQUATIC: { name: "Freshwater Lake", temp: 18, moisture: 100, resources: 70, icon: <Waves className="w-6 h-6 text-blue-600" />, color: "bg-blue-50 border-blue-200 text-blue-900", accent: "blue" },
};

const EVENTS = [
  { id: "drought", name: "Severe Drought", icon: <Sun className="w-5 h-5" />, desc: "Water sources dry up, moisture drops sharply", effect: { moisture: -40, resources: -30, temp: 5 }, rate: "gradual", duration: 8, rateColor: "text-amber-600 bg-amber-50" },
  { id: "flood", name: "Major Flooding", icon: <Waves className="w-5 h-5" />, desc: "Catastrophic flooding reshapes the landscape", effect: { moisture: 40, resources: -20, temp: -2 }, rate: "rapid", duration: 4, rateColor: "text-red-600 bg-red-50" },
  { id: "deforestation", name: "Deforestation", icon: <TreePine className="w-5 h-5" />, desc: "Habitat loss from clearing of vegetation", effect: { resources: -45, moisture: -15, temp: 3 }, rate: "gradual", duration: 12, rateColor: "text-amber-600 bg-amber-50" },
  { id: "volcano", name: "Volcanic Eruption", icon: <Mountain className="w-5 h-5" />, desc: "Massive eruption blankets the region in ash", effect: { temp: -8, resources: -50, moisture: -10 }, rate: "rapid", duration: 6, rateColor: "text-red-600 bg-red-50" },
  { id: "barrier", name: "Geographic Barrier", icon: <GitBranch className="w-5 h-5" />, desc: "Mountain range or river divides the population", effect: { resources: -5 }, rate: "rapid", duration: 100, special: "split", rateColor: "text-violet-600 bg-violet-50" },
  { id: "climate", name: "Climate Warming", icon: <Thermometer className="w-5 h-5" />, desc: "Gradual temperature increase over time", effect: { temp: 12, moisture: -20, resources: -15 }, rate: "gradual", duration: 20, rateColor: "text-amber-600 bg-amber-50" },
  { id: "invasive", name: "Invasive Species", icon: <Bug className="w-5 h-5" />, desc: "New competitor enters the ecosystem", effect: { resources: -35 }, rate: "gradual", duration: 10, rateColor: "text-amber-600 bg-amber-50" },
  { id: "fertilizer", name: "Fertilizer Runoff", icon: <FlaskConical className="w-5 h-5" />, desc: "Nutrient pollution alters the ecosystem", effect: { resources: 15, moisture: 5, temp: 1 }, rate: "gradual", duration: 8, rateColor: "text-amber-600 bg-amber-50" },
];

const SPECIES_COLORS = [
  "#6366f1", "#ef4444", "#22c55e", "#eab308", "#a855f7",
  "#f97316", "#06b6d4", "#ec4899", "#84cc16", "#8b5cf6",
  "#14b8a6", "#f43f5e", "#0ea5e9", "#d946ef", "#10b981",
];
const TRAIT_NAMES = ["size", "speed", "camouflage", "diet", "thermoReg"];

// ─── Helpers ───
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function randRange(lo, hi) { return lo + Math.random() * (hi - lo); }
function gaussRand() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

function generateSpeciesName() {
  const p1 = ["Avi","Flor","Herb","Sylv","Aqua","Terr","Nox","Lum","Cryo","Igni","Verd","Aur","Umbr","Zyg","Morph"];
  const p2 = ["alis","opus","ensis","idae","odon","urus","ella","aria","ipes","ornis","actyl","ophis","anth","mera","cola"];
  return p1[Math.floor(Math.random()*p1.length)] + p2[Math.floor(Math.random()*p2.length)];
}

function createSpecies(id, parentTraits, colorIdx, generation) {
  const traits = {};
  TRAIT_NAMES.forEach(t => {
    traits[t] = parentTraits ? clamp(parentTraits[t] + gaussRand() * 15, 0, 100) : randRange(20, 80);
  });
  return { id, name: generateSpeciesName(), traits, population: parentTraits ? 30 : 60, maxPop: 120, colorIdx: colorIdx % SPECIES_COLORS.length, generation, alive: true, extinctAt: null, parentId: parentTraits ? id - 1 : null, fitness: 50, popHistory: parentTraits ? [0, 0, 30] : [60] };
}

function calcFitness(species, env) {
  const t = species.traits;
  let f = 50;
  const optTemp = 50 + (env.temp - 15) * 1.5;
  f -= Math.abs(t.thermoReg - optTemp) * 0.3;
  f += (t.camouflage * env.resources / 100) * 0.2;
  f += (t.diet * env.moisture / 100) * 0.15;
  f += (env.resources / 100) * 20;
  f += (t.speed * 0.1);
  return clamp(f, 5, 95);
}

// ─── Custom SVG Line Chart (matching reference style) ───
const LineChart = ({ speciesList, maxGen }) => {
  if (!speciesList || speciesList.length === 0) return null;
  const width = 600, height = 260, padding = 40;
  const drawW = width - padding * 2, drawH = height - padding * 2;
  const maxY = 130;
  const getX = (g) => padding + (g / Math.max(maxGen, 1)) * drawW;
  const getY = (v) => height - padding - (Math.min(v, maxY) / maxY) * drawH;

  const xLabels = [];
  const step = Math.max(1, Math.floor(maxGen / 5));
  for (let i = 0; i <= maxGen; i += step) xLabels.push(i);
  if (xLabels[xLabels.length - 1] !== maxGen && maxGen > 0) xLabels.push(maxGen);

  return (
    <div className="w-full flex flex-col items-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-3xl bg-white rounded-xl shadow-sm border border-slate-200">
        {[0, 30, 60, 90, 120].map(val => (
          <g key={`grid-${val}`}>
            <line x1={padding} y1={getY(val)} x2={width - padding} y2={getY(val)} stroke="#e2e8f0" strokeDasharray="4 4" />
            <text x={padding - 10} y={getY(val) + 4} textAnchor="end" fontSize="10" fill="#64748b">{val}</text>
          </g>
        ))}
        {xLabels.map(g => (
          <text key={`x-${g}`} x={getX(g)} y={height - padding + 15} textAnchor="middle" fontSize="10" fill="#64748b">Gen {g}</text>
        ))}
        <text x={padding - 10} y={padding - 10} textAnchor="start" fontSize="9" fill="#94a3b8" fontWeight="600">POPULATION</text>
        {speciesList.map(sp => {
          if (sp.popHistory.length < 2) return null;
          const startGen = sp.generation;
          const pts = sp.popHistory.map((v, i) => `${getX(startGen + i)},${getY(v)}`).join(' ');
          return (
            <polyline key={sp.id} points={pts} fill="none" stroke={SPECIES_COLORS[sp.colorIdx]}
              strokeWidth={sp.alive ? "2.5" : "1.5"} strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={sp.alive ? "none" : "4 3"} opacity={sp.alive ? 1 : 0.4}
            />
          );
        })}
      </svg>
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {speciesList.map(sp => (
          <div key={sp.id} className={`flex items-center gap-2 text-sm font-medium ${sp.alive ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SPECIES_COLORS[sp.colorIdx] }} />
            {sp.name}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Phylogenetic Tree SVG ───
const PhyloTree = ({ species, currentGen }) => {
  const w = 500, h = 200;
  const all = species;
  if (all.length === 0) return null;
  const maxGen = Math.max(currentGen, 1);
  const yScale = Math.min(30, (h - 40) / Math.max(all.length, 1));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full bg-white rounded-xl shadow-sm border border-slate-200">
      <line x1={40} y1={h - 15} x2={w - 15} y2={h - 15} stroke="#e2e8f0" strokeWidth={1} />
      <text x={40} y={h - 4} fontSize="9" fill="#94a3b8">Gen 0</text>
      <text x={w - 50} y={h - 4} fontSize="9" fill="#94a3b8">Gen {currentGen}</text>
      {all.map((sp, i) => {
        const y = 20 + i * yScale;
        const x1 = 40 + (sp.generation / maxGen) * (w - 65);
        const x2 = sp.alive ? w - 15 : 40 + ((sp.extinctAt || currentGen) / maxGen) * (w - 65);
        const col = SPECIES_COLORS[sp.colorIdx];
        return (
          <g key={sp.id}>
            {sp.parentId !== null && (() => {
              const pIdx = all.findIndex(s => s.id === sp.parentId);
              if (pIdx < 0) return null;
              const py = 20 + pIdx * yScale;
              const px = x1;
              return <line x1={px} y1={py} x2={px} y2={y} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3,3" />;
            })()}
            <line x1={x1} y1={y} x2={x2} y2={y} stroke={col} strokeWidth={sp.alive ? 3 : 1.5} opacity={sp.alive ? 0.8 : 0.3} strokeLinecap="round" />
            {!sp.alive && <circle cx={x2} cy={y} r={4} fill="none" stroke="#ef4444" strokeWidth={2} opacity={0.5} />}
            {sp.alive && <circle cx={x2} cy={y} r={4} fill={col} opacity={0.9} />}
            <text x={x1 + 5} y={y - 7} fill={col} fontSize="8" fontWeight="600" opacity={sp.alive ? 0.8 : 0.35}>{sp.name}</text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Event Log Component ───
const EventLog = ({ log }) => {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [log]);
  return (
    <div ref={ref} className="h-40 overflow-y-auto bg-slate-50 rounded-lg border border-slate-100 p-3 text-xs font-mono space-y-1">
      {log.length === 0 && <span className="text-slate-400">Events will appear here...</span>}
      {log.map((e, i) => (
        <div key={i} style={{ color: e.color || '#64748b' }}>
          <span className="text-slate-400">[Gen {e.gen}]</span> {e.text}
        </div>
      ))}
    </div>
  );
};

// ─── Reflection Prompts ───
const REFLECTIONS = [
  { min: 0, max: 10, text: "Observe the starting conditions. How does this ecosystem's temperature, moisture, and resources affect your founding species' initial fitness?" },
  { min: 11, max: 30, text: "Try introducing both a rapid event (like flooding) and a gradual event (like climate warming). How do the populations respond differently to the rate of change?" },
  { min: 31, max: 60, text: "What conditions led to speciation events? What conditions caused extinctions? What patterns do you notice in the phylogenetic tree?" },
  { min: 61, max: 9999, text: "Using your population graph and phylogenetic tree as evidence, construct an argument: How does the rate of environmental change affect species diversity differently than the magnitude of change?" },
];

// ═══════════════════════════════════════
// MAIN APPLICATION
// ═══════════════════════════════════════
export default function SpeciationSimulator() {
  const [phase, setPhase] = useState('select'); // select | brief | simulate | analyze
  const [envKey, setEnvKey] = useState(null);
  const [env, setEnv] = useState(null);
  const [species, setSpecies] = useState([]);
  const [generation, setGeneration] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [activeEvents, setActiveEvents] = useState([]);
  const [eventLog, setEventLog] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [totalSpeciated, setTotalSpeciated] = useState(0);
  const [totalExtinct, setTotalExtinct] = useState(0);
  const [diversityHistory, setDiversityHistory] = useState([]);

  const intervalRef = useRef(null);
  const stateRef = useRef({ species, env, activeEvents, generation, nextId, eventLog, totalSpeciated, totalExtinct, diversityHistory });

  useEffect(() => {
    stateRef.current = { species, env, activeEvents, generation, nextId, eventLog, totalSpeciated, totalExtinct, diversityHistory };
  });

  const addLog = useCallback((text, color) => {
    setEventLog(prev => [...prev.slice(-80), { gen: stateRef.current.generation, text, color }]);
  }, []);

  const initialize = useCallback((ek) => {
    const base = { ...ENV_TYPES[ek] };
    setEnv(base);
    setEnvKey(ek);
    const s1 = createSpecies(0, null, 0, 0);
    setSpecies([s1]);
    setNextId(1);
    setGeneration(0);
    setActiveEvents([]);
    setEventLog([]);
    setTotalSpeciated(0);
    setTotalExtinct(0);
    setDiversityHistory([1]);
    setPaused(false);
  }, []);

  const triggerEvent = useCallback((evt) => {
    setActiveEvents(prev => [...prev, { ...evt, remaining: evt.duration }]);
    addLog(`${evt.name}: ${evt.desc}`, '#6366f1');
    if (evt.special === 'split') {
      const s = stateRef.current;
      const living = s.species.filter(sp => sp.alive && sp.population > 20);
      if (living.length > 0) {
        const target = living[Math.floor(Math.random() * living.length)];
        const nid = s.nextId;
        const child = createSpecies(nid, target.traits, nid, s.generation);
        child.parentId = target.id;
        child.population = Math.floor(target.population * 0.4);
        target.population = Math.ceil(target.population * 0.6);
        setSpecies(prev => [...prev, child]);
        setNextId(nid + 1);
        setTotalSpeciated(prev => prev + 1);
        addLog(`Population split! ${target.name} → ${child.name}`, '#a855f7');
      }
    }
  }, [addLog]);

  const tick = useCallback(() => {
    const s = stateRef.current;
    const gen = s.generation + 1;
    setGeneration(gen);

    let newEnv = { ...s.env };
    let newActive = s.activeEvents.map(e => ({ ...e, remaining: e.remaining - 1 })).filter(e => e.remaining > 0);
    s.activeEvents.forEach(evt => {
      if (evt.remaining > 0) {
        const factor = evt.rate === 'rapid' ? 1 : 1 / evt.duration;
        if (evt.effect.temp) newEnv.temp += evt.effect.temp * factor;
        if (evt.effect.moisture) newEnv.moisture = clamp(newEnv.moisture + evt.effect.moisture * factor, 0, 100);
        if (evt.effect.resources) newEnv.resources = clamp(newEnv.resources + evt.effect.resources * factor, 2, 100);
      }
    });
    const base = ENV_TYPES[envKey];
    newEnv.temp += (base.temp - newEnv.temp) * 0.01;
    newEnv.moisture += (base.moisture - newEnv.moisture) * 0.008;
    newEnv.resources += (base.resources - newEnv.resources) * 0.005;
    setEnv(newEnv);
    setActiveEvents(newActive);

    let sps = s.species.map(sp => ({ ...sp }));
    let nid = s.nextId;
    let newSpeciations = 0, newExtinctions = 0;
    const newSpecies = [];

    sps.forEach(sp => {
      if (!sp.alive) return;
      sp.fitness = calcFitness(sp, newEnv);
      const growthRate = (sp.fitness - 45) / 200;
      const noise = gaussRand() * 3;
      const capPressure = sp.population > sp.maxPop * 0.8 ? -((sp.population - sp.maxPop * 0.8) / sp.maxPop) * 8 : 0;
      sp.population = Math.max(0, Math.round(sp.population + sp.population * growthRate + noise + capPressure));
      sp.population = Math.min(sp.population, sp.maxPop);
      sp.popHistory = [...sp.popHistory, sp.population];
      if (sp.popHistory.length > 80) sp.popHistory = sp.popHistory.slice(-80);

      if (sp.population <= 0) {
        sp.alive = false; sp.population = 0; sp.extinctAt = gen; newExtinctions++;
        addLog(`${sp.name} has gone extinct!`, '#ef4444');
      }
      if (sp.alive && sp.population > 50 && sp.fitness > 40 && Math.random() < 0.008 && sps.filter(x => x.alive).length < 10) {
        const child = createSpecies(nid, sp.traits, nid, gen);
        child.parentId = sp.id;
        child.population = Math.floor(sp.population * 0.3);
        sp.population = Math.ceil(sp.population * 0.7);
        newSpecies.push(child); nid++; newSpeciations++;
        addLog(`Speciation! ${sp.name} → ${child.name}`, '#22c55e');
      }
      TRAIT_NAMES.forEach(t => { sp.traits[t] = clamp(sp.traits[t] + gaussRand() * 0.5, 0, 100); });
    });

    const finalSpecies = [...sps, ...newSpecies];
    setSpecies(finalSpecies);
    setNextId(nid);
    setTotalSpeciated(prev => prev + newSpeciations);
    setTotalExtinct(prev => prev + newExtinctions);
    setDiversityHistory(prev => {
      const h = [...prev, finalSpecies.filter(x => x.alive).length];
      return h.length > 80 ? h.slice(-80) : h;
    });

    if (finalSpecies.filter(x => x.alive).length === 0) {
      addLog('TOTAL EXTINCTION — All species have perished.', '#ef4444');
    }
  }, [envKey, addLog]);

  useEffect(() => {
    if (phase === 'simulate' && !paused) {
      intervalRef.current = setInterval(tick, 1200 / speed);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, paused, speed, tick]);

  const resetToHome = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('select'); setEnvKey(null); setEnv(null);
  };

  const aliveSpecies = species.filter(s => s.alive);
  const totalPop = aliveSpecies.reduce((s, sp) => s + sp.population, 0);
  const currentReflection = REFLECTIONS.find(r => generation >= r.min && generation <= r.max) || REFLECTIONS[REFLECTIONS.length - 1];

  // ─── Phase Stepper ───
  const renderPhases = () => {
    const phases = [
      { id: 'select', label: 'Select' },
      { id: 'brief', label: 'Briefing' },
      { id: 'simulate', label: 'Simulate' },
      { id: 'analyze', label: 'Analyze' },
    ];
    const currentIndex = phases.findIndex(p => p.id === phase);
    return (
      <div className="flex items-center justify-center w-full max-w-2xl mx-auto mb-8">
        {phases.map((p, i) => (
          <React.Fragment key={p.id}>
            <div className={`flex flex-col items-center ${i <= currentIndex ? 'text-indigo-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                i < currentIndex ? 'bg-indigo-600 text-white border-indigo-600' :
                i === currentIndex ? 'border-indigo-600 text-indigo-600 bg-indigo-50' :
                'border-slate-300 text-slate-400'
              }`}>
                {i < currentIndex ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              <span className="text-xs font-semibold mt-1 uppercase tracking-wider">{p.label}</span>
            </div>
            {i < phases.length - 1 && (
              <div className={`flex-1 h-1 mx-2 rounded ${i < currentIndex ? 'bg-indigo-600' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-sm">
              <Dna className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Speciation & Extinction Simulator</h1>
              <p className="text-sm font-medium text-slate-500">BIO.4.4 Environmental Change & Species Diversity</p>
            </div>
          </div>
          {phase !== 'select' && (
            <button onClick={resetToHome} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors">
              <Home className="w-4 h-4" /> Home
            </button>
          )}
        </header>

        {renderPhases()}

        {/* ═══ SELECT PHASE ═══ */}
        {phase === 'select' && (
          <div>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-800 mb-3">Choose a Starting Ecosystem</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Each ecosystem has different baseline conditions for temperature, moisture, and resources. These will affect how species survive and evolve when you introduce environmental changes.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {Object.entries(ENV_TYPES).map(([key, val]) => (
                <div key={key} onClick={() => { setEnvKey(key); initialize(key); setPhase('brief'); }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all group"
                >
                  <div className={`inline-block p-3 rounded-xl mb-4 border ${val.color}`}>
                    {val.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{val.name}</h3>
                  <div className="space-y-1 text-sm text-slate-500 mb-4">
                    <p>Temperature: <span className="font-semibold text-slate-700">{val.temp}°C</span></p>
                    <p>Moisture: <span className="font-semibold text-slate-700">{val.moisture}%</span></p>
                    <p>Resources: <span className="font-semibold text-slate-700">{val.resources}%</span></p>
                  </div>
                  <div className="flex items-center text-indigo-600 font-semibold text-sm">
                    Select Ecosystem <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ BRIEFING PHASE ═══ */}
        {phase === 'brief' && env && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-4 rounded-xl border ${ENV_TYPES[envKey].color}`}>
                {ENV_TYPES[envKey].icon}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-800">{ENV_TYPES[envKey].name}</h2>
                <p className="text-slate-500 font-medium">Mission Briefing</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-500" /> The Scenario
                </h3>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                  A founding species has established itself in this {ENV_TYPES[envKey].name.toLowerCase()} ecosystem. Your task is to observe what happens to this population as you introduce environmental changes of different types and rates. Will the species adapt, diversify, or go extinct?
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Observation Goals
                </h3>
                <ul className="space-y-3 bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                  {[
                    "Observe how gradual vs. rapid environmental changes affect populations differently.",
                    "Identify conditions that cause speciation (new species emerging).",
                    "Identify conditions that cause extinction.",
                    "Build an evidence-based argument using population data and the phylogenetic tree."
                  ].map((goal, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-sm text-indigo-800 flex items-start gap-3 mb-8">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <p><strong>Standard BIO.4.4:</strong> Engage in argument from evidence that changes in environmental conditions may cause increases in the number of individuals of some species, the emergence of new species over time, and/or the extinction of other species. Emphasize cause and effect relationships for how changes and the rate of change to the environment affect distribution or disappearance of traits.</p>
            </div>
            <div className="flex justify-end pt-6 border-t border-slate-100">
              <button onClick={() => setPhase('simulate')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
                Start Simulation <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ═══ SIMULATION PHASE ═══ */}
        {phase === 'simulate' && env && (
          <div className="space-y-6">

            {/* Controls Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">Generation</span>
                    <span className="text-2xl font-black text-indigo-600">{generation}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                      <Sprout className="w-4 h-4" /> {totalSpeciated} speciated
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-red-500">
                      <Skull className="w-4 h-4" /> {totalExtinct} extinct
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <Activity className="w-4 h-4" /> {aliveSpecies.length} alive
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPaused(!paused)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      paused ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}>
                    {paused ? <><Play className="w-4 h-4" /> Resume</> : <><Pause className="w-4 h-4" /> Pause</>}
                  </button>
                  <select value={speed} onChange={e => setSpeed(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 bg-white">
                    <option value={0.5}>0.5×</option>
                    <option value={1}>1×</option>
                    <option value={2}>2×</option>
                    <option value={4}>4×</option>
                  </select>
                  <button onClick={() => setPhase('analyze')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors">
                    <BarChart3 className="w-4 h-4" /> Analyze
                  </button>
                </div>
              </div>
            </div>

            {/* Environment Status */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  {ENV_TYPES[envKey].icon} {ENV_TYPES[envKey].name} — Current Conditions
                </h3>
                {activeEvents.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-amber-600">{activeEvents.length} active event{activeEvents.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Temperature", value: `${env.temp.toFixed(1)}°C`, pct: clamp((env.temp + 10) / 50 * 100, 0, 100), color: env.temp > 25 ? '#ef4444' : env.temp < 5 ? '#3b82f6' : '#eab308' },
                  { label: "Moisture", value: `${env.moisture.toFixed(0)}%`, pct: env.moisture, color: env.moisture > 60 ? '#06b6d4' : '#f97316' },
                  { label: "Resources", value: `${env.resources.toFixed(0)}%`, pct: env.resources, color: env.resources > 50 ? '#22c55e' : '#ef4444' },
                ].map(m => (
                  <div key={m.label} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{m.label}</span>
                      <span className="text-lg font-black" style={{ color: m.color }}>{m.value}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left: Population Chart + Species Cards */}
              <div className="lg:col-span-2 space-y-6">
                {/* Population Chart */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" /> Population Over Time
                  </h3>
                  {species.length > 0 ? (
                    <LineChart speciesList={species} maxGen={generation} />
                  ) : (
                    <p className="text-slate-400 text-center py-10">Waiting for data...</p>
                  )}
                </div>

                {/* Species Cards */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Dna className="w-5 h-5 text-indigo-600" /> Living Species ({aliveSpecies.length}) · Total Population: {totalPop}
                  </h3>
                  {aliveSpecies.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">All species extinct. Reset to try again.</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {aliveSpecies.map(sp => {
                        const col = SPECIES_COLORS[sp.colorIdx];
                        return (
                          <div key={sp.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col }} />
                                <span className="font-bold text-slate-800">{sp.name}</span>
                              </div>
                              <span className="text-sm font-semibold text-slate-600">Pop: {sp.population}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs font-semibold text-slate-500 w-12">Fitness</span>
                              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{
                                  width: `${sp.fitness}%`,
                                  backgroundColor: sp.fitness > 60 ? '#22c55e' : sp.fitness > 35 ? '#eab308' : '#ef4444'
                                }} />
                              </div>
                              <span className="text-xs font-bold text-slate-600 w-8 text-right">{sp.fitness.toFixed(0)}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {TRAIT_NAMES.map(t => (
                                <span key={t} className="text-xs font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500">
                                  {t.slice(0, 4)}: {sp.traits[t].toFixed(0)}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Event Triggers */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-600" /> Introduce Environmental Events
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">Trigger changes to observe how populations respond. Compare <span className="font-semibold text-amber-600">gradual</span> vs. <span className="font-semibold text-red-600">rapid</span> rates of change.</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {EVENTS.map(evt => {
                      const isActive = activeEvents.some(e => e.id === evt.id);
                      return (
                        <button key={evt.id} onClick={() => !isActive && triggerEvent(evt)} disabled={isActive}
                          className={`text-left p-4 rounded-xl border transition-all ${
                            isActive
                              ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                              : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm cursor-pointer'
                          }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-slate-600">{evt.icon}</span>
                            <span className="font-bold text-slate-800 text-sm">{evt.name}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${evt.rateColor}`}>
                              {evt.rate}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{evt.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Phylogenetic Tree */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-indigo-600" /> Phylogenetic Tree
                  </h3>
                  <PhyloTree species={species} currentGen={generation} />
                </div>

                {/* Event Log */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" /> Event Log
                  </h3>
                  <EventLog log={eventLog} />
                </div>

                {/* Reflection */}
                <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5">
                  <h3 className="font-bold text-indigo-800 mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5 text-indigo-500" /> Reflection Prompt
                  </h3>
                  <p className="text-sm text-indigo-700 leading-relaxed">{currentReflection.text}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ ANALYZE PHASE ═══ */}
        {phase === 'analyze' && env && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-indigo-600" /> Simulation Analysis — Generation {generation}
                </h2>
                <button onClick={() => setPhase('simulate')}
                  className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-bold hover:bg-indigo-200 transition-colors flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Continue Simulation
                </button>
              </div>
              <LineChart speciesList={species} maxGen={generation} />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Summary Stats */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Summary Statistics</h3>
                <div className="space-y-3">
                  {[
                    { label: "Total Species Generated", value: species.length, icon: <Dna className="w-4 h-4 text-indigo-500" /> },
                    { label: "Currently Alive", value: aliveSpecies.length, icon: <Sprout className="w-4 h-4 text-emerald-500" /> },
                    { label: "Speciation Events", value: totalSpeciated, icon: <GitBranch className="w-4 h-4 text-violet-500" /> },
                    { label: "Extinction Events", value: totalExtinct, icon: <Skull className="w-4 h-4 text-red-500" /> },
                    { label: "Total Population", value: totalPop, icon: <Activity className="w-4 h-4 text-blue-500" /> },
                    { label: "Generations Elapsed", value: generation, icon: <Clock className="w-4 h-4 text-slate-500" /> },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {s.icon}
                        <span className="font-semibold text-slate-700 text-sm">{s.label}</span>
                      </div>
                      <span className="text-xl font-black text-slate-800">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phylo + Reflection */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-indigo-600" /> Phylogenetic Tree
                  </h3>
                  <PhyloTree species={species} currentGen={generation} />
                </div>

                <div className="bg-yellow-50 rounded-2xl border border-yellow-100 p-5">
                  <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5 text-yellow-600" /> Analysis Questions
                  </h3>
                  <ul className="space-y-3 text-sm text-yellow-800">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 shrink-0" />
                      Which environmental events caused the most extinction? Were they rapid or gradual?
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 shrink-0" />
                      What conditions led to the emergence of new species? What role did geographic barriers play?
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 shrink-0" />
                      Using the population graph and phylogenetic tree as evidence, how does the <em>rate</em> of environmental change affect species diversity?
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 shrink-0" />
                      Could any species have been saved? What would you change if you ran the simulation again?
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Event History */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" /> Full Event Log
              </h3>
              <EventLog log={eventLog} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
