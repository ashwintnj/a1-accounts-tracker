import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where
} from 'firebase/firestore';
import { db } from '../firebase';

const DAILY_COLLECTION = 'dailyRecords';

export const getDailyRecord = async (date) => {
    try {
        const snap = await getDoc(doc(db, DAILY_COLLECTION, date));
        return snap.exists() ? snap.data() : null;
    } catch (error) {
        console.error('Error fetching record:', error);
        return null;
    }
};

export const saveDailyRecord = async (date, data, userEmail) => {
    try {
        const payload = {
            ...data,
            date,
            updatedAt: serverTimestamp(),
            updatedBy: userEmail || 'unknown'
        };

        const existing = await getDailyRecord(date);
        if (!existing) {
            payload.createdAt = serverTimestamp();
            payload.createdBy = userEmail || 'unknown';
        }

        await setDoc(doc(db, DAILY_COLLECTION, date), payload, { merge: true });
        console.log('Record saved successfully:', date);
    } catch (error) {
        console.error('Error saving record:', error);
        throw error;
    }
};

export const deleteDailyRecord = async (date) => {
    await deleteDoc(doc(db, DAILY_COLLECTION, date));
};

export const listRecentRecords = async (count = 30) => {
    const q = query(collection(db, DAILY_COLLECTION), orderBy('date', 'desc'), limit(count));
    const snap = await getDocs(q);
    return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const listMonthlyRecords = async (month) => {
    const start = `${month}-01`;
    const [yearText, monthText] = month.split('-');
    const year = Number(yearText);
    const monthIndex = Number(monthText) - 1;
    const nextMonthDate = new Date(year, monthIndex + 1, 1);
    const end = nextMonthDate.toISOString().slice(0, 10);

    const q = query(
        collection(db, DAILY_COLLECTION),
        where('date', '>=', start),
        where('date', '<', end),
        orderBy('date', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const getPreviousDayRecord = async (currentDate) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 1);
    const previousDate = date.toISOString().slice(0, 10);
    return getDailyRecord(previousDate);
};
