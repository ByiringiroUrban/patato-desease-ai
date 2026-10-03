import io
import logging
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger("potato_disease_ai.reports")

def generate_diagnostic_pdf(
    prediction_data: Dict[str, Any],
    user_email: str = "grower@farm.com",
    project_name: str = "General Field Inspection"
) -> bytes:
    """
    Generates a professional agronomic field diagnostic report PDF.
    """
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        )
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#1b4d3e"),
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor("#4b5563"),
            spaceAfter=14
        )
        h2_style = ParagraphStyle(
            'SectionH2',
            parent=styles['Heading2'],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#1b4d3e"),
            spaceBefore=10,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['Normal'],
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor("#1f2937")
        )
        bold_style = ParagraphStyle(
            'ReportBold',
            parent=body_style,
            fontName='Helvetica-Bold'
        )

        elements = []

        # Title & Header Banner
        elements.append(Paragraph("🌱 Potato Disease AI — Field Diagnostic Certificate", title_style))
        elements.append(Paragraph("Automated Deep Neural Pathology & Agronomic Prescription Protocol", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#10b981"), spaceAfter=14))

        # Metadata Table
        created_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        meta_data = [
            [Paragraph("<b>Inspection Date:</b>", body_style), Paragraph(created_str, body_style),
             Paragraph("<b>Operator / Grower:</b>", body_style), Paragraph(user_email, body_style)],
            [Paragraph("<b>Plot / Project:</b>", body_style), Paragraph(project_name, body_style),
             Paragraph("<b>Specimen ID:</b>", body_style), Paragraph(f"SCAN-{prediction_data.get('id', 'N/A')}", body_style)],
            [Paragraph("<b>AI Diagnosis:</b>", body_style), Paragraph(f"<b>{prediction_data.get('predicted_class', 'Unknown')}</b>", bold_style),
             Paragraph("<b>Confidence:</b>", body_style), Paragraph(f"{float(prediction_data.get('confidence', 0.95)) * 100:.1f}%", bold_style)]
        ]

        meta_table = Table(meta_data, colWidths=[105, 160, 115, 160])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 14))

        # Diagnosis Summary
        pred_cls = (prediction_data.get('predicted_class') or '').lower()
        if "late" in pred_cls:
            status_text = "<b>CRITICAL THREAT: Late Blight (<i>Phytophthora infestans</i>)</b><br/>Immediate curative systemic intervention required within 24–48 hours to prevent total canopy destruction."
            box_bg = colors.HexColor("#fef2f2")
            box_border = colors.HexColor("#ef4444")
        elif "early" in pred_cls:
            status_text = "<b>MODERATE RISK: Early Blight (<i>Alternaria solani</i>)</b><br/>Fungal foliar infection identified. Apply protectant/systemic fungicide spray and inspect lower canopy."
            box_bg = colors.HexColor("#fffbeb")
            box_border = colors.HexColor("#f59e0b")
        else:
            status_text = "<b>CLEAN SPECIMEN: Healthy Foliage</b><br/>No active pathogen sporulation or lesion necrotic tissue detected. Maintain standard scouting cadence."
            box_bg = colors.HexColor("#f0fdf4")
            box_border = colors.HexColor("#22c55e")

        summary_table = Table([[Paragraph(status_text, body_style)]], colWidths=[540])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), box_bg),
            ('BOX', (0, 0), (-1, -1), 1.5, box_border),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 14))

        # Prescription & Chemical Treatment Table
        elements.append(Paragraph("🧪 Recommended Treatment & IPM Protocol", h2_style))
        
        rx_data = [
            [Paragraph("<b>Category</b>", bold_style), Paragraph("<b>Active Ingredient / Commercial Form</b>", bold_style), Paragraph("<b>FRAC Code</b>", bold_style), Paragraph("<b>Dosage Rate</b>", bold_style)],
            [Paragraph("Protectant", body_style), Paragraph("Mancozeb 75% WP / Chlorothalonil", body_style), Paragraph("M03 / M05", body_style), Paragraph("2.0–2.5 kg/ha", body_style)],
            [Paragraph("Systemic Curative", body_style), Paragraph("Metalaxyl-M + Mancozeb (Ridomil)", body_style), Paragraph("4 + M03", body_style), Paragraph("2.5 kg/ha", body_style)],
            [Paragraph("Strobilurin / Triazole", body_style), Paragraph("Azoxystrobin + Difenoconazole", body_style), Paragraph("11 + 3", body_style), Paragraph("0.5 L/ha", body_style)],
            [Paragraph("Biological", body_style), Paragraph("Copper Hydroxide / <i>Bacillus subtilis</i>", body_style), Paragraph("M01 / Bio", body_style), Paragraph("1.5–2.0 kg/ha", body_style)]
        ]
        
        rx_table = Table(rx_data, colWidths=[100, 220, 90, 130])
        rx_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(rx_table)
        elements.append(Spacer(1, 14))

        # Agronomist Advisory & Weather Considerations
        elements.append(Paragraph("🌦️ Field Sanitation & Weather Advisory", h2_style))
        advisory_bullets = [
            "• <b>Humidity Control:</b> Avoid overhead sprinkler irrigation during high humidity (>85% RH) to minimize continuous leaf wetness.",
            "• <b>Fungicide Resistance Management:</b> Rotate FRAC groups (e.g. Group 4, Group 11, Group M) every spray cycle.",
            "• <b>Tuber Protection:</b> Maintain good soil hilling over ridges to prevent rain-washed sporangia reaching tubers.",
            "• <b>Withholding Period:</b> Observe mandatory pre-harvest intervals (PHI) of 7–14 days for all synthetic chemicals."
        ]
        for bullet in advisory_bullets:
            elements.append(Paragraph(bullet, body_style))
            elements.append(Spacer(1, 3))

        elements.append(Spacer(1, 16))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceAfter=10))

        # Sign-off & Disclaimers
        footer_text = "<i>Disclaimer: This automated diagnostic report is generated by Potato Disease AI neural networks. Always calibrate chemical applications according to local pesticide regulatory guidelines and confirm with a certified agronomist.</i>"
        elements.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], fontSize=7.5, textColor=colors.HexColor("#6b7280"))))

        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
    except Exception as e:
        logger.error(f"Failed to generate PDF: {e}")
        # Fallback simple text-based output
        return f"Potato Disease AI Report\nDiagnosis: {prediction_data.get('predicted_class')}\nConfidence: {prediction_data.get('confidence')}".encode('utf-8')
