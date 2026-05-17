import React, { useState, useRef } from "react";
import { PaymentStatus, Member } from "../data";
import { Search, Eye, Lock, MoreVertical, X, BadgeCheck, ArrowUpDown, ArrowUp, ArrowDown, Upload, Trash2, Edit2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, handleFirestoreError, OperationType } from "../lib/firebase";
import { MEMBERS_COLLECTION } from "../hooks/useData";

export function MembersTable({ members, initialFilter = "All" }: { members: Member[], initialFilter?: "All" | "Paid" | "Unpaid" | "Proofs" | "Not Interested" }) {
  const [filter, setFilter] = useState<"All" | "Paid" | "Unpaid" | "Proofs" | "Not Interested">(initialFilter);
  const [selectedProofMember, setSelectedProofMember] = useState<Member | null>(null);
  const [sortField, setSortField] = useState<"name" | "amount" | "date" | "status" | "usn">("date");
  const [sortDesc, setSortDesc] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"name" | "date" | "amount" | "usn" | "status" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStatusStyle = (status: PaymentStatus | string | undefined) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "paid":
        return "text-sv-success bg-sv-success/10 border-sv-success/20 glow-green";
      case "unpaid":
        return "text-sv-danger bg-sv-danger/10 border-sv-danger/20 glow-red";
      case "pending":
        return "text-sv-pending bg-sv-pending/10 border-sv-pending/20 glow-orange";
      case "not interested":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      default:
        return "text-sv-text-secondary bg-sv-border border-sv-border/50";
    }
  };

  const filteredMembers = members.filter(m => {
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) && !m.usn?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filter === "All") return true;
    if (filter === "Proofs") return !!m.proofUrl;
    if (filter === "Unpaid") return m.status === "Unpaid" || m.status === "Pending" || !m.status;
    return m.status === filter || m.status?.toLowerCase() === filter.toLowerCase();
  }).sort((a, b) => {
    let cmp = 0;
    if (sortField === "name") cmp = a.name.localeCompare(b.name);
    else if (sortField === "usn") {
      cmp = (a.usn || "").localeCompare(b.usn || "", undefined, { numeric: true, sensitivity: "base" });
    }
    else if (sortField === "amount") cmp = a.amount - b.amount;
    else if (sortField === "status") cmp = (a.status || "").localeCompare(b.status || "");
    else if (sortField === "date") {
      const da = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.date || 0).getTime();
      const dbDate = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.date || 0).getTime();
      cmp = da - dbDate;
    }
    return sortDesc ? -cmp : cmp;
  });

  const handleSort = (field: "name" | "amount" | "date" | "status" | "usn") => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: "name" | "amount" | "date" | "status" | "usn") => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-40 hover:opacity-100 cursor-pointer" onClick={() => handleSort(field)} />;
    return sortDesc ? 
      <ArrowDown className="w-3 h-3 ml-1 inline text-sv-primary cursor-pointer" onClick={() => handleSort(field)} /> : 
      <ArrowUp className="w-3 h-3 ml-1 inline text-sv-primary cursor-pointer" onClick={() => handleSort(field)} />;
  };

  const handleEditStart = (member: Member, field: "name" | "date" | "amount" | "usn" | "status") => {
    setActionMenuId(null);
    setEditingId(member.id);
    setEditingField(field);
    if (field === "name") setEditValue(member.name);
    if (field === "date") setEditValue(member.date || formatDate(member.createdAt));
    if (field === "usn") setEditValue(member.usn || "");
    if (field === "amount") setEditValue(member.amount.toString());
    if (field === "status") setEditValue(member.status);
  };

  const handleEditSave = async (memberId: string) => {
    if (!editingId || !editingField) return;
    
    try {
      const docRef = doc(db, MEMBERS_COLLECTION, memberId);
      const val = editingField === "amount" ? Number(editValue) : editValue;
      await updateDoc(docRef, {
        [editingField]: val
      });
      if (selectedProofMember && selectedProofMember.id === memberId) {
        setSelectedProofMember({ ...selectedProofMember, [editingField]: val });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, MEMBERS_COLLECTION);
    }
    
    setEditingId(null);
    setEditingField(null);
  };

  const handleDelete = async (memberId: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return;
    try {
      await deleteDoc(doc(db, MEMBERS_COLLECTION, memberId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, MEMBERS_COLLECTION);
    }
    setActionMenuId(null);
  };

  const updateMemberStatus = async (memberId: string, newStatus: string) => {
    try {
      const docRef = doc(db, MEMBERS_COLLECTION, memberId);
      await updateDoc(docRef, { status: newStatus });
      if (selectedProofMember && selectedProofMember.id === memberId) {
        setSelectedProofMember({ ...selectedProofMember, status: newStatus as any });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, MEMBERS_COLLECTION);
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProofMember) return;

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const url = reader.result as string;
        const docRef = doc(db, MEMBERS_COLLECTION, selectedProofMember.id);
        await updateDoc(docRef, {
          proofUrl: url,
          status: "Paid",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        });
        setSelectedProofMember({ ...selectedProofMember, proofUrl: url, status: "Paid" });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, MEMBERS_COLLECTION);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };
  
  const formatDate = (dateValue: any) => {
    if (!dateValue) return "";
    if (dateValue.toDate) return dateValue.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    if (typeof dateValue === 'number') return new Date(dateValue).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return String(dateValue);
  };

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
    <div className="glass-panel rounded-2xl flex flex-col overflow-hidden relative">
      {/* Header controls */}
      <div className="flex flex-col border-b border-sv-border/50">
        {/* Top row: Title + Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 md:px-6 pt-5 pb-2 md:pb-4">
          <h2 className="text-lg font-bold text-white leading-none">Recent Members</h2>
          
          {/* Search & Sort */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-4 h-4 text-sv-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search..." 
                className="w-full sm:w-48 h-9 bg-sv-card/50 border border-sv-border/80 rounded-lg pl-9 pr-3 text-sm text-white placeholder:text-sv-text-secondary focus:outline-none focus:border-sv-primary focus:ring-1 focus:ring-sv-primary/50 premium-transition"
              />
            </div>
            <select
              className="h-9 bg-sv-card/50 border border-sv-border/80 rounded-lg px-4 pr-9 text-sm text-white focus:outline-none focus:border-sv-primary focus:ring-1 focus:ring-sv-primary/50 premium-transition appearance-none cursor-pointer focus:bg-[#0B1220]"
              value={`${sortField}-${sortDesc ? 'desc' : 'asc'}`}
              onChange={(e) => {
                const [f, d] = e.target.value.split('-');
                setSortField(f as any);
                setSortDesc(d === 'desc');
              }}
              style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%239CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              <option value="date-desc">Descending (Date)</option>
              <option value="date-asc">Ascending (Date)</option>
              <option value="usn-asc">USN (Lowest-Highest)</option>
              <option value="usn-desc">USN (Highest-Lowest)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>
        
        {/* Bottom row: Tabs */}
        <div className="px-4 md:px-6 flex items-center gap-6 overflow-x-auto w-full no-scrollbar">
          {["All", "Paid", "Unpaid", "Proofs", "Not Interested"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                "text-sm font-medium relative pb-3 whitespace-nowrap premium-transition transition-colors",
                filter === f
                  ? "text-blue-400"
                  : "text-sv-text-secondary hover:text-white"
              )}
            >
              {f}
              {filter === f && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 rounded-t-full shadow-[0_-2px_8px_rgba(59,130,246,0.6)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table & Mobile List */}
      <div className="flex-1 min-h-[300px]">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-[200px]">
             <p className="text-sv-text-secondary font-medium">No members found</p>
             <p className="text-xs text-sv-text-secondary/70 mt-1">Add a new person to start tracking payments.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden">
              <table className="w-full text-left text-sm table-fixed">
                <thead className="text-xs text-sv-text-secondary border-b border-sv-border/50 select-none">
                  <tr>
                    <th className="px-4 py-4 font-normal transition-colors hover:text-white cursor-pointer w-[25%]" onClick={() => handleSort("name")}>Name {getSortIcon("name")}</th>
                    <th className="px-4 py-4 font-normal transition-colors hover:text-white cursor-pointer w-[15%]" onClick={() => handleSort("usn")}>USN {getSortIcon("usn")}</th>
                    <th className="px-4 py-4 font-normal transition-colors hover:text-white cursor-pointer w-[15%]" onClick={() => handleSort("amount")}>Amount {getSortIcon("amount")}</th>
                    <th className="px-4 py-4 font-normal transition-colors hover:text-white cursor-pointer w-[15%]" onClick={() => handleSort("status")}>Status {getSortIcon("status")}</th>
                    <th className="px-4 py-4 font-normal transition-colors hover:text-white cursor-pointer w-[15%]" onClick={() => handleSort("date")}>Date {getSortIcon("date")}</th>
                    <th className="px-4 py-4 font-normal text-center w-[10%]">Proof</th>
                    <th className="px-2 py-4 font-normal w-12 text-center w-[5%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sv-border/30 text-sv-text-primary">
                  {paginatedMembers.map((member) => (
                    <tr key={member.id} onClick={() => setSelectedProofMember(member)} className="hover:bg-sv-border/20 premium-transition group cursor-pointer transition-colors">
                      <td className="px-4 py-3 align-middle truncate">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center text-[11px] font-bold text-indigo-400 shrink-0">
                            {member.avatarInitials || getInitials(member.name)}
                          </div>
                          <span className="font-semibold text-white/90 group-hover:text-white premium-transition truncate leading-tight">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle font-mono text-[13px] text-sv-text-secondary tracking-wide truncate">
                        {member.usn || "N/A"}
                      </td>
                      <td className="px-4 py-3 align-middle font-mono font-medium text-white/90 text-[13px] tracking-wide truncate">
                        ₹{member.amount || 0}
                      </td>
                      <td className="px-4 py-3 align-middle truncate">
                        <span className={cn(
                          "inline-flex items-center justify-center px-2 py-1 text-[11px] font-medium rounded-md",
                          (member.status || "").toLowerCase() === "paid" && "text-green-400 bg-green-500/10",
                          (member.status || "").toLowerCase() === "unpaid" && "text-red-400 bg-red-500/10",
                          (member.status || "").toLowerCase() === "pending" && "text-yellow-400 bg-yellow-500/10",
                          (member.status || "").toLowerCase() === "not interested" && "text-red-400 bg-red-400/10"
                        )}>
                          {member.status || "Unpaid"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-[13px] text-sv-text-secondary truncate">
                        {formatDate(member.createdAt || member.date)}
                      </td>
                      <td className="px-4 py-3 align-middle text-center">
                        {member.proofUrl || (member.status || "").toLowerCase() === "paid" ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedProofMember(member); }} 
                            className="p-1.5 rounded-full text-blue-500 hover:bg-blue-500/10 premium-transition inline-flex" 
                            title={member.proofUrl ? "View Proof" : "Upload Proof"}
                          >
                            {member.proofUrl ? <Eye className="w-[18px] h-[18px]" strokeWidth={2.5} /> : <Upload className="w-[18px] h-[18px]" strokeWidth={2.5} />}
                          </button>
                        ) : (
                          <span className="text-[14px] text-sv-text-secondary/50 inline-flex items-center justify-center" title="No Proof Uploaded">
                            🔒
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3 align-middle text-center relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === member.id ? null : member.id); }} 
                          className="text-sv-text-secondary hover:text-white p-1 rounded hover:bg-sv-border/50 premium-transition inline-flex"
                        >
                          <MoreVertical className="w-[18px] h-[18px]" />
                        </button>
                        {actionMenuId === member.id && (
                          <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 bg-[#1A1D2D] border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col py-1 animate-in fade-in duration-100">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEditStart(member, "name"); }}
                              className="w-full px-4 py-2 text-xs text-left text-white hover:bg-white/5 premium-transition flex items-center gap-2"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(member.id); }}
                              className="w-full px-4 py-2 text-xs text-left text-red-400 hover:bg-red-500/10 hover:text-red-400 premium-transition flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden flex flex-col divide-y divide-sv-border/50">
              {paginatedMembers.map((member) => (
                <div 
                  key={member.id} 
                  onClick={() => setSelectedProofMember(member)} 
                  className="flex flex-col p-4 hover:bg-sv-border/30 premium-transition cursor-pointer relative gap-3"
                >
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-sm font-medium text-indigo-300">
                        {member.avatarInitials || getInitials(member.name)}
                      </div>
                      <div className="flex flex-col min-w-0 truncate">
                        <span className="font-medium text-white text-sm truncate">{member.name}</span>
                        <span className="text-xs text-sv-text-secondary truncate mt-0.5">{member.usn || "N/A"}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-medium text-white text-sm">₹{member.amount || 0}</span>
                      <span className={cn("inline-flex items-center px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded border", getStatusStyle(member.status))}>
                         {member.status || "Unpaid"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pl-[52px]">
                     <div className="flex items-center gap-2 text-[11px] text-sv-text-secondary font-mono">
                        {formatDate(member.createdAt || member.date)}
                     </div>
                     <div className="flex items-center gap-1 shrink-0">
                        {member.proofUrl || (member.status || "").toLowerCase() === "paid" ? (
                          <button onClick={(e) => { e.stopPropagation(); setSelectedProofMember(member); }} className="p-1 rounded text-sv-accent hover:bg-sv-accent/10 premium-transition" title={member.proofUrl ? "View Proof" : "Upload Proof"}>
                            {member.proofUrl ? <Eye className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                          </button>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); setSelectedProofMember(member); }} className="p-1 rounded text-sv-text-secondary/50 hover:text-white hover:bg-white/5 premium-transition text-[12px]" title="No Proof Uploaded">
                            🔒
                          </button>
                        )}
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuId(actionMenuId === member.id ? null : member.id);
                            }}
                            className="p-1 rounded hover:bg-white/5 text-sv-text-secondary"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {actionMenuId === member.id && (
                            <div className="absolute right-4 top-4 mt-0 w-32 bg-[#0B1220] border border-sv-border rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] py-1 z-50">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleEditStart(member, "name"); }}
                                className="w-full px-3 py-2 text-xs text-left text-white hover:bg-white/5 premium-transition flex items-center gap-2"
                              >
                                <Edit2 className="w-3 h-3" /> Edit
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(member.id); }}
                                className="w-full px-3 py-2 text-xs text-left text-red-400 hover:bg-red-500/20 hover:text-red-400 premium-transition flex items-center gap-2"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Footer / Pagination */}
      <div className="p-4 border-t border-sv-border text-xs text-sv-text-secondary flex flex-wrap justify-between items-center text-center bg-sv-card/90 gap-4">
        <div className="flex items-center gap-3">
          <span>Showing {filteredMembers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredMembers.length)} of {filteredMembers.length} members</span>
          <span className="text-[10px] bg-sv-success/10 text-sv-success px-2 py-0.5 rounded-full border border-sv-success/20 font-medium tracking-wide">
            {members.filter(m => m.status === "Paid").length} people paid
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1 || filteredMembers.length === 0}
            className="p-1.5 rounded-lg border border-sv-border hover:bg-sv-border/50 disabled:opacity-50 disabled:cursor-not-allowed premium-transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="w-20 text-center font-medium">Page {currentPage} of {Math.max(1, totalPages)}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || filteredMembers.length === 0}
            className="p-1.5 rounded-lg border border-sv-border hover:bg-sv-border/50 disabled:opacity-50 disabled:cursor-not-allowed premium-transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    {/* Proof Modal */}
    {selectedProofMember && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setSelectedProofMember(null); setEditingId(null); }} />
        
        {/* Modal Window */}
        <div className="bg-[#060B16] border border-sv-border relative w-full max-w-4xl max-h-[90vh] rounded-[24px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col md:flex-row">
          
          {/* Left Side: Proof */}
          <div className="w-full md:w-1/2 flex-1 overflow-auto flex flex-col items-center justify-center bg-black/50 p-6 border-b md:border-b-0 md:border-r border-sv-border relative min-h-[300px]">
             {selectedProofMember.proofUrl ? (
               <>
                 <img src={selectedProofMember.proofUrl} alt="Payment Proof" className="max-w-full max-h-full object-contain rounded-xl" />
                 <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 hover:bg-black text-white rounded-lg premium-transition border border-white/10 font-medium text-xs backdrop-blur-md"
                 >
                   <Edit2 className="w-3 h-3" /> Change
                 </button>
                 <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleProofUpload} />
               </>
             ) : (
               <div className="flex flex-col items-center justify-center text-sv-text-secondary py-12">
                 <div className="text-[48px] mb-4 opacity-70 grayscale">🔒</div>
                 <p className="mb-4">No proof uploaded.</p>
                 <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleProofUpload} />
                 <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-sv-primary/20 hover:bg-sv-primary text-sv-primary hover:text-white rounded-lg premium-transition border border-sv-primary/30 hover:border-sv-primary font-medium text-sm"
                 >
                   <Upload className="w-4 h-4" /> Upload Proof
                 </button>
               </div>
             )}
          </div>

          {/* Right Side: Details & Actions */}
          <div className="w-full md:w-1/2 p-6 flex flex-col bg-sv-card/50">
             <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Member Details</h2>
                  <p className="text-sm text-sv-text-secondary">Click any field to edit. Press Enter to save.</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setSelectedProofMember(null); setEditingId(null); }} className="p-2 -mr-2 text-sv-text-secondary hover:text-white hover:bg-white/10 rounded-full premium-transition">
                  <X className="w-5 h-5" />
                </button>
             </div>

             <div className="space-y-4 flex-1">
                {/* Field: Name */}
                <div 
                  className="flex flex-col p-3 rounded-xl border border-sv-border bg-black/20 hover:border-sv-primary/50 cursor-pointer premium-transition"
                  onClick={() => handleEditStart(selectedProofMember, "name")}
                >
                  <label className="text-xs text-sv-text-secondary mb-1">Full Name</label>
                  {editingId === selectedProofMember.id && editingField === "name" ? (
                    <input
                      autoFocus
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleEditSave(selectedProofMember.id)}
                      onKeyDown={(e) => e.key === "Enter" && handleEditSave(selectedProofMember.id)}
                      className="bg-transparent text-white font-medium outline-none"
                    />
                  ) : (
                    <span className="text-white font-medium">{selectedProofMember.name}</span>
                  )}
                </div>

                {/* Field: USN */}
                <div 
                  className="flex flex-col p-3 rounded-xl border border-sv-border bg-black/20 hover:border-sv-primary/50 cursor-pointer premium-transition"
                  onClick={() => handleEditStart(selectedProofMember, "usn")}
                >
                  <label className="text-xs text-sv-text-secondary mb-1">USN</label>
                  {editingId === selectedProofMember.id && editingField === "usn" ? (
                    <input
                      autoFocus
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleEditSave(selectedProofMember.id)}
                      onKeyDown={(e) => e.key === "Enter" && handleEditSave(selectedProofMember.id)}
                      className="bg-transparent text-white font-medium outline-none font-mono"
                    />
                  ) : (
                    <span className="text-white font-medium font-mono">{selectedProofMember.usn || "Not Provided"}</span>
                  )}
                </div>

                {/* Field: Amount */}
                <div 
                  className="flex flex-col p-3 rounded-xl border border-sv-border bg-black/20 hover:border-sv-primary/50 cursor-pointer premium-transition"
                  onClick={() => handleEditStart(selectedProofMember, "amount")}
                >
                  <label className="text-xs text-sv-text-secondary mb-1">Amount (₹)</label>
                  {editingId === selectedProofMember.id && editingField === "amount" ? (
                    <input
                      autoFocus
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleEditSave(selectedProofMember.id)}
                      onKeyDown={(e) => e.key === "Enter" && handleEditSave(selectedProofMember.id)}
                      className="bg-transparent text-white font-medium outline-none"
                    />
                  ) : (
                    <span className="text-white font-medium">₹{selectedProofMember.amount}</span>
                  )}
                </div>

                {/* Field: Date */}
                <div 
                  className="flex flex-col p-3 rounded-xl border border-sv-border bg-black/20 hover:border-sv-primary/50 cursor-pointer premium-transition"
                  onClick={() => handleEditStart(selectedProofMember, "date")}
                >
                  <label className="text-xs text-sv-text-secondary mb-1">Date</label>
                  {editingId === selectedProofMember.id && editingField === "date" ? (
                    <input
                      autoFocus
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleEditSave(selectedProofMember.id)}
                      onKeyDown={(e) => e.key === "Enter" && handleEditSave(selectedProofMember.id)}
                      className="bg-transparent text-white font-medium outline-none"
                    />
                  ) : (
                    <span className="text-white font-medium">{formatDate(selectedProofMember.createdAt || selectedProofMember.date)}</span>
                  )}
                </div>

                {/* Field: Status */}
                <div 
                  className="flex flex-col p-3 rounded-xl border border-sv-border bg-black/20 hover:border-sv-primary/50 cursor-pointer premium-transition"
                  onClick={() => handleEditStart(selectedProofMember, "status")}
                >
                  <label className="text-xs text-sv-text-secondary mb-1">Payment Status</label>
                  {editingId === selectedProofMember.id && editingField === "status" ? (
                    <select
                      autoFocus
                      value={editValue}
                      onChange={async (e) => {
                        setEditValue(e.target.value);
                      }}
                      onBlur={() => handleEditSave(selectedProofMember.id)}
                      className="bg-transparent text-white font-medium outline-none"
                    >
                      <option value="Paid" className="bg-[#0B1220]">Paid</option>
                      <option value="Unpaid" className="bg-[#0B1220]">Unpaid</option>
                      <option value="Pending" className="bg-[#0B1220]">Pending</option>
                      <option value="Not Interested" className="bg-[#0B1220]">Not Interested</option>
                    </select>
                  ) : (
                    <div>
                      <span className={cn("px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md border inline-block", getStatusStyle(selectedProofMember.status))}>
                        {selectedProofMember.status || "Unpaid"}
                      </span>
                    </div>
                  )}
                </div>
             </div>
             
             {/* Bottom Actions */}
             <div className="mt-8 pt-4 border-t border-sv-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => updateMemberStatus(selectedProofMember.id, "Paid")}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-green-400 hover:bg-green-400/20 hover:text-green-300 rounded-lg premium-transition font-medium border border-green-400/20"
                  >
                    <BadgeCheck className="w-3.5 h-3.5" /> Mark Paid
                  </button>
                  <button 
                    onClick={() => updateMemberStatus(selectedProofMember.id, "Pending")}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-sv-pending hover:bg-sv-pending/20 rounded-lg premium-transition font-medium border border-sv-pending/20"
                  >
                    Mark Pending
                  </button>
                  <button 
                    onClick={() => updateMemberStatus(selectedProofMember.id, "Not Interested")}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/20 hover:text-red-300 rounded-lg premium-transition font-medium border border-red-400/20"
                  >
                    Mark Not Interested
                  </button>
                </div>
                <button 
                  onClick={() => { handleDelete(selectedProofMember.id); setSelectedProofMember(null); }}
                  className="flex items-center justify-center w-full sm:w-auto gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg premium-transition font-medium"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
             </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
