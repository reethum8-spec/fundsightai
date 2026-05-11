"""Generate `sample_expenses.csv` — a realistic INR demo dataset for FundSight AI.

Design goals:
- Deterministic (seeded) so re-runs produce identical output.
- 220 transactions blended across Personal / Business / Institution user types.
- Realistic Indian merchants, amounts, payment mix (UPI heavy), and date spread.
- Includes a few obvious anomalies (very large amounts) so the AI engine has
  something to flag.

Run:
    python sample_data/generate.py

Outputs:
    sample_data/sample_expenses.csv
    frontend/public/sample_expenses.csv  (mirror, served as a static asset)
"""
from __future__ import annotations

import csv
import random
from datetime import date, timedelta
from pathlib import Path

SEED = 42
ROWS = 220
END = date.today()
START = END - timedelta(days=180)  # ~6 months of history

# (category, payment_methods_weighted, [(description, low, high), ...])
CATALOG: dict[str, dict] = {
    # ---------- Personal ----------
    "Food": {
        "users": ["Personal"],
        "methods": ["UPI", "UPI", "UPI", "Cash", "Card"],
        "items": [
            ("Swiggy order — biryani", 280, 720),
            ("Zomato — pizza & cola", 320, 850),
            ("Dominos delivery", 450, 1100),
            ("Big Bazaar groceries", 1200, 4800),
            ("DMart monthly groceries", 1800, 6500),
            ("Reliance Smart vegetables", 320, 1400),
            ("Local kirana store", 150, 900),
            ("Cafe Coffee Day", 220, 540),
            ("Starbucks coffee", 380, 720),
            ("Haldiram's snacks", 180, 460),
            ("Restaurant dinner — family", 1400, 4200),
        ],
    },
    "Travel": {
        "users": ["Personal", "Business"],
        "methods": ["Card", "UPI", "NetBanking", "Card"],
        "items": [
            ("Uber ride — airport", 380, 1100),
            ("Ola auto to office", 80, 320),
            ("IRCTC train tickets", 540, 3200),
            ("IndiGo flight — Mumbai-Delhi", 4200, 9800),
            ("Air India flight", 5200, 12000),
            ("Petrol — HP pump", 1200, 3800),
            ("Toll — FASTag recharge", 500, 2000),
            ("OYO hotel — 2 nights", 2400, 6800),
            ("MakeMyTrip — vacation pkg", 18000, 65000),
            ("Metro card recharge", 200, 600),
        ],
    },
    "Rent": {
        "users": ["Personal", "Business"],
        "methods": ["NetBanking", "BankTransfer", "NetBanking"],
        "items": [
            ("Monthly apartment rent — 2BHK", 22000, 48000),
            ("PG room rent", 9000, 16000),
            ("Office space rent — co-working", 18000, 42000),
            ("Warehouse rent", 35000, 95000),
        ],
    },
    "Shopping": {
        "users": ["Personal"],
        "methods": ["Card", "UPI", "Card", "NetBanking"],
        "items": [
            ("Amazon — electronics", 1200, 18000),
            ("Flipkart — apparel", 800, 6500),
            ("Myntra — clothing", 1100, 5200),
            ("Croma — headphones", 2400, 12000),
            ("Reliance Digital — TV", 22000, 65000),
            ("Lifestyle store", 1500, 8800),
            ("Decathlon — sportswear", 800, 4200),
            ("Nykaa — beauty", 600, 3400),
        ],
    },
    "Healthcare": {
        "users": ["Personal", "Institution"],
        "methods": ["Card", "UPI", "Cash", "NetBanking"],
        "items": [
            ("Apollo Pharmacy — medicines", 280, 1800),
            ("Doctor consultation — Practo", 600, 1500),
            ("Dr Lal PathLabs — blood test", 800, 3200),
            ("Hospital admission — diagnostics", 4500, 28000),
            ("Dental cleaning", 1500, 4500),
            ("Eye checkup + glasses", 2200, 7800),
            ("Health insurance premium", 8500, 28000),
        ],
    },
    "Education": {
        "users": ["Personal", "Institution"],
        "methods": ["NetBanking", "Card", "BankTransfer"],
        "items": [
            ("School term fees", 18000, 72000),
            ("BYJU's annual subscription", 12000, 32000),
            ("Coursera specialization", 3200, 9500),
            ("Udemy — bundle of courses", 480, 2200),
            ("Engineering tuition fees", 25000, 95000),
            ("Books — academic", 600, 3800),
            ("Coaching — JEE prep", 28000, 78000),
        ],
    },
    "Utilities": {
        "users": ["Personal", "Business", "Institution"],
        "methods": ["UPI", "NetBanking", "UPI"],
        "items": [
            ("Electricity bill — Tata Power", 1800, 6800),
            ("Water bill — BWSSB", 320, 980),
            ("Airtel postpaid mobile", 499, 1499),
            ("Jio fiber broadband", 799, 2499),
            ("Gas cylinder — Indane", 950, 1150),
            ("Society maintenance", 2200, 5800),
        ],
    },
    "Subscriptions": {
        "users": ["Personal", "Business", "Institution"],
        "methods": ["Card", "Card", "UPI"],
        "items": [
            ("Netflix premium", 649, 649),
            ("Amazon Prime annual", 1499, 1499),
            ("Disney+ Hotstar", 299, 1499),
            ("Spotify family", 179, 199),
            ("YouTube Premium", 129, 189),
            ("Microsoft 365 — family", 4899, 5299),
            ("Adobe Creative Cloud", 1675, 4230),
            ("Zoom Pro", 1340, 1340),
            ("Notion team plan", 800, 2400),
            ("GitHub team", 320, 1280),
        ],
    },
    "Donations": {
        "users": ["Personal", "Institution"],
        "methods": ["NetBanking", "UPI", "BankTransfer"],
        "items": [
            ("CRY — child welfare donation", 500, 5000),
            ("Akshaya Patra meal donation", 1000, 12000),
            ("Goonj — clothing drive", 800, 4500),
            ("Smile Foundation — education", 2500, 15000),
            ("PM CARES contribution", 1000, 10000),
            ("Local temple — annadanam", 500, 5100),
        ],
    },
    "Office Supplies": {
        "users": ["Business", "Institution"],
        "methods": ["Card", "NetBanking", "Cash"],
        "items": [
            ("A4 paper — 5 reams", 1200, 2400),
            ("Printer toner cartridges", 2800, 6500),
            ("Stationery — pens, files", 600, 2200),
            ("Whiteboard markers + erasers", 320, 980),
            ("Office chairs (2 units)", 8500, 22000),
            ("Laptop accessories — keyboard, mouse", 1800, 6500),
            ("Coffee machine refill", 1200, 4800),
        ],
    },
    "Salaries": {
        "users": ["Business", "Institution"],
        "methods": ["BankTransfer", "NetBanking"],
        "items": [
            ("Monthly payroll — Engineering", 180000, 480000),
            ("Salary — Field officer", 28000, 65000),
            ("Salary — Operations manager", 65000, 145000),
            ("Salary — Program coordinator", 38000, 78000),
            ("Salary — Accountant", 32000, 62000),
            ("Contractor invoice", 25000, 145000),
            ("Stipend — interns batch", 18000, 45000),
        ],
    },
    "Maintenance": {
        "users": ["Personal", "Business", "Institution"],
        "methods": ["UPI", "Cash", "Card"],
        "items": [
            ("AC servicing — split unit", 600, 1800),
            ("Plumber — leak repair", 400, 2200),
            ("Electrician — wiring fix", 500, 3500),
            ("Generator diesel + service", 4200, 12000),
            ("Vehicle service — Maruti", 3500, 12000),
            ("Office deep cleaning", 2800, 8500),
            ("Pest control quarterly", 1500, 4500),
            ("Building repair — paint job", 18000, 85000),
        ],
    },
}


