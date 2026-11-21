export type SyncProgress = {
  total: number;
  processed: number;
  synced: number;
  failed: number;
  skipped: number;
  message?: string;
};

export type SyncProgressCallback = (progress: SyncProgress) => void;
