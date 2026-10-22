'use client';
import React, { useEffect, useState } from 'react';
import { progressionPath, progressionRequest, type Programme, type VictimProgression } from '../services/victimProgressionApi';
import { getPecmuPermissions } from '../services/pecmuWorkflowApi';
import { victimProgressionSummary } from '../utils/victimProgressionSummary';
import { progressionProgramme } from '../utils/progressionProgramme';
import styles from './ProgressionPreview.module.css';

type Entry = { data?: VictimProgression; failed?: boolean; reason?: string };
export function useVisibleProgressions(victims: Array<{ id: number | string; mention?: string; status?: string }>, fallbackMention: string) {
  const key = JSON.stringify(victims.map(v => ({ id: v.id, mention: progressionProgramme(v, fallbackMention) })).filter(v => v.mention !== null));
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  useEffect(() => {
    const controller = new AbortController();
    const targets = JSON.parse(key) as Array<{ id: number | string; mention: Programme }>;
    const permissions = getPecmuPermissions();
    let cursor = 0;
    setEntries({});
    // Keep existing victim filters and pagination; fetch only visible dossiers,
    // with bounded concurrency and cancellation when the user changes the page.
    const worker = async () => {
      while (!controller.signal.aborted && cursor < targets.length) {
        const target = targets[cursor++];
        const entryKey = `${target.mention}:${target.id}`;
        try {
          const required = target.mention === 'LUC' ? 'indemnisation:read' : 'consentements-mpu:read';
          if (permissions && !['victime:read', required].every(p => permissions.includes(p))) throw new Error('Lecture non autorisée');
          const data = await progressionRequest(progressionPath(target.id, target.mention), 'GET', undefined, controller.signal);
          if (!controller.signal.aborted) setEntries(prev => ({ ...prev, [entryKey]: { data } }));
        } catch (error) {
          if (!controller.signal.aborted) setEntries(prev => ({ ...prev, [entryKey]: { failed: true, reason: error instanceof Error ? error.message : 'Chargement impossible' } }));
        }
      }
    };
    void Promise.all(Array.from({ length: Math.min(4, targets.length) }, worker));
    return () => controller.abort();
  }, [key]);
  return entries;
}
export default function ProgressionPreview({ data, failed, unavailable, reason, onClick }: { data?: VictimProgression; failed?: boolean; unavailable?: boolean; reason?: string; onClick: () => void }) {
  const summary = data ? victimProgressionSummary(data) : null;
  if (!summary && !failed && !unavailable) return <span className={styles.preview} role="status" aria-label="Chargement de la progression" aria-busy="true"><span className={styles.skeletonTrack} aria-hidden="true" /><span className={styles.skeletonValue} aria-hidden="true" /></span>;
  const description = summary?.description || (unavailable ? 'Programme de réparation non identifié ou non pris en charge par ce suivi. Vérifier la mention dans la fiche.' : failed ? `Chargement impossible : ${reason || 'ouvrir le dossier pour réessayer.'}` : 'Chargement de la progression…');
  return <button type="button" className={styles.preview} onClick={onClick} aria-label={summary ? `Progression globale : ${summary.percent} %. Ouvrir le détail.` : description} title={description}>
    <span className={styles.track} aria-hidden="true"><span className={styles.fill} style={summary ? { width: `${summary.percent}%` } : failed || unavailable ? { width: 0 } : undefined} data-complete={summary?.percent === 100} /></span>
    <span className={styles.value}>{summary ? `${summary.percent} %` : failed ? 'À réessayer' : unavailable ? 'À préciser' : '…'}</span>
  </button>;
}
