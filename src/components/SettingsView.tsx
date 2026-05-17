import React, { useState } from 'react';
import { doc, setDoc, writeBatch, collection, getDocs, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { SETTINGS_COLLECTION, ADMIN_DOC, MEMBERS_COLLECTION, ACTIVITIES_COLLECTION } from '../hooks/useData';
import { Save, AlertTriangle, Images } from 'lucide-react';

export function SettingsView({ settings }: { settings: any }) {
  const [loading, setLoading] = useState(false);
  const [budget, setBudget] = useState(settings?.totalBudget || 0);
  const [spent, setSpent] = useState(settings?.spentAmount || 0);
  const [upiId, setUpiId] = useState(settings?.qrUpiId || '');
  const [qrFileBase64, setQrFileBase64] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let qrUrl = settings?.qrImageUrl || "";
      if (qrFileBase64) {
        qrUrl = qrFileBase64;
      }

      const docRef = doc(db, SETTINGS_COLLECTION, ADMIN_DOC);
      await setDoc(docRef, {
        totalBudget: Number(budget),
        spentAmount: Number(spent),
        qrUpiId: upiId,
        qrImageUrl: qrUrl,
        updatedAt: Date.now()
      }, { merge: true });

      alert("Settings updated successfully!");
      setQrFileBase64(null);
      setPreviewName(null);
    } catch (err: any) {
      console.error(err);
      alert("Error saving settings: " + err.message);
      handleFirestoreError(err, OperationType.UPDATE, SETTINGS_COLLECTION);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const confirm1 = window.confirm("WARNING: This will delete ALL members and activity data. This cannot be undone. Are you absolutely sure?");
    if (!confirm1) return;
    const confirm2 = window.prompt("Type 'RESET' to confirm.");
    if (confirm2 !== "RESET") return;

    setLoading(true);
    try {
      // Delete all members
      const membersSnap = await getDocs(collection(db, MEMBERS_COLLECTION));
      const batch1 = writeBatch(db);
      membersSnap.forEach(d => batch1.delete(d.ref));
      await batch1.commit();

      // Delete all activities
      const actSnap = await getDocs(collection(db, ACTIVITIES_COLLECTION));
      const batch2 = writeBatch(db);
      actSnap.forEach(d => batch2.delete(d.ref));
      await batch2.commit();

      // Reset settings
      await updateDoc(doc(db, SETTINGS_COLLECTION, ADMIN_DOC), {
        totalBudget: 0,
        spentAmount: 0,
        qrUpiId: '',
        qrImageUrl: '',
        updatedAt: Date.now()
      });

      alert("System reset completed.");
      window.location.reload();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'System Reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-2xl max-w-2xl">
      <h2 className="text-xl font-bold text-white mb-6">Settings & Configuration</h2>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-sv-text-secondary">Total Target Budget (₹)</label>
            <input value={budget} onChange={e => setBudget(Number(e.target.value))} type="number" className="w-full bg-[#0B1220] border border-sv-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-sv-primary focus:outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-sv-text-secondary">Spent Amount (₹)</label>
            <input value={spent} onChange={e => setSpent(Number(e.target.value))} type="number" className="w-full bg-[#0B1220] border border-sv-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-sv-primary focus:outline-none" />
          </div>
        </div>

        <div className="space-y-3 border-t border-sv-border/50 pt-6">
          <label className="text-sm font-medium text-white block">QR & Payment Settings</label>
          <div className="space-y-1.5">
            <label className="text-xs text-sv-text-secondary">UPI ID (e.g. phones@upi)</label>
            <input value={upiId} onChange={e => setUpiId(e.target.value)} type="text" className="w-full bg-[#0B1220] border border-sv-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-sv-primary focus:outline-none" placeholder="Enter UPI ID for Auto QR" />
          </div>
          
          <div className="space-y-1.5 pt-2">
            <label className="text-xs text-sv-text-secondary block">Custom QR Code Image (Overrides Auto-generated UPI QR)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm text-sv-text-secondary file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sv-primary/10 file:text-sv-primary hover:file:bg-sv-primary/20 premium-transition w-full border border-sv-border/50 p-1 rounded-xl bg-[#0B1220]" />
            {previewName && <p className="text-xs text-sv-success mt-1">Ready to save: {previewName}</p>}
          </div>
        </div>

        <div className="border-t border-sv-border/50 pt-6 flex gap-4">
          <button disabled={loading} onClick={handleSave} className="flex items-center justify-center gap-2 px-6 py-3 bg-sv-primary hover:bg-sv-primary/90 text-white rounded-xl text-sm font-medium shadow-[0_0_20px_rgba(37,99,235,0.3)] premium-transition w-full sm:w-auto">
            <Save className="w-4 h-4" /> {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>

        <div className="border-t border-sv-danger/20 pt-6 mt-8">
          <h3 className="text-sm font-medium text-sv-danger flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4" /> Danger Zone</h3>
          <p className="text-xs text-sv-text-secondary mb-4">Resetting the system will permanently delete all members, proofs, and activities. Proceed with caution.</p>
          <button disabled={loading} onClick={handleReset} className="px-4 py-2.5 bg-sv-danger/10 text-sv-danger border border-sv-danger/20 rounded-xl text-xs font-medium hover:bg-sv-danger/20 premium-transition w-full sm:w-auto">
            Reset Entire System
          </button>
        </div>
      </div>
    </div>
  );
}
