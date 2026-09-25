import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateMedicalRecordsPDF = (
  patient: { fullName: string; email: string; phone: string; id: string },
  records: Array<{
    visit_date: string;
    doctorName: string;
    hospitalName: string;
    diagnosis: string;
    observations: string;
    recommended_tests: string;
    queueNumber?: number | null;
    slotTime?: string | null;
    prescriptionItems?: Array<any>;
  }>
) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(16, 185, 129); // Emerald-500
  doc.text("NexClinic", 14, 20);

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text("Patient Medical Records", 14, 30);

  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(`Patient Name: ${patient.fullName}`, 14, 40);
  if (patient.id) doc.text(`Patient ID: ${patient.id}`, 14, 46);
  if (patient.email) doc.text(`Email: ${patient.email}`, 14, 52);
  if (patient.phone) doc.text(`Phone: ${patient.phone}`, 14, 58);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 66);

  let currentY = 75;

  records.forEach((record, index) => {
    // Add page if near bottom
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    // Record Header
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`Visit: ${new Date(record.visit_date).toLocaleDateString()}`, 14, currentY);

    doc.setFontSize(11);
    doc.text(`Doctor: ${record.doctorName || 'N/A'}`, 14, currentY + 7);
    doc.text(`Hospital: ${record.hospitalName || 'N/A'}`, 100, currentY + 7);

    let nextY = currentY + 14;

    if (record.queueNumber || record.slotTime) {
      const qInfo = record.queueNumber ? `Queue No: ${record.queueNumber}` : '';
      const tInfo = record.slotTime ? `Time: ${record.slotTime}` : '';
      doc.text(`${qInfo}${qInfo && tInfo ? ' | ' : ''}${tInfo}`, 14, nextY);
      nextY += 7;
    }

    currentY = nextY + 1;

    // Details Data
    const details = [
      ["Diagnosis", record.diagnosis || "None"],
      ["Observations", record.observations || "None"],
      ["Recommended Tests", record.recommended_tests || "None"],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [["Detail", "Information"]],
      body: details,
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 }
      },
      margin: { left: 14 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Prescriptions Table
    if (record.prescriptionItems && record.prescriptionItems.length > 0) {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Prescriptions", 14, currentY);

      const prescriptionData = record.prescriptionItems.map((item) => [
        item.name || "-",
        item.amount ? `${item.amount} ${item.unit || ""}` : "-",
        item.frequency || "-",
        item.duration || "-",
        item.notes || "-"
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Medicine", "Dosage", "Frequency", "Duration", "Notes"]],
        body: prescriptionData,
        theme: "striped",
        headStyles: { fillColor: [52, 211, 153] }, // Emerald-400
        styles: { fontSize: 9, cellPadding: 2 },
        margin: { left: 14 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    } else {
      currentY += 5;
    }

    // Add separator line if not the last record
    if (index < records.length - 1) {
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      } else {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(14, currentY, 196, currentY);
        currentY += 10;
      }
    }
  });

  // Footer text
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
  }

  // Download the PDF
  doc.save(`${patient.id.replace(/\s+/g, '_')}_Medical_Records_History.pdf`);
};
