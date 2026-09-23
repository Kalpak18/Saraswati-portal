# Saraswati Portal

School result-management portal. Admin uploads Excel result files → parser + preview → report cards (admin + parent-facing). Marathi/English.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind · Supabase (Postgres + Auth + Storage) · xlsx · zod · sonner

## Data model (v2)

```
standards         (10 वी, 9 वी, ...)     per academic year
   └─ divisions   (अ, ब, क)               inside a standard
         └─ students                       (roll_no + optional GR no.)
                └─ exams                   (per division · test_type · year)
                       └─ exam_subjects   (per paper: name, max, date)
                              └─ marks   (per student · per paper)
```

- **Standards + Divisions:** clean two-level hierarchy. "10th SSC / अ" = standard `10 वी` → division `अ`.
- **GR (General Register) no.:** stable per-student identifier. Optional but unique when present.
- **Roll no.:** changes year-to-year — not the identity.
- Room for **attendance / fees / promotion / TC** later without schema change.

## First-time setup

### 1. Create Supabase project
https://supabase.com/dashboard/projects → New project. Copy from Project Settings → API:
- Project URL (`https://xxxxx.supabase.co`)
- anon public key
- service_role secret key

### 2. Run the schema
Supabase SQL Editor → paste `supabase/schema.sql` → Run.

### 3. Create admin user
Supabase → Authentication → Users → Add user → set email + password, tick "Auto Confirm".

### 4. Env
```bash
cp .env.local.example .env.local
```
Fill in the 3 keys.

### 5. Run
```bash
npm install
npm run dev
```
Open http://localhost:3000 (parents land on `/lookup`; admin uses `/login`).

## Migrating from v1 (if you already ran the old schema)

Run this once in Supabase SQL Editor to wipe, then re-run `schema.sql`:
```sql
drop table if exists marks, exam_subjects, exams, students, divisions,
                     standards, classes, school_settings cascade;
drop function if exists set_updated_at() cascade;
```

## Routes

**Admin (auth-gated)**
- `/admin` — dashboard
- `/admin/classes` — Standards & Divisions
- `/admin/students?division=<id>` — Students in a division
- `/admin/templates` — download Excel templates
- `/admin/settings` — school name / logo
- `/admin/results` — list of uploaded exams
- `/admin/results/upload` — 3-step wizard (pick division → upload → preview & confirm)
- `/admin/results/[examId]` — per-exam student list
- `/admin/results/[examId]/[studentId]` — single report card (print-ready)
- `/admin/results/[examId]/[studentId]/edit` — manual marks correction
- `/admin/results/[examId]/print-all` — all cards, one per page

**Parent (public)**
- `/lookup` — mobile + DOB → child(ren) → exam → card
- `/lookup/[examId]/[studentId]` — parent view of card

## Excel templates

Go to **Admin → Templates**. Download-and-fill for:

1. **Students roster** — bulk-add students to a division.
2. **Result — single student**
3. **Result — bulk (stacked)** — N students, one block after another in one sheet
4. **Result — bulk (multi-sheet)** — one workbook, one sheet per student

Each template includes a "How to fill" sheet inside.

## Result file layout (all templates match this)

- Row 1 title: `<Class> <Test type> <Academic year>` — e.g. `10 वी आठवडी परीक्षा 2026-27`
- `विद्यार्थ्याचे नाव : <name>` row
- Table headers: `पेपर क्र | दिनांक | विषय | गुण | पैकी गुण | Grade`

### Upload wizard behaviour

For each detected student, admin picks one of three actions on the Preview screen:
- **Map** to an existing student in the roster (auto-selected when name matches)
- **Create new** — inline form: roll no, GR (optional), mobile, DOB. Student is created + linked in the same save.
- **Skip**

Name matching is honorific-tolerant (`कु.`, `सौ`, `श्री.` etc. stripped) and forgiving with typos.

## Deployment

Push to GitHub → import to Vercel → paste the 3 env vars → deploy.
