import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PlanVieQuestionsDB extends DBSchema {
  questions: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
    };
  };
}

const DB_NAME = 'plan-vie-questions-db';
const STORE_NAME = 'questions';
const CACHE_KEY = 'plan-vie-questions';

let dbPromise: Promise<IDBPDatabase<PlanVieQuestionsDB>>;

async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<PlanVieQuestionsDB>(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });
  }
  return dbPromise;
}

const normalizeKey = (key?: string) => key || CACHE_KEY;

export async function saveQuestions(questions: any, key?: string) {
  try {
    const db = await getDB();
    const cacheKey = normalizeKey(key);
    await db.put(STORE_NAME, {
      id: cacheKey,
      data: questions,
      timestamp: Date.now(),
    }, cacheKey);
    return true;
  } catch (error) {
    console.error('Error saving questions to cache:', error);
    return false;
  }
}

export async function getQuestions(key?: string) {
  try {
    const db = await getDB();
    const cached = await db.get(STORE_NAME, normalizeKey(key));
    return cached?.data || null;
  } catch (error) {
    console.error('Error getting questions from cache:', error);
    return null;
  }
}

export async function clearQuestions(key?: string) {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, normalizeKey(key));
    return true;
  } catch (error) {
    console.error('Error clearing questions cache:', error);
    return false;
  }
}

export function isCacheValid(maxAge: number = 24 * 60 * 60 * 1000, key?: string) {
  return getDB().then(async (db) => {
    const cached = await db.get(STORE_NAME, normalizeKey(key));
    if (!cached) return false;
    return (Date.now() - cached.timestamp) < maxAge;
  }).catch(() => false);
}
