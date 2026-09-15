from fastapi import APIRouter, Request
from fastapi.responses import Response
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from datetime import datetime

router = APIRouter()

@router.post("/passport/pdf", tags=["Passport"])
async def generate_passport_post(request: Request):
    try:
        data = await request.json()
    except:
        data = {}
    return generate_pdf(data)

@router.get("/passport/pdf/{borrower_id}", tags=["Passport"])
async def get_passport_get(borrower_id: str):
    return generate_pdf({"borrower_id": borrower_id})


def safe_pct(val):
    """Return a percentage string for a 0-1 float or integer."""
    try:
        f = float(val)
        if f <= 1.0:
            return f"{round(f * 100)}%"
        return f"{round(f)}%"
    except:
        return str(val)


def safe_score(val):
    """Return a score out of 900 string."""
    try:
        return f"{round(float(val))} / 900"
    except:
        return str(val)


def draw_section_header(p, y, title, page_width=letter[0]):
    p.setFillColorRGB(0.09, 0.15, 0.37)  # navy
    p.rect(50, y - 4, page_width - 100, 22, fill=1, stroke=0)
    p.setFillColorRGB(1, 1, 1)
    p.setFont("Helvetica-Bold", 11)
    p.drawString(58, y + 4, title)
    p.setFillColorRGB(0, 0, 0)
    return y - 30


def draw_line(p, y, label, value, page_width=letter[0]):
    p.setFont("Helvetica-Bold", 9)
    p.setFillColorRGB(0.2, 0.2, 0.2)
    p.drawString(70, y, label + ":")
    p.setFont("Helvetica", 9)
    p.setFillColorRGB(0.1, 0.1, 0.1)
    p.drawString(280, y, str(value))
    # light separator
    p.setStrokeColorRGB(0.85, 0.85, 0.85)
    p.line(70, y - 4, page_width - 50, y - 4)
    return y - 18


