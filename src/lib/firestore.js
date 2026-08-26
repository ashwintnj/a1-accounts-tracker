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

const getUserDailyDocRef = (userId, date) => doc(db, 'users', userId, 'dailyRecords', date);
const getUserDailyColRef = (userId) => collection(db, 'users', userId, 'dailyRecords');

export const getDailyRecord = async (userId, date) => {
    if (!userId) return null;
    try {
        const snap = await getDoc(getUserDailyDocRef(userId, date));
        return snap.exists() ? snap.data() : null;
    } catch (error) {
        console.error('Error fetching record:', error);
        return null;
    }
};

export const saveDailyRecord = async (userId, date, data, userEmail) => {
    if (!userId) throw new Error('User not authenticated');
    try {
        const payload = {
            ...data,
            date,
            updatedAt: serverTimestamp(),
            updatedBy: userEmail || 'unknown'
        };
        const existing = await getDailyRecord(userId, date);
        if (!existing) {
            payload.createdAt = serverTimestamp();
            payload.createdBy = userEmail || 'unknown';
        }
        await setDoc(getUserDailyDocRef(userId, date), payload, { merge: true });
    } catch (error) {
        console.error('Error saving record:', error);
        throw error;
    }
};

export const deleteDailyRecord = async (userId, date) => {
    if (!userId) return;
    await deleteDoc(getUserDailyDocRef(userId, date));
};

export const listRecentRecords = async (userId, count = 30) => {
    if (!userId) return [];
    const q = query(getUserDailyColRef(userId), orderBy('date', 'desc'), limit(count));
    const snap = await getDocs(q);
    return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const listMonthlyRecords = async (userId, month) => {
    if (!userId) return [];
    const start = `${month}-01`;
    const [yearText, monthText] = month.split('-');
    const year = Number(yearText);
    const monthIndex = Number(monthText) - 1;
    const nextMonthDate = new Date(year, monthIndex + 1, 1);
    const end = nextMonthDate.toISOString().slice(0, 10);

    const q = query(
        getUserDailyColRef(userId),
        where('date', '>=', start),
        where('date', '<', end),
        orderBy('date', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const getPreviousDayRecord = async (userId, currentDate) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 1);
    const previousDate = date.toISOString().slice(0, 10);
    return getDailyRecord(userId, previousDate);
};



export const transferRecordsFromOldUid = async (oldUid, newUid) => {
    if (!oldUid || !newUid) throw new Error('Both Old UID and New UID are required');

    // 1. Reference to the old user's subcollection
    const oldColRef = collection(db, 'users', oldUid, 'dailyRecords');
    const snap = await getDocs(oldColRef);

    if (snap.empty) {
        alert('No records found under the old UID!');
        return;
    }

    // 2. Write each document under the new UID subcollection
    let count = 0;
    for (const docSnap of snap.docs) {
        await setDoc(
            doc(db, 'users', newUid, 'dailyRecords', docSnap.id),
            docSnap.data(),
            { merge: true }
        );
        count++;
    }

    alert(`Transferred ${count} records successfully!`);
};

// Fetch records within a specific date range
export const listRecordsByDateRange = async (userId, startDate, endDate) => {
    if (!userId || !startDate || !endDate) return [];

    const q = query(
        getUserDailyColRef(userId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc') // Fetches newest first
    );

    const snap = await getDocs(q);
    return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
};