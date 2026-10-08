"use client";

import React from "react";
import { X, Shield, Zap, TrendingUp, Package, Scale, CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";

interface CouncilDebateModalProps {
  debate: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function CouncilDebateModal({ debate, isOpen, onClose }: CouncilDebateModalProps) {
  if (!isOpen || !debate) return null;

  const agents = debate.agents || [];
  const transcript = debate.debate_transcript || [];
  const arbiterMeta = debate.arbiter_metadata || {};
  const quorumStatus = debate.quorum_status || "2-1 CONDITIONAL_COMPROMISE";
  const consensusScore = Math.round((debate.consensus_score || 0.88) * 100);

  const getVoteBadge = (vote: string) => {
    const v = (vote || "").toUpperCase();
    if (v.includes("APPROVE")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" /> {vote}
        </span>
      );
    }
    if (v.includes("CONDITIONAL") || v.includes("CAUTIOUS")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3" /> {vote}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
        <AlertOctagon className="w-3 h-3" /> {vote}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#08080d] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-white/60">
              AUTONOMOUS COUNCIL WAR ROOM
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                Multi-Agent Deliberation
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                {quorumStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-white/60 mt-0.5">
              {debate.campaign_name || "Campaign"} • SKU: {debate.target_sku || "Catalog"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 3 Agent Voting Cards */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-white/50">
                AGENT STANCES & QUORUM VOTES
              </span>
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                Consensus: {consensusScore}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {agents.map((agent: any) => (
                <div
                  key={agent.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.05] flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{agent.avatar}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {agent.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 text-[10px]">Vote:</span>
                    {getVoteBadge(agent.vote)}
                  </div>

                  <div className="text-[11px] text-slate-600 dark:text-white/80 line-clamp-2 leading-relaxed">
                    "{agent.key_argument}"
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Debate Transcript Feed */}
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-white/50 mb-2.5 flex items-center justify-between">
              <span>DEBATE TRANSCRIPT ({transcript.length} TURNS)</span>
            </div>

            <div className="space-y-2.5">
              {transcript.map((turn: any, idx: number) => {
                const isArbiter = turn.agent_id === "arbiter";
                const isGrowth = turn.agent_id === "growth";
                const isCfo = turn.agent_id === "cfo";

                const borderLeft = isArbiter
                  ? "border-l-4 border-l-purple-500"
                  : isGrowth
                  ? "border-l-4 border-l-emerald-500"
                  : isCfo
                  ? "border-l-4 border-l-amber-500"
                  : "border-l-4 border-l-indigo-500";

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.05] ${borderLeft}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{turn.avatar}</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {turn.speaker}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-white/40">
                          • {turn.role}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Turn #{idx + 1}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-white/90 leading-relaxed">
                      {turn.text}
                    </p>

                    {turn.data_evidence && (
                      <div className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/60 dark:bg-black/40 text-purple-700 dark:text-purple-300 inline-block">
                        Evidence: {turn.data_evidence}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Arbiter Consensus Box */}
          <div className="p-4 rounded-xl bg-purple-500/05 dark:bg-white/[0.03] border border-purple-500/20">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5 mb-1">
              <Scale className="w-3.5 h-3.5" />
              <span>Arbiter Consensus Resolution ({quorumStatus})</span>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
              {debate.final_action || "Autonomous multi-agent compromise ratified."}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-white/60">
              {debate.compromise_summary}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.01]">
          <div className="text-xs text-slate-500 dark:text-white/50">
            Votes: {arbiterMeta.votes_for || 2} Approved • {arbiterMeta.votes_conditional || 1} Conditional • {arbiterMeta.votes_against || 0} Vetoed
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
