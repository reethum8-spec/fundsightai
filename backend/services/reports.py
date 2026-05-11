"""PDF report builder.

Pulls funds + expenses (from mock_store or Supabase), runs the recommendation
engine, and renders a multi-section PDF using ReportLab.

Public API:
    build_pdf(period_start, period_end) -> (bytes, summary_dict)
"""
from __future__ import annotations
import io
from collections import defaultdict
from datetime import date, datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
)
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie

from config import Config
from services import mock_store, recommendations


def _inr(value: float) -> str:
    """Format a number as INR using the Indian numbering system (lakh/crore)."""
    try:
        v = float(value or 0)
    except (TypeError, ValueError):
        v = 0.0
    sign = "-" if v < 0 else ""
    n = int(round(abs(v)))
    s = str(n)
    if len(s) <= 3:
        grouped = s
    else:
        last3 = s[-3:]
        rest = s[:-3]
        # group 'rest' from the right in chunks of 2
        parts = []
        while len(rest) > 2:
            parts.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            parts.insert(0, rest)
        grouped = ",".join(parts) + "," + last3
    return f"{sign}\u20B9{grouped}"


PRIMARY = colors.HexColor("#7c3aed")
ACCENT = colors.HexColor("#22d3ee")
MUTED = colors.HexColor("#71717a")
BORDER = colors.HexColor("#e4e4e7")
DANGER = colors.HexColor("#ef4444")
SUCCESS = colors.HexColor("#10b981")


def _load_data():
    if Config.USE_MOCK:
        return mock_store.list_funds() or [], mock_store.list_expenses() or []
    try:
        from services import db
        funds = db.select("projects", limit=500) or []
        expenses = db.select("expenses", order=("occurred_at", True), limit=5000) or []
        return funds, expenses
    except Exception:
        return [], []


def _filter_expenses(expenses, period_start, period_end):
    out = []
    for e in expenses:
        d = e.get("occurred_at") or e.get("date") or ""
        if period_start and d < period_start:
            continue
        if period_end and d > period_end:
            continue
        out.append(e)
    return out


def _styles():
    s = getSampleStyleSheet()
    s.add(ParagraphStyle("FSTitle", parent=s["Title"], fontSize=28, leading=34,
                         textColor=colors.HexColor("#0a0a0c"), spaceAfter=4))
    s.add(ParagraphStyle("FSSubtitle", parent=s["Normal"], fontSize=11,
                         textColor=MUTED, spaceAfter=18))
    s.add(ParagraphStyle("FSH2", parent=s["Heading2"], fontSize=14, leading=18,
                         textColor=colors.HexColor("#0a0a0c"), spaceBefore=14, spaceAfter=8))
    s.add(ParagraphStyle("FSBody", parent=s["BodyText"], fontSize=10, leading=14,
                         textColor=colors.HexColor("#27272a")))
    s.add(ParagraphStyle("FSMuted", parent=s["BodyText"], fontSize=9, leading=12,
                         textColor=MUTED))
    return s


def _kpi_table(kpis):
    rows = [
        ["Total Funds", _inr(kpis['total_funds'])],
        ["Total Expenses", _inr(kpis['total_expenses'])],
        ["Remaining", _inr(kpis['remaining'])],
        ["Efficiency", f"{kpis['efficiency'] * 100:.0f}%"],
        ["Anomalies flagged", str(kpis["anomalies"])],
        ["Risk Score", f"{kpis['risk']:.2f}"],
    ]
    t = Table(rows, colWidths=[60 * mm, 40 * mm])
    t.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, -1), "Helvetica", 10),
        ("FONT", (1, 0), (1, -1), "Helvetica-Bold", 10),
        ("TEXTCOLOR", (0, 0), (0, -1), MUTED),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, BORDER),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
    ]))
    return t


def _category_chart(by_cat):
    if not by_cat:
        return None
    items = sorted(by_cat.items(), key=lambda kv: kv[1], reverse=True)[:6]
    d = Drawing(440, 170)
    bc = VerticalBarChart()
    bc.x = 30; bc.y = 25; bc.width = 380; bc.height = 130
    bc.data = [[round(v, 0) for _, v in items]]
    bc.categoryAxis.categoryNames = [k for k, _ in items]
    bc.categoryAxis.labels.fontName = "Helvetica"
    bc.categoryAxis.labels.fontSize = 8
    bc.valueAxis.labels.fontName = "Helvetica"
    bc.valueAxis.labels.fontSize = 8
    bc.bars[0].fillColor = PRIMARY
    bc.bars[0].strokeColor = None
    bc.barWidth = 14
    bc.barSpacing = 3
    d.add(bc)
    return d


def _allocation_pie(funds):
    if not funds:
        return None
    by_cat = defaultdict(float)
    for f in funds:
        by_cat[f.get("category", "Other")] += float(f.get("budget") or 0)
    items = sorted(by_cat.items(), key=lambda kv: kv[1], reverse=True)[:6]
    d = Drawing(440, 170)
    p = Pie()
    p.x = 130; p.y = 10; p.width = 150; p.height = 150
    p.data = [v for _, v in items]
    p.labels = [k for k, _ in items]
    p.slices.strokeColor = colors.white
    p.slices.strokeWidth = 1
    palette = [PRIMARY, ACCENT, SUCCESS, colors.HexColor("#f59e0b"),
               DANGER, colors.HexColor("#6366f1")]
    for i, c in enumerate(palette):
        p.slices[i].fillColor = c
    d.add(p)
    return d


