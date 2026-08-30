from app.models.user import User
from app.core.database import engine
from sqlmodel import Session
import bcrypt

# Hash password with bcrypt
password = "admin123"
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

# Create a test user
user = User(
    email="admin@replio.local",
    hashed_password=hashed,
    full_name="Admin User",
    is_active=True,
    is_superuser=False,
    company_id=None
)

with Session(engine) as session:
    session.add(user)
    session.commit()
    session.refresh(user)
    print(f"✓ User created successfully!")
    print(f"  Email: {user.email}")
    print(f"  Password: admin123")
    print(f"  ID: {user.id}")
