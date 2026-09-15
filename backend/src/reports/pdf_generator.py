"""
CredX - Alternative Credit Passport PDF Generator
Builds a downloadable, official-grade Credit Passport PDF using ReportLab.
Includes:
- Credit Score (300-900) & Risk Band
- Approval Probability
- Income Stability, Payment Reliability, Digital Trust Scores
- Recognized Strengths & Areas for Improvement
- 30 / 60 / 90-Day Action Plan
- Time-to-Approval Estimate
"""

import io
import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


def generate_credit_passport_pdf(
    borrower_profile: dict,
    score_data: dict,
    explain_data: dict,
    advice_data: dict,
    trajectory_data: dict = None
) -> bytes:
    """Generate Alternative Credit Passport PDF in memory and return raw bytes."""
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
    
    # Custom Palette
    c_primary = colors.HexColor("#0F172A")    # Deep Slate / Navy
    c_brand = colors.HexColor("#2563EB")      # Vibrant Blue
    c_accent = colors.HexColor("#10B981")     # Emerald Green
    c_dark_accent = colors.HexColor("#047857")
    c_muted = colors.HexColor("#64748B")      # Muted gray
    c_light_bg = colors.HexColor("#F8FAFC")   # Light background
    c_border = colors.HexColor("#E2E8F0")

    # Typography Styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=c_primary,
        alignment=TA_LEFT
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=c_muted,
        alignment=TA_LEFT
    )

    h2_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=c_primary,
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        "BodyTextCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155")
    )

    bullet_style = ParagraphStyle(
        "BulletCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1E293B"),
        leftIndent=12
    )

    score_huge_style = ParagraphStyle(
        "ScoreHuge",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=32,
        leading=36,
        textColor=c_brand,
        alignment=TA_CENTER
    )

    badge_style = ParagraphStyle(
        "RiskBadge",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.white,
        alignment=TA_CENTER
    )

    story = []

    # 1. Header: Logo & Title
    header_data = [
        [
            Paragraph("<b>CredX</b> | Alternative Credit Passport", title_style),
            Paragraph(f"Date: {datetime.now().strftime('%d %b %Y')}<br/>Ref: CRX-{borrower_profile.get('borrower_id', '99999')}", ParagraphStyle("HDate", parent=styles["Normal"], fontName="Helvetica", fontSize=8.5, alignment=TA_RIGHT, textColor=c_muted))
        ]
    ]
    t_header = Table(header_data, colWidths=[4.5 * inch, 2.5 * inch])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_header)
    story.append(Paragraph("Creditworthiness Beyond CIBIL for the Modern Informal & Gig Economy", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_brand, spaceBefore=2, spaceAfter=10))

    # 2. Borrower Summary & Score Card
    b_id = borrower_profile.get("borrower_id", "Applicant")
    b_type = str(borrower_profile.get("borrower_type", "Gig Worker")).title()
    emp_type = str(borrower_profile.get("employment_type", "Self-employed")).title()
    state = str(borrower_profile.get("state", "India")).title()
    loan_amt = float(borrower_profile.get("loan_amount_requested", 0.0))

    c_score = score_data.get("credit_score", 650)
    risk_band = score_data.get("risk_band", "Medium Risk")
    approval_prob = score_data.get("approval_probability", 70.0)

    risk_bg = c_accent if "Low" in risk_band else (colors.HexColor("#F59E0B") if "Medium" in risk_band else colors.HexColor("#EF4444"))

    profile_content = f"""
    <b>Borrower ID:</b> {b_id}<br/>
    <b>Category:</b> {b_type} ({emp_type})<br/>
    <b>Location:</b> {state}<br/>
    <b>Loan Requested:</b> ₹{loan_amt:,.2f}<br/>
    <b>Tenure:</b> {borrower_profile.get('loan_tenure_months', 24)} Months
    """

    score_box_data = [
        [
            Paragraph(profile_content, body_style),
            Paragraph(f"{c_score}", score_huge_style),
            Paragraph(f"<font color='white'><b>{risk_band}</b></font>", badge_style)
        ],
        [
            "",
            Paragraph("<font size=8 color='#64748B'>TrustScore (300–900)</font>", ParagraphStyle("SubScore", parent=styles["Normal"], alignment=TA_CENTER)),
            Paragraph(f"<font size=8.5 color='#334155'>Approval Chance: <b>{approval_prob}%</b></font>", ParagraphStyle("SubAppr", parent=styles["Normal"], alignment=TA_CENTER))
        ]
    ]

    t_score_box = Table(score_box_data, colWidths=[3.2 * inch, 2.0 * inch, 1.8 * inch])
    t_score_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_light_bg),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (2, -1), 'CENTER'),
        ('BACKGROUND', (2, 0), (2, 0), risk_bg),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_score_box)
    story.append(Spacer(1, 10))

    # 3. Behavioral Pillars Table
    story.append(Paragraph("Core Alternative Financial Pillars", h2_style))
    pillars = score_data.get("pillars", {})
    p_data = [
        [
            Paragraph("<b>Pillar Metric</b>", body_style),
            Paragraph("<b>Observed Value</b>", body_style),
            Paragraph("<b>Benchmark Score</b>", body_style),
            Paragraph("<b>Discipline Status</b>", body_style)
        ],
        [
            Paragraph("Income Stability Score", body_style),
            Paragraph(f"₹{pillars.get('avg_income', 0):,.0f} / mo avg", body_style),
            Paragraph(f"<b>{pillars.get('income_stability_score', 0)} / 100</b>", body_style),
            Paragraph("Stable" if pillars.get('income_stability_score', 0) >= 65 else "Moderate Volatility", body_style)
        ],
        [
            Paragraph("Payment Reliability Score", body_style),
            Paragraph(f"Util: {pillars.get('utility_payment_rate', 0)}% | Rent: {pillars.get('rent_reliability_rate', 0)}%", body_style),
            Paragraph(f"<b>{pillars.get('payment_reliability_score', 0)} / 100</b>", body_style),
            Paragraph("Consistent" if pillars.get('payment_reliability_score', 0) >= 65 else "Needs Attention", body_style)
        ],
        [
            Paragraph("Digital Trust Score", body_style),
            Paragraph(f"{pillars.get('mobile_years', 0)} yrs mobile active", body_style),
            Paragraph(f"<b>{pillars.get('digital_trust_score', 0)} / 100</b>", body_style),
            Paragraph("Established" if pillars.get('digital_trust_score', 0) >= 50 else "Building History", body_style)
        ]
    ]
    t_pillars = Table(p_data, colWidths=[2.2 * inch, 2.0 * inch, 1.4 * inch, 1.4 * inch])
    t_pillars.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_pillars)
    story.append(Spacer(1, 10))

    # 4. Strengths & Vulnerabilities Side-by-Side
    story.append(Paragraph("Explainable AI Insights (SHAP Factor Analysis)", h2_style))
    strengths = explain_data.get("strengths", [])[:3]
    weaknesses = explain_data.get("weaknesses", [])[:3]

    str_items = "".join([f"<font color='#047857'><b>✓</b></font> <b>{s['title']}:</b> {s['description']}<br/><br/>" for s in strengths])
    weak_items = "".join([f"<font color='#DC2626'><b>✕</b></font> <b>{w['title']}:</b> {w['description']}<br/><br/>" for w in weaknesses])

    shap_table_data = [
        [
            Paragraph("<font color='#047857'><b>Recognized Financial Strengths</b></font>", h2_style),
            Paragraph("<font color='#DC2626'><b>Impact Factors Hurting Score</b></font>", h2_style)
        ],
        [
            Paragraph(str_items or "Consistent performance in digital transactions.", bullet_style),
            Paragraph(weak_items or "Income variability across seasonal cycles.", bullet_style)
        ]
    ]
    t_shap = Table(shap_table_data, colWidths=[3.5 * inch, 3.5 * inch])
    t_shap.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#ECFDF5")),
        ('BACKGROUND', (1, 0), (1, -1), colors.HexColor("#FEF2F2")),
        ('BOX', (0, 0), (0, -1), 0.5, colors.HexColor("#A7F3D0")),
        ('BOX', (1, 0), (1, -1), 0.5, colors.HexColor("#FECACA")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_shap)
    story.append(Spacer(1, 10))

    # 5. Personalized Improvement Roadmap (30/60/90 Days)
    story.append(Paragraph("Personalized 90-Day Credit Improvement Roadmap", h2_style))
    plan = advice_data.get("improvement_plan", {})
    plan_data = [
        [
            Paragraph("<font color='#2563EB'><b>Month 1 (30 Days)</b></font>", body_style),
            Paragraph(plan.get("day_30", "Settle all pending utility notices and pay the next cycle on time."), body_style)
        ],
        [
            Paragraph("<font color='#2563EB'><b>Month 2 (60 Days)</b></font>", body_style),
            Paragraph(plan.get("day_60", "Maintain continuous digital transaction velocity through active UPI payments."), body_style)
        ],
        [
            Paragraph("<font color='#2563EB'><b>Month 3 (90 Days)</b></font>", body_style),
            Paragraph(plan.get("day_90", "Preserve steady monthly balance buffers and rent receipts to cross prime threshold."), body_style)
        ]
    ]
    t_plan = Table(plan_data, colWidths=[1.8 * inch, 5.2 * inch])
    t_plan.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#EFF6FF")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_plan)
    story.append(Spacer(1, 8))

    # 6. Time-to-Approval Summary
    time_summary = advice_data.get("time_to_approval_summary", "2 to 3 months to reach 80%+ loan readiness.")
    story.append(Paragraph(f"<b>Estimated Time-to-Approval:</b> {time_summary}", body_style))
    story.append(Spacer(1, 10))

    # 7. Verification Footer
    disclaimer_text = """
    <b>CredX Verification Notice:</b> This Alternative Credit Passport is powered by machine learning algorithms and explainable behavioral heuristics. Designed for credit inclusion under fair lending guidelines. Issued by CredX Alternative Underwriting Engine.
    """
    story.append(HRFlowable(width="100%", thickness=0.5, color=c_border, spaceBefore=4, spaceAfter=4))
    story.append(Paragraph(disclaimer_text, ParagraphStyle("Disc", parent=styles["Normal"], fontSize=7, leading=9, textColor=c_muted, alignment=TA_CENTER)))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
