"""Report generation + listing.

POST /api/reports/generate  body: { period_start?, period_end?, title? }
                            -> { id, title, summary, ... } and stores PDF in memory.
GET  /api/reports           -> list of past report metadata
GET  /api/reports/:id       -> metadata
GET  /api/reports/:id/file  -> the PDF (application/pdf)
"""
from datetime import datetime
from io import BytesIO
from threading import RLock

from flask import Blueprint, jsonify, request, send_file

from services import mock_store, reports
from services.auth import require_auth, rate_limit

bp = Blueprint("reports", __name__)

# In-process PDF byte cache. Replaced by Supabase Storage in Phase 10.
_PDF_CACHE: dict[str, bytes] = {}
_lock = RLock()


@bp.get("")
def list_reports():
    return jsonify(mock_store.list_reports())


@bp.get("/<rid>")
def get_report(rid):
    r = mock_store.get_report(rid)
    if not r:
        return jsonify(error="not_found"), 404
    return jsonify(r)


@bp.get("/<rid>/file")
def get_report_file(rid):
    with _lock:
        pdf = _PDF_CACHE.get(rid)
    if not pdf:
        return jsonify(error="not_found"), 404
    meta = mock_store.get_report(rid) or {}
    name = (meta.get("title") or f"fundsight-report-{rid}").replace(" ", "_") + ".pdf"
    return send_file(BytesIO(pdf), mimetype="application/pdf",
                     as_attachment=True, download_name=name)


@bp.post("/generate")
@require_auth()
@rate_limit(max_requests=5, window_seconds=60)
def generate():
    payload = request.get_json(silent=True) or {}
    period_start = payload.get("period_start") or None
    period_end = payload.get("period_end") or None
    title = payload.get("title") or f"Report {datetime.utcnow().strftime('%b %Y')}"

    pdf, summary = reports.build_pdf(period_start, period_end)

    meta = {
        "title": title,
        "period_start": period_start,
        "period_end": period_end,
        "summary": summary,
        "kpis": summary["kpis"],
        "size_bytes": summary["size_bytes"],
        "generated_at": summary["generated_at"],
    }
    record = mock_store.add_report(meta)
    with _lock:
        _PDF_CACHE[record["id"]] = pdf
    return jsonify(record), 201
