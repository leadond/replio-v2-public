from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select
from datetime import timedelta
from app.core.config import settings
from app.core.database import get_session
from app.core.security import create_access_token, verify_password, get_password_hash, decode_token
from app.models.user import User
from app.schemas.auth import Token, UserCreate, UserRead, UserLogin

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = session.get(User, payload.get("sub"))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
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
    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
