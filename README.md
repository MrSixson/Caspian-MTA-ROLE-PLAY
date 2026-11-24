# Caspian RolePlay Website

Official Persian RTL website and community portal for Caspian RolePlay.

## Frontend
- `index.html` — cinematic homepage
- `tickets.html` — account sign-in/sign-up and player ticket submission
- `staff.html` — public staff and server-rank directory
- `support.html` — official donation page (payment link intentionally blank until verified)
- `admin.html` — restricted admin console for ticket status, staff profiles and donation URL
- `assets/css/` — responsive visual system
- `assets/js/` — navigation, Supabase portal logic and safe public config

## Backend and database
- `supabase/caspian_schema.sql` — database tables, indexes, explicit API grants and Row Level Security policies
- `backend/bootstrap_admin.py` — trusted one-time Python helper to assign the first owner/admin role
- `backend/requirements.txt` — pinned Python dependency

### Important separation
Do not connect this site to the existing DJ Caspian Supabase project. The Caspian RolePlay portal needs its own dedicated Supabase project. The existing DJ project is unrelated and was not modified.

### Setup checklist
1. Create a dedicated Supabase project for Caspian RolePlay.
2. Run `supabase/caspian_schema.sql` in that project's SQL editor.
3. In `assets/js/config.js`, set only the project's URL and publishable key. Never place a service-role/secret key in browser code.
4. Create the first owner account from `tickets.html`.
5. Follow `backend/README.md` to assign the initial owner role using the Python helper from a private machine.
6. Sign in at `admin.html`, add the approved staff list and official donation URL.
7. Test a normal player account and a staff account before public launch.

## Security notes
- Ticket access is restricted by RLS to the ticket owner and authorized staff.
- Staff roles cannot be assigned from the public browser UI.
- The Python bootstrap helper uses a service-role key only in a private local environment.
- The donation page intentionally shows no payment method until management enters a verified HTTPS URL.
- Never commit secrets, passwords, service-role keys or private environment files.

## Run locally
Open `index.html` for the static homepage. Portal authentication and database-backed features require the dedicated Supabase project configuration.

## Publish with GitHub Pages
In repository Settings > Pages, select **Deploy from a branch**, choose `main` and `/ (root)`, then save.
