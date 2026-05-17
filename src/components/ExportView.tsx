import React from 'react';
import { Member } from '../data';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText, Table } from 'lucide-react';
import { MembersTable } from './MembersTable';

export function ExportView({ members }: { members: Member[] }) {
  
  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    const categories = [
      { title: "Paid Members", status: ["Paid", "paid"] },
      { title: "Not Yet Paid / Pre-registered", status: ["Unpaid", "unpaid", "Pending", "pending", ""] },
      { title: "Not Interested", status: ["Not Interested"] }
    ];

    const headers = ["Name", "USN", "Amount", "Status", "Date", "Proof URL"];

    categories.forEach(category => {
      const categoryMembers = members.filter(m => {
        const status = m.status || "";
        return category.status.includes(status) || category.status.includes(status.toLowerCase());
      });

      if (categoryMembers.length > 0) {
        csvContent += `${category.title} (${categoryMembers.length})\n`;
        csvContent += headers.join(",") + "\n";
        
        categoryMembers.forEach(m => {
          const row = [
            `"${m.name || ""}"`,
            `"${m.usn || "N/A"}"`,
            `"${m.amount || 0}"`,
            `"${m.status || "Unpaid"}"`,
            `"${new Date(m.createdAt?.toDate ? m.createdAt.toDate() : m.date || 0).toLocaleDateString()}"`,
            `"${m.proofUrl || "N/A"}"`
          ];
          csvContent += row.join(",") + "\n";
        });
        csvContent += "\n";
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `members_export_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Members Payment Export", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const categories = [
      { title: "Paid Members", status: ["Paid", "paid"] },
      { title: "Not Yet Paid / Pre-registered", status: ["Unpaid", "unpaid", "Pending", "pending", ""] },
      { title: "Not Interested", status: ["Not Interested"] }
    ];

    let currentY = 28;

    categories.forEach(category => {
      const categoryMembers = members.filter(m => {
        const status = m.status || "";
        return category.status.includes(status) || category.status.includes(status.toLowerCase());
      });

      if (categoryMembers.length > 0) {
        doc.setFontSize(12);
        doc.text(`${category.title} (${categoryMembers.length} members)`, 14, currentY);
        
        const tableData = categoryMembers.map(m => [
          m.name,
          m.usn || "N/A",
          `Rs. ${m.amount}`,
          m.status || "Unpaid",
          new Date(m.createdAt?.toDate ? m.createdAt.toDate() : m.date || 0).toLocaleDateString()
        ]);

        autoTable(doc, {
          startY: currentY + 4,
          head: [['Name', 'USN', 'Amount', 'Status', 'Date']],
          body: tableData,
          didDrawPage: (data) => {
             // In case the table spans multiple pages, update currentY to the end of the table
             currentY = data.cursor.y;
          }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 14; 
      }
    });

    doc.save(`members_export_${new Date().toLocaleDateString()}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-sv-card border border-sv-border p-6 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Export Data</h2>
          <p className="text-sm text-sv-text-secondary">Export the list of members and their payment status to Excel (CSV) or PDF format.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-[#107C41] hover:bg-[#107C41]/90 text-white rounded-lg shadow-lg font-medium premium-transition">
            <Table className="w-5 h-5" /> Export Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-[#D83B01] hover:bg-[#D83B01]/90 text-white rounded-lg shadow-lg font-medium premium-transition">
            <FileText className="w-5 h-5" /> Export PDF
          </button>
        </div>
      </div>
      
      <div className="mt-8">
        <MembersTable members={members} />
      </div>
    </div>
  );
}
