"""One-time, trusted admin-role bootstrap for the Caspian portal.
Run locally from a private machine. Never deploy the service key to GitHub Pages.
"""
import os
import sys
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
ADMIN_USER_ID = os.environ.get("ADMIN_USER_ID")
ADMIN_ROLE = os.environ.get("ADMIN_ROLE", "owner")
ALLOWED = {"owner", "founder", "supervisor", "admin", "moderator", "support", "faction_leader"}

def main() -> int:
    missing = [name for name, value in {
        "SUPABASE_URL": SUPABASE_URL,
        "SUPABASE_SERVICE_ROLE_KEY": SUPABASE_SERVICE_ROLE_KEY,
        "ADMIN_USER_ID": ADMIN_USER_ID,
    }.items() if not value]
    if missing:
        print("Missing environment variables: " + ", ".join(missing), file=sys.stderr)
        return 2
    if ADMIN_ROLE not in ALLOWED:
        print("ADMIN_ROLE is not an allowed role.", file=sys.stderr)
        return 2
    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    result = client.table("user_roles").upsert(
        {"user_id": ADMIN_USER_ID, "role": ADMIN_ROLE},
        on_conflict="user_id,role",
    ).execute()
    print(f"Role '{ADMIN_ROLE}' assigned to auth user {ADMIN_USER_ID}.")
    print("Remove the service key from your shell/environment after this one-time operation.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