def generate_pdf(data: dict):
    buffer = BytesIO()
    page_w, page_h = letter
    p = canvas.Canvas(buffer, pagesize=letter)

    borrower_id = data.get("borrower_id", "CUSTOM_APPLICANT")
    credx_score = data.get("credx_score", "N/A")
    risk_band = data.get("risk_band", "N/A")
    approval_likelihood = data.get("approval_likelihood", None)
    sub_scores = data.get("sub_scores", {})
    positives = data.get("top_positive_contributors", [])
    negatives = data.get("top_negative_contributors", [])
    disclaimer = data.get("disclaimer", "")
    generated_on = datetime.now().strftime("%d %B %Y, %I:%M %p")

    # ── HEADER BANNER ──────────────────────────────────────────────
    p.setFillColorRGB(0.09, 0.15, 0.37)  # navy
    p.rect(0, page_h - 90, page_w, 90, fill=1, stroke=0)

    p.setFillColorRGB(1, 1, 1)
    p.setFont("Helvetica-Bold", 22)
    p.drawString(50, page_h - 42, "CredX Alternative Credit Passport")
    p.setFont("Helvetica", 10)
    p.drawString(50, page_h - 62, f"Applicant ID: {borrower_id}   |   Generated: {generated_on}")

    # ── SCORE BLOCK ─────────────────────────────────────────────────
    score_color = (0.09, 0.6, 0.38) if str(risk_band).lower() == "low" else \
                  (0.86, 0.6, 0.07) if str(risk_band).lower() == "medium" else \
                  (0.85, 0.22, 0.22)
    
    p.setFillColorRGB(*score_color)
    p.roundRect(50, page_h - 175, 200, 72, 8, fill=1, stroke=0)
    p.setFillColorRGB(1, 1, 1)
    p.setFont("Helvetica-Bold", 36)
    p.drawString(68, page_h - 143, str(credx_score))
    p.setFont("Helvetica", 11)
    p.drawString(68, page_h - 162, "/ 900  ·  CredX Score")

    p.setFillColorRGB(0.2, 0.2, 0.2)
    p.setFont("Helvetica-Bold", 12)
    p.drawString(275, page_h - 120, f"Risk Band: {risk_band}")
    if approval_likelihood is not None:
        al_pct = round(float(approval_likelihood) * 100) if float(approval_likelihood) <= 1 else round(float(approval_likelihood))
        p.setFont("Helvetica", 11)
        p.drawString(275, page_h - 140, f"Approval Likelihood: {al_pct}%")

    y = page_h - 200

    # ── SUB-SCORES ──────────────────────────────────────────────────
    y = draw_section_header(p, y, "CREDIT HEALTH SUB-SCORES")
    y = draw_line(p, y, "Income Stability", safe_score(sub_scores.get("income_stability", "N/A")))
    y = draw_line(p, y, "Payment Reliability", safe_score(sub_scores.get("payment_reliability", "N/A")))
    y = draw_line(p, y, "Transaction Behaviour", safe_score(sub_scores.get("digital_behaviour", "N/A")))
    y -= 10

    # ── TOP POSITIVE CONTRIBUTORS ────────────────────────────────────
    y = draw_section_header(p, y, "TOP STRENGTHS (Positive SHAP Contributors)")
    if positives:
        for c in positives:
            label = c.get("feature_label", c.get("feature", "Unknown"))
            val = c.get("feature_value", "")
            shap = c.get("shap_value", "")
            y = draw_line(p, y, label, f"Value: {val}  |  Impact: +{round(float(shap), 3)}")
            if y < 120:
                p.showPage()
                y = page_h - 60
    else:
        p.setFont("Helvetica-Oblique", 9)
        p.setFillColorRGB(0.5, 0.5, 0.5)
        p.drawString(70, y, "No positive contributors recorded.")
        y -= 20
    y -= 10

    # ── TOP NEGATIVE CONTRIBUTORS ────────────────────────────────────
    y = draw_section_header(p, y, "AREAS FOR IMPROVEMENT (Negative SHAP Contributors)")
    if negatives:
        for c in negatives:
            label = c.get("feature_label", c.get("feature", "Unknown"))
            val = c.get("feature_value", "")
            shap = c.get("shap_value", "")
            y = draw_line(p, y, label, f"Value: {val}  |  Impact: {round(float(shap), 3)}")
            if y < 120:
                p.showPage()
                y = page_h - 60
    else:
        p.setFont("Helvetica-Oblique", 9)
        p.setFillColorRGB(0.5, 0.5, 0.5)
        p.drawString(70, y, "No negative contributors found — strong profile!")
        y -= 20
    y -= 10

    # ── DISCLAIMER ──────────────────────────────────────────────────
    if y < 140:
        p.showPage()
        y = page_h - 60

    y = draw_section_header(p, y, "DISCLAIMER")
    p.setFont("Helvetica-Oblique", 8)
    p.setFillColorRGB(0.4, 0.4, 0.4)
    # Word-wrap disclaimer
    words = disclaimer.split()
    line = ""
    for word in words:
        if len(line + " " + word) > 100:
            p.drawString(70, y, line.strip())
            y -= 14
            line = word
        else:
            line += " " + word
    if line:
        p.drawString(70, y, line.strip())
        y -= 14

    # ── FOOTER ──────────────────────────────────────────────────────
    p.setFillColorRGB(0.09, 0.15, 0.37)
    p.rect(0, 0, page_w, 36, fill=1, stroke=0)
    p.setFillColorRGB(1, 1, 1)
    p.setFont("Helvetica", 8)
    p.drawString(50, 14, "CredX AI — Alternative Credit Intelligence  |  Model: XGBoost (ROC-AUC: 0.92)  |  Not a CIBIL score")
    p.drawRightString(page_w - 50, 14, f"Page 1  |  {generated_on}")

    p.showPage()
    p.save()

    pdf = buffer.getvalue()
    buffer.close()

    headers = {
        'Content-Disposition': f'attachment; filename="CredX_Passport_{borrower_id}.pdf"'
    }
    return Response(content=pdf, headers=headers, media_type="application/pdf")
