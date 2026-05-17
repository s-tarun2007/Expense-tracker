import React, { useState } from "react";
import { UploadCloud, CheckCircle2, Save, FileImage, X } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { MEMBERS_COLLECTION, ACTIVITIES_COLLECTION } from "../hooks/useData";

export function AddPersonForm() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [usn, setUsn] = useState("");
  const [team, setTeam] = useState("");
  const [amount, setAmount] = useState<number>(300);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [notes, setNotes] = useState("");

  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async (status: "Paid" | "Pending" | "Not Interested") => {
    if (!name || !usn) {
      setMsg({ type: 'error', text: 'Please fill name and USN' });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      let proofUrl = "";
      if (file) {
        try {
          const storageRef = ref(storage, `proofs/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          proofUrl = await getDownloadURL(snapshot.ref);
        } catch (storageErr) {
          console.warn("Storage upload failed, proceeding without proof", storageErr);
        }
      }

      await addDoc(collection(db, MEMBERS_COLLECTION), {
        name,
        usn,
        amount,
        status,
        paymentMethod,
        notes,
        proofUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(db, ACTIVITIES_COLLECTION), {
        user: name,
        action: `added to ${status.toLowerCase()} list`,
        timestamp: Date.now(),
        type: "add_member",
        createdAt: serverTimestamp()
      });

      // reset form
      setName("");
      setUsn("");
      setAmount(300);
      setPaymentMethod("upi");
      setNotes("");
      setFile(null);
      setMsg({ type: 'success', text: `Member ${name} added successfully as ${status}` });
      
      // clear message after 3 seconds
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to add member. Please check connection.' });
      handleFirestoreError(err, OperationType.CREATE, MEMBERS_COLLECTION);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-2xl">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Add New Person</h2>
          <p className="text-sm text-sv-text-secondary mt-1">Register a new member and track their payment.</p>
        </div>
        {msg && (
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${msg.type === 'success' ? 'bg-sv-success/10 text-sv-success border border-sv-success/20' : 'bg-sv-danger/10 text-sv-danger border border-sv-danger/20'}`}>
            {msg.text}
          </div>
        )}
      </div>

      <form className="space-y-6 max-w-4xl" onSubmit={(e) => e.preventDefault()}>
        {/* Grid for fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-sv-text-secondary">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} type="text" className="w-full bg-[#0B1220] border border-sv-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sv-primary focus:ring-1 focus:ring-sv-primary premium-transition" placeholder="e.g. Rahul Kumar" />
          </div>
          
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-sv-text-secondary">USN (University Serial Number)</label>
            <input value={usn} onChange={(e) => setUsn(e.target.value)} type="text" className="w-full bg-[#0B1220] border border-sv-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sv-primary focus:ring-1 focus:ring-sv-primary premium-transition" placeholder="e.g. 1RV21CS001" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-sv-text-secondary">Amount Paid (₹)</label>
            <input value={amount} onChange={(e) => setAmount(Number(e.target.value))} type="number" className="w-full bg-[#0B1220] border border-sv-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sv-primary focus:ring-1 focus:ring-sv-primary premium-transition" />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-sv-text-secondary">Payment Method</label>
            <div className="relative">
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="appearance-none w-full bg-[#0B1220] border border-sv-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sv-primary focus:ring-1 focus:ring-sv-primary premium-transition cursor-pointer">
                <option value="upi">UPI (GPay, PhonePe, Paytm)</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-sv-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          {/* Upload Box */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-sv-text-secondary">Upload Screenshot</label>
            
            <div 
              className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center premium-transition ${dragActive ? 'border-sv-primary bg-sv-primary/5' : 'border-sv-border hover:border-sv-border-hover bg-[#0B1220]/50'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-sv-success/10 flex items-center justify-center border border-sv-success/20">
                    <CheckCircle2 className="w-6 h-6 text-sv-success" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white">
                    <FileImage className="w-4 h-4 text-sv-text-secondary" />
                    <span>{file.name}</span>
                    <button type="button" onClick={() => setFile(null)} className="ml-2 text-sv-danger hover:text-white premium-transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`w-12 h-12 rounded-full bg-sv-border/50 flex items-center justify-center mb-4 premium-transition ${dragActive ? 'scale-110 object-sv-primary/20' : ''}`}>
                    <UploadCloud className={`w-6 h-6 ${dragActive ? 'text-sv-primary' : 'text-sv-text-secondary'}`} />
                  </div>
                  <p className="text-sm font-medium text-white mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-sv-text-secondary">SVG, PNG, JPG or GIF (max. 5MB)</p>
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => e.target.files && setFile(e.target.files[0])} accept="image/*" />
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-sv-text-secondary">Notes (Optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-[#0B1220] border border-sv-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sv-primary focus:ring-1 focus:ring-sv-primary premium-transition min-h-[100px] resize-y" placeholder="Add any extra details here..." />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6 border-t border-sv-border">
          <button type="button" disabled={loading} onClick={() => handleSave(file ? "Paid" : "Pending")} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-sv-primary hover:bg-sv-primary/90 text-white rounded-xl text-sm font-medium shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] premium-transition focus:ring-2 focus:ring-sv-primary focus:ring-offset-2 focus:ring-offset-sv-bg">
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save Details"}
          </button>
          <div className="flex gap-2 flex-1">
             <button type="button" disabled={loading} onClick={() => handleSave("Paid")} className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-sv-success/10 hover:bg-sv-success/20 border border-sv-success/20 text-sv-success rounded-xl text-sm font-medium premium-transition">
               Mark Paid
             </button>
             <button type="button" disabled={loading} onClick={() => handleSave("Pending")} className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-sv-pending/10 hover:bg-sv-pending/20 border border-sv-pending/20 text-sv-pending rounded-xl text-sm font-medium premium-transition">
               Mark Pending
             </button>
             <button type="button" disabled={loading} onClick={() => handleSave("Not Interested")} className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 text-red-400 rounded-xl text-sm font-medium premium-transition">
               Not Interested
             </button>
          </div>
        </div>
      </form>
    </div>
  );
}
