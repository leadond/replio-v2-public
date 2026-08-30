# Multi-Tenant Data Persistence Fix Plan

## Problem Statement
Data is reverting when users navigate between pages because it's being stored in frontend state instead of persisting to the backend database.

## Root Cause Analysis

### ✅ Backend Status: READY
- Database models exist for all features (Caller, Conversation, Message, etc.)
- SQLModel ORM is properly configured
- Company-scoped queries are implemented in routers
- Most core endpoints exist in `phase4_features.py`

### ❌ Frontend Status: NEEDS WORK
- API client methods are added for all endpoints
- Pages need to be updated to:
  1. Fetch data from backend on component mount
  2. Persist all CRUD operations to backend
  3. Remove any mock/localStorage data usage for business data
  4. Always scope requests by company_id

### ⚠️ Backend Gaps Found
- Some endpoints in `phase4_features.py` may need authentication/company_id validation
- Need to verify appointments endpoints exist
- Need to verify reports endpoints exist
- Need to verify guidance endpoints exist

## Implementation Plan

### Phase 1: Backend Validation (30 mins)
- [ ] Verify all endpoints in `phase4_features.py` properly validate company_id
- [ ] Ensure authentication is required on all endpoints
- [ ] Add missing appointments endpoint if needed
- [ ] Add missing reports endpoint if needed
- [ ] Test all endpoints with curl to confirm persistence

### Phase 2: Frontend API Integration (1-2 hours)
- [ ] Update Recordings.tsx to fetch from `/recordings` endpoint
- [ ] Update Escalations.tsx to fetch from `/escalations` endpoint
- [ ] Update KnowledgeBase.tsx to fetch from `/knowledge-base` endpoint
- [ ] Update Guidance.tsx to fetch from `/guidance` endpoint
- [ ] Update Chat.tsx to fetch from `/chat` endpoint
- [ ] Update Appointments.tsx to fetch from `/appointments` endpoint
- [ ] Update Reports.tsx to fetch from `/reports` endpoint
- [ ] Remove all localStorage usage for business data
- [ ] Ensure all components call API on mount with company_id

### Phase 3: Testing (1 hour)
- [ ] Test each page: navigate away and back - data should persist
- [ ] Test create operations persist across page navigation
- [ ] Test update operations persist across page navigation
- [ ] Test delete operations persist across page navigation
- [ ] Verify company_id isolation (data doesn't leak between companies)
- [ ] Test with multiple users/accounts

## Multi-Tenant Architecture Requirements

Every API call MUST:
1. **Include company_id** - Either from:
   - Query parameter: `?company_id=...`
   - Body parameter: `{ company_id: "..." }`
   - From authenticated user's company_id

2. **Validate company_id** - Backend must:
   - Verify current_user has access to this company_id
   - Return 403 Forbidden if unauthorized
   - Filter all results by company_id

3. **Persist immediately** - All data must be saved:
   - On create: immediately to database
   - On update: immediately to database
   - On delete: immediately to database
   - Never rely on frontend state as the source of truth

4. **No frontend persistence** - Frontend state:
   - Can cache for display performance only
   - Must be fetched fresh on component mount
   - Must NOT be used to restore after navigation
   - localStorage is for authentication tokens ONLY

## Current Issues by Page

| Page | Issue | Status |
|------|-------|--------|
| Dashboard | Fetches from backend ✅ | Working |
| Inbox | Fetches from backend ✅ | Working |
| Callers | Fetches from backend ✅ | Working |
| Recordings | Uses mock data ❌ | Needs fix |
| Escalations | Uses mock data ❌ | Needs fix |
| Knowledge Base | Uses mock data ❌ | Needs fix |
| Guidance | Uses mock data ❌ | Needs fix |
| Chat | Uses mock data ❌ | Needs fix |
| Appointments | Uses mock data ❌ | Needs fix |
| Reports | Uses mock data ❌ | Needs fix |
| Audit Log | Fetches from backend ✅ | Working |
| Settings | Fetches from backend ✅ | Working |

## Next Steps

1. Start with Phase 1: Backend validation
2. Run tests with curl to confirm persistence
3. Move to Phase 2: Update frontend pages
4. Run comprehensive testing in Phase 3
5. Verify multi-tenant isolation

## Files to Modify

### Backend
- `app/routers/phase4_features.py` - Add missing endpoints if needed
- `app/main.py` - Already has CORS fixed ✅

### Frontend
- `src/api/client.ts` - API methods added ✅
- `src/pages/Recordings.tsx` - Update to use API
- `src/pages/Escalations.tsx` - Update to use API
- `src/pages/KnowledgeBase.tsx` - Update to use API
- `src/pages/Guidance.tsx` - Update to use API
- `src/pages/Chat.tsx` - Update to use API
- `src/pages/Appointments.tsx` - Update to use API
- `src/pages/Reports.tsx` - Update to use API

## Success Criteria

✅ Data persists when navigating between pages
✅ Creating data on any page saves to database
✅ Updating data on any page saves to database
✅ Deleting data on any page removes from database
✅ All data is properly scoped by company_id
✅ No data leaks between different companies
✅ No data stored in browser localStorage (except tokens)
✅ All 12 pages fully functional with real backend data
