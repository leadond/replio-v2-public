import uuid
import bcrypt
from app.core.database import engine
from sqlalchemy import text

password = "admin123"
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

user_id = str(uuid.uuid4())
email = "admin@replio.local"
full_name = "Admin User"

sql = text("""
    INSERT INTO "user" (id, email, hashed_password, full_name, is_active, is_superuser, company_id)
    VALUES (:id, :email, :hashed_password, :full_name, :is_active, :is_superuser, :company_id)
""")

with engine.connect() as conn:
    conn.execute(sql, {
        "id": user_id,
        "email": email,
        "hashed_password": hashed,
        "full_name": full_name,
        "is_active": True,
        "is_superuser": False,
        "company_id": None
    })
    conn.commit()
    print(f"✓ User created successfully!")
    print(f"  Email: {email}")
    print(f"  Password: {password}")