def main() -> Path:
    rng = random.Random(SEED)
    out_dir = Path(__file__).resolve().parent
    out_dir.mkdir(parents=True, exist_ok=True)

    rows: list[dict] = []

    # Build a flat pool of (category, item, user_pool, method_pool)
    pool: list[tuple] = []
    for cat, spec in CATALOG.items():
        for item in spec["items"]:
            pool.append((cat, item, spec["users"], spec["methods"]))

    span_days = (END - START).days

    for _ in range(ROWS):
        cat, (desc, lo, hi), users, methods = rng.choice(pool)
        # Skew toward "round-ish" amounts; bias slightly under the mid-point
        amt_raw = rng.uniform(lo, hi)
        # Round to nearest 10 for small, 50 for medium, 100 for large
        if amt_raw < 1000:
            amount = int(round(amt_raw / 10) * 10)
        elif amt_raw < 20000:
            amount = int(round(amt_raw / 50) * 50)
        else:
            amount = int(round(amt_raw / 100) * 100)

        d = START + timedelta(days=rng.randint(0, span_days))
        rows.append({
            "Date": d.isoformat(),
            "Amount": amount,
            "Category": cat,
            "Description": desc,
            "PaymentMethod": rng.choice(methods),
            "UserType": rng.choice(users),
        })

    # Inject a handful of obvious anomalies for the AI engine to flag.
    anomalies = [
        ("Annual office license — bulk renewal", 285000, "Subscriptions", "NetBanking", "Business"),
        ("Emergency medical airlift", 425000, "Healthcare", "Card", "Personal"),
        ("Capital equipment — server rack", 685000, "Office Supplies", "BankTransfer", "Business"),
        ("Disaster relief — flood response", 950000, "Donations", "BankTransfer", "Institution"),
    ]
    for desc, amount, cat, method, user in anomalies:
        d = START + timedelta(days=rng.randint(0, span_days))
        rows.append({
            "Date": d.isoformat(),
            "Amount": amount,
            "Category": cat,
            "Description": desc,
            "PaymentMethod": method,
            "UserType": user,
        })

    # Sort newest → oldest for nicer preview
    rows.sort(key=lambda r: r["Date"], reverse=True)

    out_csv = out_dir / "sample_expenses.csv"
    with out_csv.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["Date", "Amount", "Category", "Description", "PaymentMethod", "UserType"],
        )
        w.writeheader()
        w.writerows(rows)

    # Mirror into frontend/public so the UI can fetch it as a static asset.
    public = out_dir.parent / "frontend" / "public" / "sample_expenses.csv"
    public.parent.mkdir(parents=True, exist_ok=True)
    public.write_bytes(out_csv.read_bytes())

    print(f"Wrote {len(rows)} rows -> {out_csv}")
    print(f"Mirrored          -> {public}")
    return out_csv


if __name__ == "__main__":
    main()
