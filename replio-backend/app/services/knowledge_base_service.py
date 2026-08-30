"""Knowledge base management service."""
import logging
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlmodel import Session, select
from app.models.knowledge_base import KnowledgeBase

logger = logging.getLogger(__name__)


class KnowledgeBaseService:
    """Manage company knowledge base."""

    @staticmethod
    def create_article(
        session: Session,
        company_id: str,
        category: str,
        title: str,
        content: str,
        keywords: Optional[str] = None,
    ) -> KnowledgeBase:
        """Create knowledge base article."""
        article = KnowledgeBase(
            id=str(uuid.uuid4()),
            company_id=company_id,
            category=category,
            title=title,
            content=content,
            keywords=keywords,
            approved=False,
        )

        session.add(article)
        session.commit()
        session.refresh(article)
        logger.info(f"Knowledge article created: {article.id}")
        return article

    @staticmethod
    def get_article(session: Session, article_id: str) -> Optional[KnowledgeBase]:
        """Get article by ID."""
        return session.get(KnowledgeBase, article_id)

    @staticmethod
    def approve_article(
        session: Session,
        article_id: str,
        approved_by_user_id: str,
    ) -> Optional[KnowledgeBase]:
        """Approve article for use."""
        article = session.get(KnowledgeBase, article_id)
        if article:
            article.approved = True
            article.approved_by_user_id = approved_by_user_id
            article.approved_at = datetime.utcnow()
            session.add(article)
            session.commit()
            session.refresh(article)
            logger.info(f"Article {article_id} approved")

        return article

    @staticmethod
    def search_articles(
        session: Session,
        company_id: str,
        query: str,
        approved_only: bool = True,
        limit: int = 20,
    ) -> List[KnowledgeBase]:
        """Search knowledge base articles."""
        stmt = select(KnowledgeBase).where(
            (KnowledgeBase.company_id == company_id) &
            (KnowledgeBase.content.ilike(f"%{query}%") |
             KnowledgeBase.title.ilike(f"%{query}%") |
             KnowledgeBase.keywords.ilike(f"%{query}%"))
        )

        if approved_only:
            stmt = stmt.where(KnowledgeBase.approved == True)

        stmt = stmt.order_by(KnowledgeBase.usage_count.desc()).limit(limit)

        return session.exec(stmt).all()

    @staticmethod
    def get_by_category(
        session: Session,
        company_id: str,
        category: str,
        approved_only: bool = True,
    ) -> List[KnowledgeBase]:
        """Get articles by category."""
        stmt = select(KnowledgeBase).where(
            (KnowledgeBase.company_id == company_id) &
            (KnowledgeBase.category == category)
        )

        if approved_only:
            stmt = stmt.where(KnowledgeBase.approved == True)

        return session.exec(stmt).all()

    @staticmethod
    def get_relevant_articles(
        session: Session,
        company_id: str,
        context: str,
        limit: int = 5,
    ) -> List[KnowledgeBase]:
        """Get relevant articles based on context."""
        # Search for articles matching context keywords
        articles = KnowledgeBaseService.search_articles(
            session,
            company_id,
            context,
            approved_only=True,
            limit=limit,
        )

        # Track usage
        for article in articles:
            article.usage_count += 1

        session.commit()
        return articles

    @staticmethod
    def delete_article(session: Session, article_id: str) -> bool:
        """Delete article."""
        article = session.get(KnowledgeBase, article_id)
        if article:
            session.delete(article)
            session.commit()
            logger.info(f"Article {article_id} deleted")
            return True
        return False

    @staticmethod
    def get_kb_statistics(
        session: Session,
        company_id: str,
    ) -> Dict[str, Any]:
        """Get knowledge base statistics."""
        stmt = select(KnowledgeBase).where(KnowledgeBase.company_id == company_id)
        all_articles = session.exec(stmt).all()

        approved = sum(1 for a in all_articles if a.approved)
        categories = set(a.category for a in all_articles)
        total_usage = sum(a.usage_count for a in all_articles)

        return {
            "total_articles": len(all_articles),
            "approved_articles": approved,
            "pending_approval": len(all_articles) - approved,
            "categories": list(categories),
            "total_usage": total_usage,
        }
