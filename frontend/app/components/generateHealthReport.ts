import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface UserData {
  name?: string
  email?: string
}

interface SymptomPattern {
  name: string
  days: number
  cycles_with_symptom?: number
  avg_days_per_cycle?: number
  timeframe: string
  percentage: number
}

interface CycleData {
  cycles: any[]
  avgCycleLength: number
  symptomPatterns?: SymptomPattern[]
  prediction?: {
    predicted_next_start?: string
    predicted_next_end?: string
    period_length_prediction?: number
    confidence_score?: number
  }
}

/**
 * Generates a professional health report PDF
 * @param userData - User information (name, email)
 * @param cycleData - Cycle statistics and patterns
 * @param chartRef - Ref to the chart DOM element to capture
 * @returns Promise that resolves when PDF is generated and downloaded
 */
export async function generateHealthReport(
  userData: UserData,
  cycleData: CycleData,
  chartRef: HTMLElement | null
): Promise<void> {
  if (!chartRef) {
    throw new Error("Chart element not found")
  }

  const doc = new jsPDF("p", "mm", "a4")
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // Brand Colors
  const primaryColor = "#ff7eb6"
  const secondaryColor = "#3f2b4d"
  const accentColor = "#a78bfa"

  // Helper: Add header to each page
  const addHeader = (pageNum: number) => {
    // App Name
    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.setTextColor(primaryColor)
    doc.text("Period Tracker", margin, 15)

    // Decorative line
    doc.setDrawColor(primaryColor)
    doc.setLineWidth(0.5)
    doc.line(margin, 20, pageWidth - margin, 20)

    // Page number
    doc.setFontSize(10)
    doc.setTextColor("#999999")
    doc.text(`Page ${pageNum}`, pageWidth - margin - 10, 15, { align: "right" })
  }

  // Helper: Add footer
  const addFooter = () => {
    doc.setFontSize(9)
    doc.setTextColor("#999999")
    doc.text(
      "This report is generated for informational purposes. Please consult your healthcare provider for medical advice.",
      margin,
      pageHeight - 10
    )
  }

  // ===== PAGE 1: Header + User Info + Summary =====
  let currentY = 35
  addHeader(1)

  // Report Title
  doc.setFont("helvetica", "bold")
  doc.setFontSize(24)
  doc.setTextColor(secondaryColor)
  doc.text("Health Report", margin, currentY)
  currentY += 12

  // Generated Date
  doc.setFontSize(11)
  doc.setTextColor("#666666")
  doc.setFont("helvetica", "normal")
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  doc.text(`Generated on ${today}`, margin, currentY)
  currentY += 15

  // User Info Section
  doc.setFillColor("#faf6f8")
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 30, 3, 3, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(secondaryColor)
  doc.text("Patient Information", margin + 5, currentY + 10)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor("#555555")
  const userName = userData.name || "Not provided"
  const userEmail = userData.email || "Not provided"
  doc.text(`Name: ${userName}`, margin + 5, currentY + 18)
  doc.text(`Email: ${userEmail}`, margin + 5, currentY + 25)
  currentY += 40

  // Summary Statistics Section
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(secondaryColor)
  doc.text("Cycle Summary", margin, currentY)
  currentY += 10

  // Stats Grid (2 columns)
  const colWidth = (pageWidth - margin * 2 - 10) / 2
  const stats = [
    { label: "Average Cycle Length", value: `${Math.round(cycleData.avgCycleLength)} Days`, color: primaryColor },
    { label: "Total Cycles Tracked", value: `${cycleData.cycles.length}`, color: accentColor },
    { label: "Predicted Next Period", value: cycleData.prediction?.predicted_next_start ? formatDate(cycleData.prediction.predicted_next_start) : "N/A", color: primaryColor },
    { label: "Prediction Confidence", value: cycleData.prediction?.confidence_score ? `${Math.round(cycleData.prediction.confidence_score * 100)}%` : "N/A", color: accentColor },
  ]

  stats.forEach((stat, index) => {
    const col = index % 2
    const row = Math.floor(index / 2)
    const x = margin + col * (colWidth + 10)
    const y = currentY + row * 25

    // Stat card background
    doc.setFillColor("#faf6f8")
    doc.roundedRect(x, y, colWidth, 20, 2, 2, "F")

    // Stat value
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.setTextColor(stat.color)
    doc.text(stat.value, x + 5, y + 10)

    // Stat label
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor("#666666")
    doc.text(stat.label, x + 5, y + 16)
  })

  currentY += Math.ceil(stats.length / 2) * 25 + 10

  // Cycle History Table
  if (cycleData.cycles.length > 0) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.setTextColor(secondaryColor)
    doc.text("Recent Cycle History", margin, currentY)
    currentY += 8

    // Table header
    doc.setFillColor(secondaryColor)
    doc.rect(margin, currentY, pageWidth - margin * 2, 8, "F")
    doc.setFontSize(10)
    doc.setTextColor("#ffffff")
    doc.text("Start Date", margin + 3, currentY + 5.5)
    doc.text("End Date", margin + 50, currentY + 5.5)
    doc.text("Duration", margin + 95, currentY + 5.5)
    doc.text("Cycle Length", pageWidth - margin - 3, currentY + 5.5, { align: "right" })
    currentY += 8

    // Table rows (last 6 cycles)
    doc.setTextColor("#333333")
    doc.setFont("helvetica", "normal")
    const recentCycles = cycleData.cycles.slice(0, 6)

    recentCycles.forEach((cycle, index) => {
      if (currentY > pageHeight - 40) {
        addFooter()
        doc.addPage()
        addHeader(2)
        currentY = 35
      }

      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor("#faf6f8")
        doc.rect(margin, currentY, pageWidth - margin * 2, 7, "F")
      }

      doc.setFontSize(9)
      doc.text(formatDate(cycle.start_date), margin + 3, currentY + 5)
      doc.text(cycle.end_date ? formatDate(cycle.end_date) : "Ongoing", margin + 50, currentY + 5)
      doc.text(
        cycle.period_length ? `${cycle.period_length} days` : "N/A",
        margin + 95,
        currentY + 5
      )
      doc.text(
        cycle.cycle_length ? `${cycle.cycle_length} days` : "N/A",
        pageWidth - margin - 3,
        currentY + 5,
        { align: "right" }
      )
      currentY += 7
    })
  }

  addFooter()

  // ===== PAGE 2: Chart Visualization =====
  doc.addPage()
  addHeader(2)
  currentY = 35

  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(secondaryColor)
  doc.text("Cycle Length Trends", margin, currentY)
  currentY += 8

  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor("#666666")
  doc.text("Visual representation of your last 6 cycles", margin, currentY)
  currentY += 12

  // Capture chart as image
  const canvas = await html2canvas(chartRef, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  })

  const chartImage = canvas.toDataURL("image/png")
  const chartWidth = pageWidth - margin * 2
  const chartHeight = (canvas.height * chartWidth) / canvas.width

  // Keep chart within page bounds
  const maxChartHeight = 100
  const finalChartHeight = Math.min(chartHeight, maxChartHeight)

  doc.addImage(chartImage, "PNG", margin, currentY, chartWidth, finalChartHeight)
  currentY += finalChartHeight + 15

  // Chart interpretation
  doc.setFillColor("#faf6f8")
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 25, 3, 3, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(secondaryColor)
  doc.text("Chart Interpretation", margin + 5, currentY + 8)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor("#555555")
  doc.text(
    `Your average cycle length is ${Math.round(cycleData.avgCycleLength)} days. The dotted line represents`,
    margin + 5,
    currentY + 15
  )
  doc.text(
    "your average. Variations are normal, but consistent patterns help with prediction accuracy.",
    margin + 5,
    currentY + 21
  )

  // ===== PAGE 3: Symptom Patterns (if available) =====
  if (cycleData.symptomPatterns && cycleData.symptomPatterns.length > 0) {
    doc.addPage()
    addHeader(3)
    currentY = 35

    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.setTextColor(secondaryColor)
    doc.text("Documented Symptoms & Patterns", margin, currentY)
    currentY += 10

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor("#666666")
    doc.text("Summary of recurring symptoms recorded across menstrual cycles", margin, currentY)
    currentY += 15

    // Table header
    const col1X = margin
    const col2X = margin + 60
    const col3X = margin + 100
    const col4X = pageWidth - margin
    const rowHeight = 18

    // Header row with background
    doc.setFillColor("#f5f5f5")
    doc.rect(margin, currentY, pageWidth - margin * 2, 10, "F")
    
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor("#333333")
    doc.text("Symptom", col1X + 2, currentY + 6.5)
    doc.text("Frequency", col2X + 2, currentY + 6.5)
    doc.text("Typical Duration", col3X + 2, currentY + 6.5)
    doc.text("Cycle Phase", col4X - 2, currentY + 6.5, { align: "right" })
    currentY += 12

    // Helper to humanize frequency text
    const getFrequencyText = (pct: number, cycles: number) => {
      if (pct >= 95) return `Every Cycle (${pct}%)`
      if (pct >= 80) return `Very Frequent (${pct}%)`
      if (pct >= 60) return `Frequent (${pct}%)`
      if (pct >= 40) return `Common (${pct}%)`
      if (pct >= 20) return `Occasional (${pct}%)`
      return `Rare (${pct}%)`
    }

    // Helper to simplify timeframe for clinical report
    const simplifyTimeframe = (tf: string) => {
      return tf
        .replace("Usually Period Phase", "Menstruation")
        .replace("Usually Follicular Phase", "Follicular")
        .replace("Usually Ovulation", "Ovulation")
        .replace("Usually Luteal Phase", "Luteal")
        .replace("Usually Day", "Day")
        .replace("Usually Days", "Days")
    }

    // Table rows
    cycleData.symptomPatterns.forEach((symptom, index) => {
      if (currentY > pageHeight - 45) {
        addFooter()
        doc.addPage()
        addHeader(doc.internal.pages.length)
        currentY = 35
        
        // Redraw header on new page
        doc.setFillColor("#f5f5f5")
        doc.rect(margin, currentY, pageWidth - margin * 2, 10, "F")
        doc.setFont("helvetica", "bold")
        doc.setFontSize(9)
        doc.setTextColor("#333333")
        doc.text("Symptom", col1X + 2, currentY + 6.5)
        doc.text("Frequency", col2X + 2, currentY + 6.5)
        doc.text("Typical Duration", col3X + 2, currentY + 6.5)
        doc.text("Cycle Phase", col4X - 2, currentY + 6.5, { align: "right" })
        currentY += 12
      }

      // Alternating row background
      if (index % 2 === 0) {
        doc.setFillColor("#fafafa")
        doc.rect(margin, currentY - 2, pageWidth - margin * 2, rowHeight, "F")
      }

      // Row border
      doc.setDrawColor("#e0e0e0")
      doc.setLineWidth(0.3)
      doc.line(margin, currentY + rowHeight - 2, pageWidth - margin, currentY + rowHeight - 2)

      // Symptom name
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(secondaryColor)
      doc.text(symptom.name, col1X + 2, currentY + 6)

      // Frequency (humanized)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor("#555555")
      const freqText = getFrequencyText(symptom.percentage, symptom.cycles_with_symptom || 0)
      doc.text(freqText, col2X + 2, currentY + 6)

      // Duration
      const durationText = symptom.avg_days_per_cycle 
        ? `~${symptom.avg_days_per_cycle} days/cycle`
        : "Variable"
      doc.text(durationText, col3X + 2, currentY + 6)

      // Phase (simplified)
      const phaseText = simplifyTimeframe(symptom.timeframe)
      doc.text(phaseText, col4X - 2, currentY + 6, { align: "right" })

      currentY += rowHeight
    })

    // Add clinical interpretation note
    currentY += 10
    doc.setFillColor("#f8f8f8")
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 22, 2, 2, "F")
    
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor("#555555")
    doc.text("Clinical Notes:", margin + 4, currentY + 7)
    
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor("#777777")
    doc.text("Symptoms recorded by patient via daily logging. Frequency indicates percentage of menstrual", margin + 4, currentY + 14)
    doc.text("cycles where symptom was documented. Duration reflects average days per affected cycle.", margin + 4, currentY + 19)
  }

  addFooter()

  // Save the PDF
  const fileName = `Health_Report_${userData.name?.replace(/\s+/g, "_") || "User"}_${new Date().toISOString().split("T")[0]}.pdf`
  doc.save(fileName)
}

// Helper function to format dates
function formatDate(dateStr: string): string {
  if (!dateStr) return "N/A"
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
