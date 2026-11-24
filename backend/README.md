# Trusted admin bootstrap (Python)

This helper assigns a role to an existing Supabase Auth user. It must run locally by the project owner.

1. Create the user's account from the portal sign-up form.
2. In Supabase Authentication > Users, copy that user's UUID.
3. Set environment variables in a private terminal:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - ADMIN_USER_ID
   - ADMIN_ROLE (owner/founder/supervisor/admin/moderator/support/faction_leader)
4. Install dependencies: `python -m pip install -r requirements.txt`
5. Run: `python bootstrap_admin.py`

Never commit the service role key, a .env file, or credentials to GitHub. Do not use the existing DJ Caspian database for this portal; create a separate Caspian project first.
