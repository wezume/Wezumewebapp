import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { Briefcase, Target, ChevronDown, Edit3, CheckCircle2, ArrowRight, ArrowLeft, User, X, Info } from 'lucide-react';
import CultureFitRadar from '../components/culture/CultureFitRadar';

const CultureFitScorer = () => {
  const navigate = useNavigate();
  const { userDetails } = useAppStore();
  // Industry Data
  const industryProfiles = {
    it_ites: { name: 'IT/ITES', target: [4, 4, 4, 5, 4], fit: 'Technical excellence, agile delivery, performance-focused.' },
    media_ent: { name: 'Media & Entertainment', target: [4, 5, 3, 5, 3], fit: 'Creative energy, audience-first, trend-setting.' },
    hospitality: { name: 'Hospitality', target: [3, 5, 5, 2, 4], fit: 'Service excellence, guest focus, warmth & connect.' },
    transport_aviation: { name: 'Transport & Aviation', target: [4, 3, 5, 3, 5], fit: 'Safety-first, operational precision, high-reliability.' },
    realestate_inf_const: { name: 'Real Estate, Infrastructure & Construction', target: [3, 4, 5, 2, 5], fit: 'Long-term value, quality-rigor, trust-driven.' },
    consumer_retail: { name: 'Consumer Goods, Retail & Ecommerce', target: [4, 5, 4, 3, 4], fit: 'Consumer-centric, speed-to-market, convenience-focussed.' },
    manufacturing_logistics: { name: 'Manufacturing & Logistics', target: [4, 2, 5, 2, 5], fit: 'Process-efficiency, precision-ops, safety-obsessed.' },
    energy_utilities: { name: 'Energy, Utilities & Public Sector', target: [3, 3, 5, 3, 4], fit: 'Stability-driven, public trust, infrastructural-excellence.' },
    healthcare_lifesciences: { name: 'Healthcare & Life Sciences', target: [4, 4, 5, 4, 5], fit: 'Patient-centricity, research-rigor, ethical-standard.' },
    professional_services: { name: 'Professional Services', target: [4, 5, 5, 3, 5], fit: 'Client-success, integrity-led, domain-expertise.' },
    startups: { name: 'Startups', target: [3, 2, 4, 5, 3], fit: 'Fast-paced, growth-obsessed, disruptive-innovation.' },
    education_edtech: { name: 'Education & Edtech', target: [5, 5, 4, 4, 3], fit: 'Learner-first, knowledge-driven, outcome-focused.' },
    bfsi: { name: 'BFSI (Banking, Financial Services & Insurance)', target: [3, 4, 5, 3, 5], fit: 'Security-critical, trust-based, financial-precision.' },
    others: { name: 'Others', target: [3, 3, 3, 3, 3], fit: 'Versatile, adaptable, cross-functional.' }
  };

  const roleDefinitions = {
    'hr': { name: 'HR', offset: [2, 1, 2, 0, 1] },
    'ops_finance': { name: 'Operating / Finance', offset: [0, 0, 2, 0, 2] },
    'sales_marketing': { name: 'Sales / Marketing', offset: [0, 1, 0, 2, 1] },
    'customer_support': { name: 'Customer Support', offset: [1, 2, 1, 0, 1] },
    'rnd': { name: 'R&D', offset: [0, 0, 1, 2, 2] }
  };

  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [currentTargets, setCurrentTargets] = useState([3, 3, 3, 3, 3]);
  const [customSectorName, setCustomSectorName] = useState('');
  const [isAccepted, setIsAccepted] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [dbScores, setDbScores] = useState({});
  const [candidateData, setCandidateData] = useState([]);
  const [dbRoles, setDbRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [industrySearchQuery, setIndustrySearchQuery] = useState('');
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [showRolePopup, setShowRolePopup] = useState(false);
  const [selectedRoleDetails, setSelectedRoleDetails] = useState(null);
  const [showNoIndustryModal, setShowNoIndustryModal] = useState(false);

  // Map profile industry string → industryProfiles key
  const mapProfileIndustry = (industry) => {
    if (!industry) return null;
    const s = industry.toLowerCase();
    if (s.includes('information technology') || s.includes('it/') || s.includes('it ')) return 'it_ites';
    if (s.includes('media') || s.includes('entertainment')) return 'media_ent';
    if (s.includes('hospitality')) return 'hospitality';
    if (s.includes('transport') || s.includes('aviation')) return 'transport_aviation';
    if (s.includes('real estate') || s.includes('construction') || s.includes('infrastructure')) return 'realestate_inf_const';
    if (s.includes('consumer') || s.includes('retail') || s.includes('e-commerce') || s.includes('ecommerce')) return 'consumer_retail';
    if (s.includes('manufacturing') || s.includes('logistics')) return 'manufacturing_logistics';
    if (s.includes('energy') || s.includes('utilities')) return 'energy_utilities';
    if (s.includes('healthcare') || s.includes('life science') || s.includes('pharma') || s.includes('biotech')) return 'healthcare_lifesciences';
    if (s.includes('professional') || s.includes('consulting')) return 'professional_services';
    if (s.includes('startup')) return 'startups';
    if (s.includes('education') || s.includes('edtech')) return 'education_edtech';
    if (s.includes('banking') || s.includes('finance') || s.includes('insurance') || s.includes('bfsi')) return 'bfsi';
    return 'others';
  };

  // Auto-fill industry from recruiter profile
  useEffect(() => {
    if (userDetails?.industry) {
      const key = mapProfileIndustry(userDetails.industry);
      setSelectedIndustry(key || 'others');
    } else {
      setShowNoIndustryModal(true);
    }
  }, [userDetails]);

  const functionalRoles = [
    { id: 'hr', name: 'HR' },
    { id: 'ops_finance', name: 'Operating / Finance' },
    { id: 'sales_marketing', name: 'Sales / Marketing' },
    { id: 'customer_support', name: 'Customer Support' },
    { id: 'rnd', name: 'R&D' }
  ];

  // Fetch candidates from backend
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        console.log("Fetching candidates from: http://localhost:8000/api/candidates");
        const response = await fetch('http://localhost:8000/api/candidates');
        if (response.ok) {
          const data = await response.json();
          console.log("Successfully fetched candidates:", data);
          setCandidateData(data);
        } else {
          console.error("Failed to fetch candidates. Status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching candidates:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  // Fetch roles from backend
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        console.log("Fetching roles from: http://localhost:8000/api/roles");
        const response = await fetch('http://localhost:8000/api/roles');
        if (response.ok) {
          const data = await response.json();
          console.log("Successfully fetched roles:", data);
          setDbRoles(data);
        } else {
          console.error("Failed to fetch roles. Status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };
    fetchRoles();
  }, []);

  // Fetch scores from backend
  useEffect(() => {
    const fetchScores = async () => {
      try {
        console.log("Fetching scores from: http://localhost:8000/api/scores");
        const response = await fetch('http://localhost:8000/api/scores');
        if (response.ok) {
          const data = await response.json();
          console.log("Successfully fetched scores:", data);
          // Map scores by candidateId for easy lookup
          const scoreMap = {};
          data.forEach(score => {
            scoreMap[score.candidateId] = {
              ...score,
              culturalScores: [
                score.normalizedTeamworkScore / 2,         // Teamwork
                score.normalizedCommunicationScore / 2,    // Excellence (Mapping closest: Communication)
                score.normalizedValuesAlignmentScore / 2, // Integrity (Mapping closest: Values)
                score.normalizedAdaptabilityScore / 2,    // Innovation (Mapping closest: Adaptability)
                score.normalizedOverallScore / 2          // Quality (Mapping closest: Overall)
              ]
            };
          });
          console.log("Processed score map:", scoreMap);
          setDbScores(scoreMap);
        } else {
          console.error("Failed to fetch scores. Status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching scores:", error);
      }
    };
    fetchScores();
  }, []);

  // Sync target scores when industry or role changes
  useEffect(() => {
    if (selectedIndustry) {
      let base = [3, 3, 3, 3, 3];

      if (industryProfiles[selectedIndustry]) {
        base = [...industryProfiles[selectedIndustry].target];
        setCustomSectorName('');
      }

      const modifier = selectedRole ? roleDefinitions[selectedRole].offset : [0, 0, 0, 0, 0];
      const adjusted = base.map((val, i) => Math.max(1, Math.min(5, val + modifier[i])));

      setCurrentTargets(adjusted);
      setIsAccepted(false);
      setSelectedCandidateId(null);
    }
  }, [selectedIndustry, selectedRole, dbRoles]);

  const updateTargetValue = (index, value) => {
    const newTargets = [...currentTargets];
    newTargets[index] = value;
    setCurrentTargets(newTargets);
    setIsAccepted(false);
  };

  // Helper Function
  const calculatePolygonArea = (radii) => {
    const angle = (2 * Math.PI) / radii.length;
    let area = 0;
    for (let i = 0; i < radii.length; i++) {
      area += 0.5 * radii[i] * radii[(i + 1) % radii.length] * Math.sin(angle);
    }
    return area;
  };

  // -- Candidate Calculation --
  const processedCandidates = useMemo(() => {
    if (!selectedIndustry) return [];

    const steadyRate = (val) => 1 - Math.abs(val - 0.5) * 2;

    return candidateData.map(c => {
      const dbScore = dbScores[c.id];

      if (dbScore) {
        const targetArea = calculatePolygonArea(currentTargets);
        const overlapRadii = dbScore.culturalScores.map((score, i) => Math.min(score, currentTargets[i]));
        const overlapArea = calculatePolygonArea(overlapRadii);
        let fitScore = targetArea > 0 ? (overlapArea / targetArea) * 100 : 0;
        fitScore = Math.min(100, Math.max(0, fitScore));

        return {
          ...c,
          culturalScores: dbScore.culturalScores,
          fitScore: fitScore,
          isAccepted: fitScore >= 70
        };
      }

      const v = c.inputValues;
      const teamwork = (0.20 * v.emotion) + (0.20 * v.smile) + (0.10 * v.eyeContact) + (0.25 * v.tone) + (0.25 * v.pitch);
      const excellenceValue = (0.25 * v.emotion) + (0.25 * v.smile) + (0.20 * v.tone) + (0.20 * steadyRate(v.speechRate)) + (0.10 * v.eyeContact);
      const integrity = (0.25 * v.emotion) + (0.25 * v.energy) + (0.25 * v.speechRate) + (0.25 * v.straightFace);
      const innovation = (0.30 * v.energy) + (0.30 * v.pitch) + (0.30 * v.speechRate) + (0.10 * v.emotion);
      const excellenceValueCalc = (0.25 * v.tone) + (0.25 * v.pitch) + (0.15 * v.straightFace) + (0.15 * v.eyeContact) + (0.15 * v.fillerWords) + (0.05 * v.energy); // Quality

      const rawScores = [teamwork, excellenceValue, integrity, innovation, excellenceValueCalc];
      const scaledScores = rawScores.map(score => Math.max(1, Math.min(5, 1 + (score * 4))));

      const targetArea = calculatePolygonArea(currentTargets);
      const overlapRadii = scaledScores.map((score, i) => Math.min(score, currentTargets[i]));
      const overlapArea = calculatePolygonArea(overlapRadii);

      let fitScore = targetArea > 0 ? (overlapArea / targetArea) * 100 : 0;
      fitScore = Math.min(100, Math.max(0, fitScore));

      return {
        ...c,
        culturalScores: scaledScores,
        fitScore: fitScore,
        isAccepted: fitScore >= 70
      };
    }).sort((a, b) => b.fitScore - a.fitScore);
  }, [candidateData, currentTargets, selectedIndustry, dbScores]);

  const filteredCandidates = useMemo(() => {
    return processedCandidates.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [processedCandidates, searchQuery]);

  const selectedCandidate = useMemo(() =>
    processedCandidates.find(c => c.id === selectedCandidateId),
    [selectedCandidateId, processedCandidates]);

  // -- Soft Curved Radar Chart Implementation --
  const RadarChartCustom = CultureFitRadar;

  return (
    <div className="min-h-screen w-full bg-[#fcfdfe] text-slate-800 font-sans flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 rounded-xl transition-all border border-slate-100 flex items-center gap-2 group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Back</span>
            </button>
            <div className="flex flex-col justify-center border-l border-slate-100 pl-4 py-1">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">Culture Fit</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-full lg:px-12 mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-6 sm:gap-8">

        {/* Main Workspace — industry auto-filled from profile */}
        <div className="flex flex-col gap-6 lg:gap-8">

          {/* Industry label + Role filter */}
          <div className="flex items-center justify-between px-2 flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold">
              <Target size={16} className="text-indigo-500" />
              <span>{selectedIndustry ? industryProfiles[selectedIndustry].name : (userDetails?.industry || 'Industry not set')}</span>
              <button onClick={() => navigate('/app/profile')} className="ml-1 text-indigo-500 hover:underline text-xs">(change in Profile)</button>
            </div>
            <div className="relative w-64">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-[13px] font-bold text-slate-800 shadow-sm flex items-center justify-between hover:border-indigo-300 hover:shadow-md transition-all focus:ring-4 focus:ring-indigo-500/10"
              >
                <div className="flex items-center gap-3">
                  <Briefcase size={18} className="text-slate-400" />
                  <span>{selectedRole ? functionalRoles.find(r => r.id === selectedRole)?.name : 'Role: None'}</span>
                </div>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isRoleDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="overflow-y-auto max-h-[300px] custom-scrollbar py-2">
                    <button onClick={() => { setSelectedRole(null); setIsRoleDropdownOpen(false); }}
                      className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${!selectedRole ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                    >None</button>
                    {functionalRoles.map(role => (
                      <button key={role.id}
                        onClick={() => { setSelectedRole(role.id); setIsRoleDropdownOpen(false); }}
                        className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${selectedRole === role.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                      >{role.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2-column grid: Sliders + Radar chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* LEFT: Target Editor */}
            <div className="order-2 lg:order-1">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-7 sticky top-24">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-3">
                      <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Edit3 size={16} />
                      </div>
                      Target area - org culture map
                    </h3>
                    <div className="flex gap-2">
                      {selectedRole && (
                        <button
                          onClick={() => {
                            setSelectedRoleDetails(roleDefinitions[selectedRole]);
                            setShowRolePopup(true);
                          }}
                          className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                          title="Role Details"
                        >
                          <Info size={16} />
                        </button>
                      )}
                      {isAccepted && (
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                          <CheckCircle2 size={12} /> Locked
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedIndustry === 'others' && (
                    <input
                      type="text"
                      placeholder="Sector Name"
                      value={customSectorName}
                      onChange={(e) => setCustomSectorName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 mb-6 transition-all"
                    />
                  )}

                  <div className="space-y-6">
                    {['Teamwork', 'Customer', 'Integrity', 'Innovation', 'Excellence'].map((trait, index) => (
                      <div key={trait} className="group">
                        <div className="flex justify-between items-center mb-2.5">
                          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">{trait}</span>
                          <span className="text-xs font-black text-indigo-600 bg-indigo-50 text-[11px] px-2.5 py-1 rounded-lg border border-indigo-100 min-w-8 text-center">{currentTargets[index]}</span>
                        </div>
                        <input
                          type="range" min="1" max="5" step="1"
                          disabled={isAccepted}
                          value={currentTargets[index]}
                          onChange={(e) => updateTargetValue(index, parseInt(e.target.value))}
                          className={`w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all ${isAccepted ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                        />
                      </div>
                    ))}
                  </div>

                  {!isAccepted ? (
                    <button
                      onClick={() => setIsAccepted(true)}
                      className="w-full mt-10 py-4 rounded-2xl font-black text-[13px] uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100"
                    >
                      Lock Fit Profile <ArrowRight size={16} strokeWidth={3} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsAccepted(false)}
                      className="w-full mt-10 py-3 rounded-2xl font-bold text-[12px] text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all border border-dashed border-slate-200"
                    >
                      Reset & Modify
                    </button>
                  )}
                </div>
              </div>

              {/* MIDDLE: Visualization */}
              <div className="order-1 lg:order-2">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 p-6 sm:p-8 flex flex-col items-center relative overflow-hidden h-full min-h-[500px]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500 opacity-50"></div>
                  <div className="absolute inset-x-0 -top-24 h-64 bg-indigo-50/30 blur-[100px] rounded-full"></div>

                  <div className="relative z-10 w-full flex flex-col sm:flex-row justify-between items-start gap-4 mb-10">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-2xl tracking-tight leading-tight">
                        {selectedCandidate ? selectedCandidate.name : (customSectorName || (selectedIndustry && industryProfiles[selectedIndustry]?.name) || userDetails?.industry || 'Loading…')}
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mt-1.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        {selectedCandidate ? 'Candidate Deep-Scan' : 'Industry Fit Mapping'}
                      </p>
                    </div>
                    {selectedCandidate && (
                      <div className="bg-slate-900 rounded-2xl px-5 py-3 shadow-xl shadow-slate-200">
                        <div className={`text-3xl font-black tabular-nums transition-colors duration-500 ${selectedCandidate.fitScore >= 70 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                          {selectedCandidate.fitScore.toFixed(0)}%
                        </div>
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Overlap Score</p>
                      </div>
                    )}
                  </div>

                  <div className="w-full max-w-[320px] lg:max-w-[400px] aspect-square relative z-10 my-4 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(99,102,241,0.08),transparent_70%)] rounded-full"></div>
                    <RadarChartCustom
                      targetScores={currentTargets}
                      candidateScores={selectedCandidate ? selectedCandidate.culturalScores : null}
                      labels={['Teamwork', 'Customer', 'Integrity', 'Innovation', 'Excellence']}
                    />
                  </div>

                  <div className="mt-auto w-full relative z-10">

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-6 pb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-50"></div>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Target area - org culture map</span>
                      </div>
                      {selectedCandidate && (
                        <div className="flex items-center gap-2.5 animate-in fade-in zoom-in slide-in-from-left-2 transition-all">
                          <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-rose-500 shadow-lg shadow-rose-200"></div>
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Candidate signature - candidate value map</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

      </main>

      {/* Role Details Popup */}
      {showRolePopup && selectedRoleDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-8 text-white relative">
              <button
                onClick={() => setShowRolePopup(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
              <h3 className="text-3xl font-black tracking-tight mb-2">{selectedRoleDetails.name}</h3>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">Role-Based Culture Profile</p>
            </div>
            <div className="p-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Trait Adjustments (vs Industry Baseline)</h4>
                  <div className="space-y-3">
                    {['Teamwork', 'Customer', 'Integrity', 'Innovation', 'Excellence'].map((trait, i) => (
                      <div key={trait} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-xs font-bold text-slate-700">{trait}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${selectedRoleDetails.offset[i] > 0 ? 'bg-emerald-100 text-emerald-600' : selectedRoleDetails.offset[i] < 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'}`}>
                            {selectedRoleDetails.offset[i] > 0 ? `+${selectedRoleDetails.offset[i]}` : selectedRoleDetails.offset[i]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100">
                  <button
                    onClick={() => setShowRolePopup(false)}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Industry Modal */}
      {showNoIndustryModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-600 p-8 text-white">
              <h3 className="text-2xl font-black tracking-tight mb-1">Industry Not Set</h3>
              <p className="text-indigo-200 text-sm">Update your profile to use Culture Fit</p>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                Your recruiter profile doesn't have an industry selected. Please update your profile first so we can load the right culture baseline for your organisation.
              </p>
              <button
                onClick={() => { setShowNoIndustryModal(false); window.location.href = '/profile'; }}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
              >
                Go to Profile
              </button>
              <button
                onClick={() => setShowNoIndustryModal(false)}
                className="w-full py-2 text-slate-400 text-[12px] font-bold hover:text-slate-600 transition-colors"
              >
                Continue with default
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CultureFitScorer;
