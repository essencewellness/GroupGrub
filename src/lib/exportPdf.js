export async function exportShoppingList({ tripId, items, tripName }) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageHeight = 297
  const margin = 20
  let y = margin

  // Header
  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.setTextColor(46, 125, 50) // green-600
  doc.text("Lista de Compras", margin, y)
  y += 8

  doc.setFontSize(14)
  doc.setTextColor(130, 130, 130) // gray-400
  doc.setFont("helvetica", "normal")
  doc.text(tripName || tripId, margin, y)
  y += 10

  // Stats
  const total = items.length
  const comprados = items.filter((i) => i.comprado).length
  const pct = total ? Math.round((comprados / total) * 100) : 0

  doc.setFontSize(11)
  doc.setTextColor(180, 180, 180)
  doc.text(`${comprados}/${total} items (${pct}%)`, margin, y)
  y += 12

  // Separator
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.3)
  doc.line(margin, y, 190, y)
  y += 10

  // Items (sorted by category — matches App.jsx CATS)
  const cats = ["dispensa", "bebidas", "talho", "laticinios", "fresco", "outro"]
  const catLabels = {
    dispensa:   "Dispensa (comprar com antecedência)",
    bebidas:    "Bebidas (comprar com antecedência)",
    talho:      "Talho & Peixaria (1–2 dias antes)",
    laticinios: "Laticínios (1–2 dias antes)",
    fresco:     "Frescos (comprar no dia)",
    outro:      "Outros",
  }

  const catColors = {
    dispensa:   [232, 163, 61],
    bebidas:    [58, 160, 255],
    talho:      [255, 107, 107],
    laticinios: [155, 123, 255],
    fresco:     [143, 185, 150],
    outro:      [107, 130, 153],
  }

  const byCategory = new Map(cats.map(c => [c, []]))
  for (const i of items) byCategory.get(i.categoria || 'outro')?.push(i)

  let firstCategory = true
  for (const cat of cats) {
    const itemsInCat = byCategory.get(cat) ?? []
    if (!itemsInCat.length) continue

    if (!firstCategory) y += 4
    firstCategory = false

    // Category header
    const color = catColors[cat]
    doc.setFillColor(color[0], color[1], color[2])
    doc.setDrawColor(color[0], color[1], color[2])
    doc.setLineWidth(0.5)
    doc.rect(margin, y, 5, 5, "fd") // colored square
    doc.setFontSize(12)
    doc.setTextColor(240, 232, 216)
    doc.setFont("helvetica", "bold")
    doc.text(catLabels[cat], margin + 9, y + 3.5)
    doc.setFont("helvetica", "normal")
    y += 10

    // Items — inclui assignee quando atribuído
    itemsInCat.forEach((item) => {
      const isComprado = item.comprado ? "✓ " : "☐ "
      const qtd = item.qtd ? ` (${item.qtd})` : ""
      const assignee = item.assignee ? ` → ${item.assignee}` : ""
      const line = `${isComprado}${item.nome}${qtd}${assignee}`

      doc.setFontSize(10)
      doc.setTextColor(item.comprado ? 120 : 240, item.comprado ? 120 : 232, item.comprado ? 120 : 216)
      const split = doc.splitTextToSize(line, 160)

      if (y + split.length * 5 > pageHeight - margin) {
        doc.addPage()
        y = margin
      }

      doc.text(split, margin, y)
      y += split.length * 4.5
    })
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(130, 130, 130)
  doc.text(
    `Exportado em ${new Date().toLocaleDateString("pt-PT")} · GroupGrub Pro`,
    margin,
    pageHeight - 10
  )

  doc.save("lista-compras-" + (tripName || tripId).toLowerCase().replace(/ /g, "-") + ".pdf")
}

export async function exportMealPlan({ tripId, meals, tripName }) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.setTextColor(46, 125, 50)
  doc.text("Plano de Refeições", 20, 30)

  doc.setFontSize(12)
  doc.setTextColor(130, 130, 130)
  doc.setFont("helvetica", "normal")
  doc.text(tripName || tripId, 20, 45)

  let y = 55
  meals.forEach((meal) => {
    doc.setFontSize(11)
    doc.setTextColor(240, 232, 216)
    doc.setFont("helvetica", "bold")
    const mealLine = `${meal.emoji || "🍽️"} ${meal.nome}`
    doc.text(mealLine, 20, y)
    y += 6

    if (meal.ingredientes && meal.ingredientes.length > 0) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(180, 180, 180)
      meal.ingredientes.forEach((ing) => {
        doc.text(`• ${ing}`, 25, y)
        y += 5
        if (y > 280) {
          doc.addPage()
          y = 30
        }
      })
    }
    y += 4
  })

  doc.setFontSize(8)
  doc.setTextColor(130, 130, 130)
  doc.text(
    `Exportado em ${new Date().toLocaleDateString("pt-PT")} · GroupGrub Pro`,
    20,
    290
  )

  doc.save("plano-refeicoes-" + (tripName || tripId).toLowerCase().replace(/ /g, "-") + ".pdf")
}
