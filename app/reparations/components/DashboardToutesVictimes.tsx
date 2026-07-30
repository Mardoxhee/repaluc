"use client";

import React, { useEffect, useState } from 'react';
import { FiUsers } from 'react-icons/fi';
import { useFetch } from '../../context/FetchContext';
import DashboardVictimsLuc from './DashboardVictimsLuc';

type MentionStat = {
  mention: string;
  total: number;
  percentage: number;
};

interface DashboardToutesVictimesProps {
  onSelectAgentReparation?: (fullName: string) => void;
  onShowRecontactedVictims?: () => void;
  onShowSignedContractVictims?: () => void;
  onSelectMention?: (mention: string) => void;
}

const normalizeMentionStats = (payload: any): MentionStat[] => {
  const rows: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.parMention)
      ? payload.parMention
      : Array.isArray(payload?.data?.parMention)
        ? payload.data.parMention
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

  return rows
    .map((item: any) => {
      const mention = String(item?.mention ?? item?.label ?? item?.name ?? '').trim();
      const total = Number(item?.total ?? item?.count ?? item?.nombre ?? 0);
      const percentage = Number(item?.pourcentage ?? item?.percentage ?? item?.percent ?? 0);

      return {
        mention,
        total: Number.isFinite(total) ? total : 0,
        percentage: Number.isFinite(percentage) ? percentage : 0,
      };
    })
    .filter((item) => item.mention.length > 0);
};

const formatPercentage = (value: number) => {
  if (!Number.isFinite(value)) return '0%';
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
};

const getTotalVictimes = (payload: any, mentions: MentionStat[]) => {
  const total = Number(payload?.totalVictimes ?? payload?.data?.totalVictimes);
  if (Number.isFinite(total)) return total;
  return mentions.reduce((sum, item) => sum + item.total, 0);
};

const DashboardToutesVictimes: React.FC<DashboardToutesVictimesProps> = ({
  onSelectAgentReparation,
  onShowRecontactedVictims,
  onShowSignedContractVictims,
  onSelectMention,
}) => {
  const { fetcher } = useFetch();
  const [mentions, setMentions] = useState<MentionStat[]>([]);
  const [totalVictimes, setTotalVictimes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchMentions = async () => {
      setLoading(true);
      try {
        const payload = await fetcher('/victime/stats/mentions');
        if (!mounted) return;
        const normalized = normalizeMentionStats(payload);
        setMentions(normalized);
        setTotalVictimes(getTotalVictimes(payload, normalized));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMentions();

    return () => {
      mounted = false;
    };
  }, [fetcher]);

  return (
    <DashboardVictimsLuc
      dashboardScope="all"
      title="Tableau de bord — Toutes les victimes"
      description="Vue globale de toutes les catégories des victimes"
      onSelectAgentReparation={onSelectAgentReparation}
      onShowRecontactedVictims={onShowRecontactedVictims}
      onShowSignedContractVictims={onShowSignedContractVictims}
      beforeProgression={
        <div className="mb-8 bg-white border border-gray-100 rounded-2xl shadow-lg p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-50">
                <FiUsers className="text-indigo-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Victimes par mention</h2>
                <p className="text-sm text-gray-600">LUC, PECMU, MPU et autres mentions enregistrées.</p>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-700">
              Total: {loading ? '...' : totalVictimes.toLocaleString()}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : mentions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {mentions.map((item) => (
                <button
                  key={item.mention}
                  type="button"
                  onClick={() => onSelectMention?.(item.mention)}
                  className="text-left p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900 uppercase truncate">{item.mention}</div>
                      <div className="text-xs text-gray-500 mt-1">Voir la liste filtrée</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-bold text-indigo-700">{item.total.toLocaleString()}</div>
                      <div className="text-xs font-semibold text-indigo-500">{formatPercentage(item.percentage)}</div>
                    </div>
                  </div>
                  <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-4">
              Aucune statistique par mention disponible.
            </div>
          )}
        </div>
      }
    />
  );
};

export default DashboardToutesVictimes;
