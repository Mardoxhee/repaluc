'use client';
import React, { useEffect, useState } from 'react';
import { progressionPath, progressionRequest, type Programme, type VictimProgression } from '../services/victimProgressionApi';
import { getPecmuPermissions } from '../services/pecmuWorkflowApi';
import { victimProgressionSummary } from '../utils/victimProgressionSummary';
import styles from './ProgressionPreview.module.css';

type Entry = { data?: VictimProgression; failed?: boolean };
export function useVisibleProgressions(victims: Array<{ id: number | string; mention?: string }>, fallbackMention: string) {
  const key = JSON.stringify(victims.map(v => ({ id: v.id, mention: String(v.mention || fallbackMention).trim().toUpperCase() })).filter(v => ['LUC', 'MPU'].includes(v.mention)));
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
        } catch {
          if (!controller.signal.aborted) setEntries(prev => ({ ...prev, [entryKey]: { failed: true } }));
        }
      }
    };
    void Promise.all(Array.from({ length: Math.min(4, targets.length) }, worker));
    return () => controller.abort();
  }, [key]);
  return entries;
}
export default function ProgressionPreview({ data, failed, onClick }: { data?: VictimProgression; failed?: boolean; onClick: () => void }) {
  const summary = data ? victimProgressionSummary(data) : null;
  return <button type="button" className={styles.preview} onClick={onClick} aria-label={summary ? `Progression globale : ${summary.percent} %. Ouvrir le détail.` : failed ? 'Progression indisponible. Ouvrir le dossier pour réessayer.' : 'Chargement de la progression. Ouvrir le dossier.'} title={summary?.description || (failed ? 'Progression indisponible : ouvrir le dossier pour réessayer.' : 'Chargement de la progression…')}>
    <span className={styles.track} aria-hidden="true"><span className={!summary && !failed ? styles.loading : styles.fill} style={summary ? { width: `${summary.percent}%` } : undefined} data-complete={summary?.percent === 100} /></span>
    <span className={styles.value}>{summary ? `${summary.percent} %` : failed ? '—' : '…'}</span>
  </button>;
}
