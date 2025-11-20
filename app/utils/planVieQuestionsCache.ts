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

export async function saveQuestions(questions: any) {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, {
      id: CACHE_KEY,
      data: questions,
      timestamp: Date.now(),
    }, CACHE_KEY);
    return true;
  } catch (error) {
    console.error('Error saving questions to cache:', error);
    return false;
  }
}

export async function getQuestions() {
  try {
    const db = await getDB();
    const cached = await db.get(STORE_NAME, CACHE_KEY);
    return cached?.data || null;
  } catch (error) {
    console.error('Error getting questions from cache:', error);
    return null;
  }
}

export async function clearQuestions() {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, CACHE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing questions cache:', error);
    return false;
  }
}

export function isCacheValid(maxAge: number = 24 * 60 * 60 * 1000) {
  return getDB().then(async (db) => {
    const cached = await db.get(STORE_NAME, CACHE_KEY);
    if (!cached) return false;
    return (Date.now() - cached.timestamp) < maxAge;
  }).catch(() => false);
}