def _top_expenses_table(expenses, n=10):
    top = sorted(expenses, key=lambda e: float(e.get("amount") or 0), reverse=True)[:n]
    if not top:
        return Paragraph("<i>No expenses in this period.</i>", _styles()["FSMuted"])
    rows = [["Date", "Category", "Description", "Amount", "AI"]]
    for e in top:
        rows.append([
            (e.get("occurred_at") or e.get("date") or "")[:10],
            e.get("category", ""),
            (e.get("description") or "")[:40],
            _inr(e.get('amount') or 0),
            "⚠" if (e.get("anomaly_flag") or e.get("flag")) else "",
        ])
    t = Table(rows, colWidths=[22 * mm, 28 * mm, 70 * mm, 25 * mm, 10 * mm])
    t.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 9),
        ("FONT", (0, 1), (-1, -1), "Helvetica", 9),
        ("TEXTCOLOR", (0, 0), (-1, 0), MUTED),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fafafa")),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, BORDER),
        ("LINEBELOW", (0, 1), (-1, -2), 0.3, BORDER),
        ("ALIGN", (3, 0), (3, -1), "RIGHT"),
        ("ALIGN", (4, 0), (4, -1), "CENTER"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("TEXTCOLOR", (4, 1), (4, -1), DANGER),
    ]))
    return t


def _insights_block(insights, styles):
    if not insights:
        return [Paragraph("<i>No insights available.</i>", styles["FSMuted"])]
    color_map = {
        "alert": "#ef4444",
        "forecast": "#f59e0b",
        "recommendation": "#7c3aed",
        "positive": "#10b981",
    }
    flow = []
    for it in insights[:6]:
        c = color_map.get(it.get("type", "recommendation"), "#7c3aed")
        title = (
            f'<font color="{c}" name="Helvetica-Bold">'
            f'{it.get("type", "info").upper()}</font> '
            f'<b>{it.get("title", "")}</b>'
        )
        flow.append(Paragraph(title, styles["FSBody"]))
        flow.append(Paragraph(it.get("body", ""), styles["FSMuted"]))
        flow.append(Spacer(1, 6))
    return flow


def _compute_kpis(funds, expenses):
    total_funds = sum(float(f.get("budget") or 0) for f in funds)
    total_exp = sum(float(e.get("amount") or 0) for e in expenses)
    remaining = max(0.0, total_funds - total_exp)
    eff = max(0.0, min(1.0, 1 - total_exp / (total_funds * 1.2))) if total_funds > 0 else 0
    flagged = sum(1 for e in expenses if e.get("anomaly_flag") or e.get("flag"))
    risk = flagged / len(expenses) if expenses else 0.0
    return {
        "total_funds": total_funds,
        "total_expenses": total_exp,
        "remaining": remaining,
        "efficiency": eff,
        "anomalies": flagged,
        "risk": risk,
    }


def build_pdf(period_start: str | None = None,
              period_end: str | None = None) -> tuple[bytes, dict]:
    """Render the report. Returns (pdf_bytes, summary_metadata)."""
    funds, all_expenses = _load_data()
    expenses = _filter_expenses(all_expenses, period_start, period_end)
    kpis = _compute_kpis(funds, expenses)

    by_cat = defaultdict(float)
    for e in expenses:
        by_cat[e.get("category", "Other")] += float(e.get("amount") or 0)

    insights = recommendations.generate()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=22 * mm, rightMargin=22 * mm,
        topMargin=22 * mm, bottomMargin=18 * mm,
        title="FundSight AI — Financial Report",
        author="FundSight AI",
    )
    styles = _styles()
    story = []

    period_label = (
        f"{period_start or '—'} → {period_end or '—'}"
        if (period_start or period_end) else "All time"
    )

    # ---- Cover / header ----
    story.append(Paragraph("FundSight AI", styles["FSTitle"]))
    story.append(Paragraph(f"Financial Report · {period_label}", styles["FSSubtitle"]))
    story.append(Paragraph(
        f"Generated {datetime.utcnow().strftime('%b %d, %Y %H:%M UTC')}",
        styles["FSMuted"],
    ))
    story.append(Spacer(1, 14))

    # ---- KPIs ----
    story.append(Paragraph("Key indicators", styles["FSH2"]))
    story.append(_kpi_table(kpis))

    # ---- Charts ----
    if by_cat:
        story.append(Paragraph("Spending by category", styles["FSH2"]))
        chart = _category_chart(by_cat)
        if chart: story.append(chart)
    if funds:
        story.append(Paragraph("Fund allocation", styles["FSH2"]))
        pie = _allocation_pie(funds)
        if pie: story.append(pie)

    # ---- AI insights ----
    story.append(PageBreak())
    story.append(Paragraph("AI observations", styles["FSH2"]))
    story.extend(_insights_block(insights, styles))

    # ---- Top expenses ----
    story.append(Paragraph("Top expenses in period", styles["FSH2"]))
    story.append(_top_expenses_table(expenses))

    # ---- Footer note ----
    story.append(Spacer(1, 18))
    story.append(Paragraph(
        "<i>This report was generated automatically by FundSight AI. "
        "AI observations combine rule-based analysis with anomaly detection signals.</i>",
        styles["FSMuted"],
    ))

    doc.build(story)
    pdf = buf.getvalue()

    summary = {
        "period_start": period_start,
        "period_end": period_end,
        "kpis": kpis,
        "expenses_count": len(expenses),
        "funds_count": len(funds),
        "insights_count": len(insights),
        "size_bytes": len(pdf),
        "generated_at": datetime.utcnow().isoformat(),
    }
    return pdf, summary
