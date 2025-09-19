import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function generatePDFBuffer({
  table,
  chart,
  story,
}: {
  table: any;
  chart: any;
  story: any;
}): Promise<{ buffer: Buffer; fileName: string; contentType: string }> {
  const title = table?.title || "Untitled";
  const description = table?.description || "";
  const headers = table?.data?.headers || [];
  const rows = table?.data?.rows || [];

  const sanitizedRows = rows.map((row: any) =>
    row.map((cell: any) => String(cell ?? ""))
  );

  const doc = new jsPDF({
    orientation: headers.length > 8 ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 20;
  const bottomMargin = 20;

  // ===== TITLE =====
  doc.setFontSize(24).setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, y, { align: "center" });
  y += 35; // Increased gap for better spacing before table

  // ===== DESCRIPTION =====
  if (description) {
    doc.setFontSize(11).setFont("helvetica", "normal");
    const splitDescription = doc.splitTextToSize(description, pageWidth - 40);
    doc.text(splitDescription, 20, y);
    y += splitDescription.length * 6 + 5;
  }

  // ===== TABLE =====
  if (headers.length && sanitizedRows.length) {
    if (y > pageHeight - bottomMargin - 50) {
      doc.addPage();
      y = 20;
    }

    autoTable(doc, {
      startY: y,
      head: [headers],
      body: sanitizedRows,
      styles: {
        fontSize: 10,
        cellPadding: 4,
        valign: "middle",
        halign: "left",
        overflow: "linebreak",
        fillColor: [255, 255, 255],
        textColor: [33, 37, 41],
        lineColor: [220, 220, 220],
      },
      headStyles: {
        fillColor: [60, 60, 60],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 11,
        halign: "left",
        lineWidth: 0.6,
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 20, right: 20 },
      theme: "grid",
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ===== BAR CHART =====
  if (chart?.chartData?.data?.length > 0) {
    const chartData = chart.chartData.data;
    const chartMargin = 25;
    const chartX = chartMargin;
    const chartWidth = pageWidth - chartMargin * 2;
    const chartHeight = 70;
    const barCount = chartData.length;

    const labelHeight = 8; // horizontal labels removed per previous request
    const legendHeight = 15;
    const chartNeededHeight = 10 + chartHeight + labelHeight + legendHeight + 15;

    if (y + chartNeededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      y = 20;
    }

    // Chart title
    doc.setFontSize(16).setFont("helvetica", "bold");
    doc.text(chart.title || "Chart", 20, y);
    y += 8;

    // Chart description
    if (chart.description) {
      doc.setFontSize(10).setFont("helvetica", "normal");
      const splitChartDesc = doc.splitTextToSize(chart.description, pageWidth - 40);
      doc.text(splitChartDesc, 20, y);
      y += splitChartDesc.length * 5 + 5;
    }

    const minBarWidth = 15;
    let barWidth = (chartWidth - (barCount - 1) * 5) / barCount;
    if (barWidth < minBarWidth) barWidth = minBarWidth;
    const barSpacing = (chartWidth - barWidth * barCount) / (barCount - 1);

    const maxValue = Math.max(...chartData.map((d: any) => d.value));
    const colors = [
      [100, 150, 255], [255, 99, 132], [75, 192, 192],
      [255, 206, 86], [153, 102, 255], [255, 159, 64],
      [60, 179, 113],
    ];

    const chartTop = y + 10;

    // Draw grid lines and Y axis labels
    doc.setDrawColor(200);
    for (let i = 0; i <= 5; i++) {
      const yLine = chartTop + chartHeight - (i / 5) * chartHeight;
      doc.line(chartX, yLine, chartX + chartWidth, yLine);
      const label = ((maxValue / 5) * i).toFixed(1);
      doc.setFontSize(8).setTextColor(80);
      doc.text(label, chartX - 5, yLine + 2, { align: "right" });
    }

    // Draw bars and values
    chartData.forEach((item: any, index: number) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = chartX + index * (barWidth + barSpacing);
      const yBar = chartTop + chartHeight - barHeight;
      const [r, g, b] = colors[index % colors.length];

      doc.setFillColor(r, g, b).rect(x, yBar, barWidth, barHeight, "F");
      doc.setFontSize(9).setTextColor(0, 0, 0);
      doc.text(String(item.value), x + barWidth / 2, yBar - 2, { align: "center" });
    });

    // Legend below bars
    let legendX = chartX;
    let legendY = chartTop + chartHeight + 12;
    const legendSpacingX = 40;
    doc.setFontSize(9).setTextColor(0, 0, 0);
    chartData.forEach((item: any, index: number) => {
      const [r, g, b] = colors[index % colors.length];
      if (legendX + 50 > chartX + chartWidth) {
        legendX = chartX;
        legendY += 8;
      }
      doc.setFillColor(r, g, b).rect(legendX, legendY - 3, 6, 6, "F");
      doc.text(item.label, legendX + 8, legendY + 2);
      legendX += legendSpacingX;
    });

    y = legendY + 20;
  }

  // ===== STORY =====
  if (story?.data?.length > 0) {
    if (y > pageHeight - bottomMargin) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(60, 60, 60);
    doc.rect(20, y, pageWidth - 40, 10, "F");
    doc.setFontSize(13).setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(story.title || "Insights", 25, y + 7, { align: "left" });
    y += 18;

    if (story.description) {
      doc.setFontSize(11).setFont("helvetica", "normal");
      doc.setTextColor(33, 37, 41);
      const splitStoryDesc = doc.splitTextToSize(story.description, pageWidth - 40);
      doc.text(splitStoryDesc, 20, y, { align: "justify" });
      y += splitStoryDesc.length * 6 + 5;
    }

    story.data.forEach((line: string) => {
      if (y > pageHeight - bottomMargin) {
        doc.addPage();
        y = 20;
      }
      const splitLine = doc.splitTextToSize(String(line), pageWidth - 40);
      doc.setFontSize(11).setFont("helvetica", "normal");
      doc.setTextColor(59, 59, 59);
      doc.text(splitLine, 20, y, { align: "justify" });
      y += splitLine.length * 6 + 3;
    });
  }

  const buffer = Buffer.from(doc.output("arraybuffer"));
  return {
    buffer,
    fileName: `${title.replace(/[^a-z0-9]/gi, "_")}.pdf`,
    contentType: "application/pdf",
  };
}
