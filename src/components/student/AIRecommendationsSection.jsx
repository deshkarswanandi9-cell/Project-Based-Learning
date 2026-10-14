import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Check,
  Target,
  Award,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  BookOpen,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getSdgLogo } from '../../utils/sdgLogos';

function RelevanceBadge({ score }) {
  let badgeClasses = 'bg-gray-100 text-gray-700 border-gray-200';
  let label = 'Partial';

  if (score >= 80) {
    badgeClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    label = 'Strong';
  } else if (score >= 60) {
    badgeClasses = 'bg-blue-50 text-blue-700 border-blue-200';
    label = 'Good';
  } else if (score >= 40) {
    badgeClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    label = 'Conditional';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeClasses}`}
      title={`${label} alignment score: ${score}/100 based on project evidence`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {score}% ({label})
    </span>
  );
}

export default function AIRecommendationsSection({
  projectData,
  selectedSDGs = [],
  selectedPOs = [],
  selectedPSOs = [],
  onAcceptSDG,
  onAcceptPO,
  onAcceptPSO,
  onAcceptAllSDGs,
  onAcceptAllPOs,
  onAcceptAllPSOs
}) {
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);
  const [results, setResults] = useState(null);
  const [expandedTargetSDG, setExpandedTargetSDG] = useState(null);

  const title = (projectData?.title || '').trim();
  const description = (projectData?.description || '').trim();
  const type = projectData?.type || '';
  const domain = projectData?.domain || '';
  const technologies = projectData?.technologies || [];

  const isTitleValid = title.length >= 3;
  const isDescValid = description.length >= 100;

  const handleGetRecommendations = async () => {
    // Prevent repeated clicks while a request is already in progress
    if (loading) return;

    if (!isTitleValid || !isDescValid) {
      if (!isTitleValid) {
        toast.error('Please enter a project title before requesting AI recommendations.');
      } else {
        toast.error(`Project description needs at least 100 characters (currently ${description.length}).`);
      }
      return;
    }

    setLoading(true);
    setErrorInfo(null);

    try {
      // 1. Get current authenticated session token
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (sessionErr || !token) {
        throw {
          status: 401,
          message: 'Your institutional session has expired. Please sign in again to use the AI assistant.'
        };
      }

      // 2. Call backend endpoint
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          type,
          domain,
          technologies
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.error || `Server responded with status ${response.status}`,
          code: data.code,
          retryAfter: data.retryAfter
        };
      }

      setResults(data.recommendations);
      setErrorInfo(null);
      toast.success('AI recommendations generated successfully!');
    } catch (err) {
      console.error('[AIRecommendations] Error:', err);
      const formattedError = {
        status: err.status || 500,
        message: err.message || 'Failed to generate recommendations. Please try again.',
        code: err.code || 'UNKNOWN_ERROR',
        retryAfter: err.retryAfter || null
      };
      setErrorInfo(formattedError);
      toast.error(formattedError.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTargetExpand = (sdgNum) => {
    setExpandedTargetSDG(prev => (prev === sdgNum ? null : sdgNum));
  };

  return (
    <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 overflow-hidden">
      {/* Header bar matching JSPM college branding */}
      <div className="bg-brand-maroon px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-amber-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide">AI-Powered SDG, PO & PSO Recommendations</h2>
            <p className="text-[11px] text-white/80">
              Align your project with UN Sustainable Development Goals, NBA Outcomes, and Department PSOs.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGetRecommendations}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-brand-maroon hover:bg-amber-50 rounded-md text-xs font-semibold shadow-2xs transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Project...</span>
            </>
          ) : results ? (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-analyze Details</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Recommend with AI</span>
            </>
          )}
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Instruction and input validation status panel */}
        <div className="bg-gray-50 border border-gray-200/80 rounded-md p-3.5 text-xs text-gray-600 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-brand-maroon mt-0.5 shrink-0" />
            <div className="leading-relaxed">
              <span className="font-semibold text-gray-800">How it works: </span>
              The recommendation assistant evaluates your project's problem statement, methodology, and deliverables
              against the 17 UN Sustainable Development Goals, NBA Programme Outcomes (PO1–PO11), and Computer Engineering
              Programme Specific Outcomes (PSO1–PSO3). All suggestions are grounded in the official college catalog.
              Accepting suggestions only adds them to your selection—you maintain complete manual control.
            </div>
          </div>

          {/* Validation Checklist if title or description is incomplete */}
          {(!isTitleValid || !isDescValid) && (
            <div className="pt-1.5 border-t border-gray-200/60 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
              <span className="font-medium text-gray-500">Prerequisites for AI evaluation:</span>
              <span className={`inline-flex items-center gap-1 ${isTitleValid ? 'text-emerald-600' : 'text-amber-600 font-medium'}`}>
                {isTitleValid ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                Project Title (min 3 chars)
              </span>
              <span className={`inline-flex items-center gap-1 ${isDescValid ? 'text-emerald-600' : 'text-amber-600 font-medium'}`}>
                {isDescValid ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                Project Description ({description.length}/100 chars min)
              </span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-8 px-4 text-center bg-gray-50/60 rounded-md border border-dashed border-gray-200 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-brand-maroon animate-spin" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-800">Evaluating Project Deliverables & Objectives</p>
              <p className="text-[11px] text-gray-500 max-w-md mx-auto">
                Analyzing alignment against 17 UN SDGs, official targets, NBA graduate attributes, and department PSOs...
              </p>
            </div>
          </div>
        )}

        {/* Error State with Actionable Message and Retry Button */}
        {errorInfo && !loading && (
          <div
            className={`p-4 rounded-md border text-xs space-y-3 ${
              errorInfo.status === 429 || errorInfo.code === 'RATE_LIMIT_EXCEEDED'
                ? 'bg-amber-50/90 border-amber-300 text-amber-900'
                : 'bg-red-50/90 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle
                className={`w-4 h-4 mt-0.5 shrink-0 ${
                  errorInfo.status === 429 || errorInfo.code === 'RATE_LIMIT_EXCEEDED'
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              />
              <div className="flex-1 space-y-1">
                <p
                  className={`font-semibold ${
                    errorInfo.status === 429 || errorInfo.code === 'RATE_LIMIT_EXCEEDED'
                      ? 'text-amber-950'
                      : 'text-red-900'
                  }`}
                >
                  {errorInfo.status === 429 || errorInfo.code === 'RATE_LIMIT_EXCEEDED'
                    ? 'AI Recommendation Service Temporarily Unavailable'
                    : 'Recommendation Service Notice'}
                </p>
                <p className="leading-relaxed text-[11.5px]">
                  {errorInfo.status === 429 || errorInfo.code === 'RATE_LIMIT_EXCEEDED'
                    ? 'The AI provider quota or rate limit has been reached. AI recommendations are temporarily unavailable. You can continue selecting SDGs, POs, and PSOs manually below, or retry in a few moments.'
                    : errorInfo.message}
                </p>
              </div>
            </div>

            {/* Action Row: Retry button for temporary errors */}
            {errorInfo.status !== 401 && errorInfo.status !== 403 && (
              <div className="pt-2 border-t border-black/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleGetRecommendations}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-maroon hover:bg-[#6e2e2e] text-white rounded text-xs font-semibold shadow-2xs transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Recommendation</span>
                </button>
                <span className="text-[11px] text-gray-500">
                  Manual selection remains available at any time
                </span>
              </div>
            )}
          </div>
        )}

        {/* Results Area */}
        {results && !loading && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* ── SECTION 1: Recommended SDGs ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand-maroon" />
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Recommended UN Sustainable Development Goals ({results.recommendedSDGs?.length || 0})
                  </h3>
                </div>

                {results.recommendedSDGs?.length > 0 && onAcceptAllSDGs && (
                  <button
                    type="button"
                    onClick={() => onAcceptAllSDGs(results.recommendedSDGs.map(s => s.sdgNumber))}
                    className="text-[11px] font-semibold text-brand-maroon hover:text-[#6e2e2e] transition"
                  >
                    Accept All Recommended SDGs
                  </button>
                )}
              </div>

              {(!results.recommendedSDGs || results.recommendedSDGs.length === 0) ? (
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200 text-center text-xs text-gray-500 italic">
                  No SDGs met the relevance threshold (score ≥ 40). Consider elaborating on how your project contributes to sustainability, community benefit, or environmental efficiency.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {results.recommendedSDGs.map(sdg => {
                    const isAlreadySelected = selectedSDGs.includes(sdg.sdgNumber);
                    const isExpanded = expandedTargetSDG === sdg.sdgNumber;
                    const logoUrl = getSdgLogo(sdg.sdgNumber);

                    return (
                      <div
                        key={sdg.sdgNumber}
                        className={`rounded-md border p-3.5 flex flex-col justify-between transition bg-white ${
                          isAlreadySelected ? 'border-emerald-300 bg-emerald-50/20' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="space-y-2">
                          {/* Title, Official Logo, and Badge */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              {logoUrl && (
                                <img
                                  src={logoUrl}
                                  alt={`Official UN SDG ${sdg.sdgNumber} Logo - ${sdg.sdgTitle}`}
                                  className="w-11 h-11 sm:w-12 sm:h-12 rounded object-contain shrink-0 shadow-2xs border border-gray-200 bg-white"
                                />
                              )}
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs font-bold text-gray-900 leading-snug">
                                    SDG {sdg.sdgNumber}: {sdg.sdgTitle}
                                  </h4>
                                </div>
                                <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{sdg.sdgName}</p>
                              </div>
                            </div>
                            <RelevanceBadge score={sdg.relevanceScore} />
                          </div>

                          {/* Reason */}
                          <p className="text-xs text-gray-700 leading-relaxed">{sdg.reason}</p>

                          {/* Evidence from project */}
                          {sdg.evidenceFromProject && (
                            <div className="text-[11px] bg-gray-50 p-2 rounded border border-gray-100 text-gray-600">
                              <span className="font-semibold text-gray-700">Project Evidence: </span>
                              {sdg.evidenceFromProject}
                            </div>
                          )}

                          {/* Limitations */}
                          {sdg.limitations && (
                            <p className="text-[11px] text-amber-700 italic">
                              <span className="font-semibold">Note: </span>
                              {sdg.limitations}
                            </p>
                          )}

                          {/* Target References Accordion */}
                          {sdg.targetReferences?.length > 0 && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => toggleTargetExpand(sdg.sdgNumber)}
                                className="flex items-center justify-between w-full text-[11px] font-medium text-gray-500 hover:text-gray-800 transition"
                              >
                                <span>Specific UN Targets ({sdg.targetReferences.length})</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>

                              {isExpanded && (
                                <ul className="mt-1.5 space-y-1.5 bg-gray-50/80 p-2 rounded border border-gray-100">
                                  {sdg.targetReferences.map(target => (
                                    <li key={target.id} className="text-[11px] text-gray-600 leading-snug">
                                      <span className="font-bold text-brand-maroon">Target {target.id}: </span>
                                      {target.description}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Accept / Add Control */}
                        <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-end">
                          {isAlreadySelected ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Added to Project
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onAcceptSDG(sdg.sdgNumber)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-maroon hover:bg-[#6e2e2e] text-white rounded text-xs font-medium transition shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add SDG {sdg.sdgNumber}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── SECTION 2: Recommended NBA Programme Outcomes ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-maroon" />
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Recommended NBA Programme Outcomes ({results.recommendedPOs?.length || 0})
                  </h3>
                </div>

                {results.recommendedPOs?.length > 0 && onAcceptAllPOs && (
                  <button
                    type="button"
                    onClick={() => onAcceptAllPOs(results.recommendedPOs.map(p => p.poId))}
                    className="text-[11px] font-semibold text-brand-maroon hover:text-[#6e2e2e] transition"
                  >
                    Accept All Recommended POs
                  </button>
                )}
              </div>

              {(!results.recommendedPOs || results.recommendedPOs.length === 0) ? (
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200 text-center text-xs text-gray-500 italic">
                  No Programme Outcomes met the alignment criteria. Detail your engineering tools, design experiments, or problem analysis to identify PO mapping.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {results.recommendedPOs.map(po => {
                    const isAlreadySelected = selectedPOs.includes(po.poId);

                    return (
                      <div
                        key={po.poId}
                        className={`rounded-md border p-3.5 flex flex-col justify-between transition bg-white ${
                          isAlreadySelected ? 'border-emerald-300 bg-emerald-50/20' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="space-y-2">
                          {/* Header with Title and Score */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-gray-900">
                                {po.poId}: {po.poName}
                              </h4>
                              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{po.poDescription}</p>
                            </div>
                            <RelevanceBadge score={po.relevanceScore} />
                          </div>

                          {/* Reason */}
                          <p className="text-xs text-gray-700 leading-relaxed">{po.reason}</p>

                          {/* Evidence from project */}
                          {po.evidenceFromProject && (
                            <div className="text-[11px] bg-gray-50 p-2 rounded border border-gray-100 text-gray-600">
                              <span className="font-semibold text-gray-700">Engineering Evidence: </span>
                              {po.evidenceFromProject}
                            </div>
                          )}

                          {/* Limitations */}
                          {po.limitations && (
                            <p className="text-[11px] text-amber-700 italic">
                              <span className="font-semibold">Note: </span>
                              {po.limitations}
                            </p>
                          )}
                        </div>

                        {/* Accept / Add Control */}
                        <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-end">
                          {isAlreadySelected ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Added to Project
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onAcceptPO(po.poId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-maroon hover:bg-[#6e2e2e] text-white rounded text-xs font-medium transition shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add {po.poId}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── SECTION 3: Recommended Department Programme Specific Outcomes (PSOs) ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-maroon" />
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Recommended Department Programme Specific Outcomes ({results.recommendedPSOs?.length || 0})
                  </h3>
                </div>

                {results.recommendedPSOs?.length > 0 && onAcceptAllPSOs && (
                  <button
                    type="button"
                    onClick={() => onAcceptAllPSOs(results.recommendedPSOs.map(p => p.psoId))}
                    className="text-[11px] font-semibold text-brand-maroon hover:text-[#6e2e2e] transition"
                  >
                    Accept All Recommended PSOs
                  </button>
                )}
              </div>

              {(!results.recommendedPSOs || results.recommendedPSOs.length === 0) ? (
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200 text-center text-xs text-gray-500 italic">
                  No Programme Specific Outcomes met the alignment criteria. Highlight substantive software engineering, intelligent systems, or research/innovation in your project description.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {results.recommendedPSOs.map(pso => {
                    const isAlreadySelected = selectedPSOs.includes(pso.psoId);

                    return (
                      <div
                        key={pso.psoId}
                        className={`rounded-md border p-3.5 flex flex-col justify-between transition bg-white ${
                          isAlreadySelected ? 'border-emerald-300 bg-emerald-50/20' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="space-y-2">
                          {/* Header with Title and Score */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-brand-maroon text-white text-[10px] font-bold">
                                  {pso.psoId}
                                </span>
                                <h4 className="text-xs font-bold text-gray-900 leading-snug">
                                  {pso.psoName}
                                </h4>
                              </div>
                              <p className="text-[11px] text-gray-500 mt-1 leading-snug">{pso.psoDescription}</p>
                            </div>
                            <RelevanceBadge score={pso.relevanceScore} />
                          </div>

                          {/* Reason */}
                          <p className="text-xs text-gray-700 leading-relaxed">{pso.reason}</p>

                          {/* Evidence from project */}
                          {pso.evidenceFromProject && (
                            <div className="text-[11px] bg-gray-50 p-2 rounded border border-gray-100 text-gray-600">
                              <span className="font-semibold text-gray-700">Project Evidence: </span>
                              {pso.evidenceFromProject}
                            </div>
                          )}

                          {/* Limitations */}
                          {pso.limitations && (
                            <p className="text-[11px] text-amber-700 italic">
                              <span className="font-semibold">Note: </span>
                              {pso.limitations}
                            </p>
                          )}
                        </div>

                        {/* Accept / Add Control */}
                        <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-end">
                          {isAlreadySelected ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Added to Project
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onAcceptPSO(pso.psoId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-maroon hover:bg-[#6e2e2e] text-white rounded text-xs font-medium transition shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add {pso.psoId}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
