import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Food {
  id: string;
  name: string;
  protein: number;
  carbs: number;
  calories: number;
  servingSize: number; // grams per serving
  userId: string;
  createdAt: Date;
}

export interface DailyLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  foodId: string;
  foodName: string;
  servings: number;
  grams: number;
  protein: number;
  carbs: number;
  calories: number;
  createdAt: Date;
}

// Add a new food to user's food list
export const addFood = async (
  userId: string,
  name: string,
  protein: number,
  carbs: number,
  calories: number,
  servingSize: number = 100
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'foods'), {
      userId,
      name,
      protein,
      carbs,
      calories,
      servingSize,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding food:', error);
    throw error;
  }
};

// Get all foods for a user
export const getUserFoods = async (userId: string): Promise<Food[]> => {
  try {
    const q = query(collection(db, 'foods'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    } as Food));
  } catch (error) {
    console.error('Error getting foods:', error);
    throw error;
  }
};

// Delete a food
export const deleteFood = async (foodId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'foods', foodId));
  } catch (error) {
    console.error('Error deleting food:', error);
    throw error;
  }
};

// Log food consumption
export const logFoodConsumption = async (
  userId: string,
  foodId: string,
  foodName: string,
  servings: number,
  protein: number,
  carbs: number,
  calories: number,
  servingSize: number = 100
): Promise<string> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const totalGrams = servings * servingSize;
    const docRef = await addDoc(collection(db, 'dailyLogs'), {
      userId,
      date: today,
      foodId,
      foodName,
      servings,
      grams: totalGrams,
      protein: protein * servings,
      carbs: carbs * servings,
      calories: calories * servings,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error logging food:', error);
    throw error;
  }
};

// Get today's logs
export const getTodayLogs = async (userId: string): Promise<DailyLog[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'dailyLogs'),
      where('userId', '==', userId),
      where('date', '==', today)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    } as DailyLog));
  } catch (error) {
    console.error('Error getting today logs:', error);
    throw error;
  }
};

// Delete a log entry
export const deleteLogEntry = async (logId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'dailyLogs', logId));
  } catch (error) {
    console.error('Error deleting log entry:', error);
    throw error;
  }
};
