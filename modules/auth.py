"""
modules/auth.py
Role-based authentication module.
Provides admin and analyst access levels.
"""

import hashlib
import getpass


# In a real deployment these would be stored in a secured database.
# SHA-256 hashes of default credentials.
_USERS = {
    "admin":   ("8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",  # admin
                "admin"),
    "analyst": ("9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",  # test
                "analyst"),
}


def _hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


class AuthManager:
    def login(self) -> str | None:
        """
        Interactive login. Returns role string on success, None on failure.
        Allows 3 attempts.
        """
        for attempt in range(1, 4):
            username = input("Username: ").strip()
            password = getpass.getpass("Password: ")
            entry = _USERS.get(username)
            if entry and entry[0] == _hash(password):
                return entry[1]
            print(f"[!] Invalid credentials. Attempt {attempt}/3.")
        return None

    def check_permission(self, role: str, action: str) -> bool:
        """
        Simple permission model:
          admin   — can view, export, configure
          analyst — can view only
        """
        analyst_allowed = {"view", "export_csv"}
        admin_allowed   = analyst_allowed | {"export_pdf", "configure", "delete"}

        if role == "admin":
            return action in admin_allowed
        if role == "analyst":
            return action in analyst_allowed
        return False
