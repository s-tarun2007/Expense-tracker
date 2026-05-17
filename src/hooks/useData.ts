import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Member, Activity } from '../data';

export const ACTIVITIES_COLLECTION = 'activities';
export const MEMBERS_COLLECTION = 'members';
export const SETTINGS_COLLECTION = 'settings';
export const ADMIN_DOC = 'admin';

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, MEMBERS_COLLECTION), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Member[];
      setMembers(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, MEMBERS_COLLECTION);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { members, loading };
}

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, ACTIVITIES_COLLECTION), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
      setActivities(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, ACTIVITIES_COLLECTION);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { activities, loading };
}

export function useSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, SETTINGS_COLLECTION, ADMIN_DOC);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        // Initialize settings if not exists
        setDoc(docRef, {
          totalBudget: 0,
          spentAmount: 0,
          qrUpiId: 'swords@sbi',
          qrImageUrl: '',
          updatedAt: Date.now()
        }).catch(err => {
          handleFirestoreError(err, OperationType.CREATE, SETTINGS_COLLECTION + '/' + ADMIN_DOC);
        });
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, SETTINGS_COLLECTION + '/' + ADMIN_DOC);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { settings, loading };
}

export function useStats(members: Member[], settings: any) {
  return useMemo(() => {
    const totalMembers = members.length;
    const paidMembers = members.filter(m => (m.status || '').toLowerCase() === 'paid').length;
    const unpaidMembers = members.filter(m => (m.status || '').toLowerCase() === 'unpaid').length;
    const pendingMembers = members.filter(m => (m.status || '').toLowerCase() === 'pending' || !m.status).length;
    const notInterestedMembers = members.filter(m => (m.status || '').toLowerCase() === 'not interested').length;
    
    const totalCollected = members.filter(m => (m.status || '').toLowerCase() === 'paid').reduce((sum, m) => sum + Number(m.amount || 0), 0);
    const pendingAmount = members.filter(m => ['pending', 'unpaid', ''].includes((m.status || '').toLowerCase())).reduce((sum, m) => sum + Number(m.amount || 0), 0);
    const notInterestedAmount = members.filter(m => (m.status || '').toLowerCase() === 'not interested').reduce((sum, m) => sum + Number(m.amount || 0), 0);
    
    const totalBudget = settings?.totalBudget || 0;
    const spentAmount = settings?.spentAmount || 0;
    const remainingBudget = totalBudget - spentAmount;

    return {
      totalMembers,
      paidMembers,
      unpaidMembers: unpaidMembers + pendingMembers, // combined unpaid and pending for stats card
      notInterestedMembers,
      totalCollected,
      pendingAmount,
      notInterestedAmount,
      totalBudget,
      spentAmount,
      remainingBudget
    };
  }, [members, settings]);
}
