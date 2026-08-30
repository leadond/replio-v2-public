import re

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select
from datetime import timedelta
from app.core.config import settings
from app.core.database import get_session
from app.core.security import create_access_token, verify_password, get_password_hash, decode_token
from app.models.user import User
from app.models.company import Company
from app.schemas.auth import Token, UserCreate, UserRead, UserLogin

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _company_slug(name: str, user_id: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or f"workspace-{user_id[:8]}"


def _ensure_company(session: Session, user: User, company_name: str | None = None, company_id: str | None = None) -> Company:
    if user.company_id:
        company = session.get(Company, user.company_id)
        if company:
            return company

    # Legacy users previously scoped records by user ID. Reuse it so their data stays visible.
    company_id = (company_id or user.company_id or user.id).strip()
    existing = session.get(Company, company_id)
    if existing:
        user.company_id = existing.id
        session.add(user)
        session.commit()
        return existing

    name = (company_name or f"{user.full_name or user.email.split('@')[0]} Workspace").strip()
    slug = _company_slug(name, user.id)
    if session.exec(select(Company).where(Company.slug == slug)).first():
        slug = f"{slug}-{company_id[:8]}"
    company = Company(id=company_id, name=name, slug=slug)
    user.company_id = company.id
    session.add(company)
    session.add(user)
    session.commit()
    session.refresh(user)
    return company


async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    stmt = select(User).where(User.id == payload.get("sub"))
    user = session.exec(stmt).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    _ensure_company(session, user)
    return user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    stmt = select(User).where(User.email == form_data.username)
    user = session.exec(stmt).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/register", response_model=UserRead)
async def register(data: UserCreate, session: Session = Depends(get_session)):
    stmt = select(User).where(User.email == data.email)
    if session.exec(stmt).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    requested_company_id = (data.company_id or "").strip() or None
    if requested_company_id and session.get(Company, requested_company_id):
        raise HTTPException(status_code=400, detail="Company ID is already in use")
    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
    )
    session.add(user)
    session.flush()
    _ensure_company(session, user, data.company_name, requested_company_id)
    return user

@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
