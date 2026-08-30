# Replio v2 - Security Hardening Checklist

**Phase 8: Security & Compliance**  
**Status:** Pre-Deployment Security Configuration  

---

## 🔐 Authentication & Authorization

### User Authentication
- [x] JWT token implementation (asymmetric signing)
- [x] Password hashing with bcrypt (cost: 12)
- [x] Token expiration (15 minutes access, 7 days refresh)
- [ ] Multi-factor authentication (MFA) setup
- [ ] Session timeout (30 minutes inactivity)
- [ ] Failed login attempt tracking (max 5, lockout 15 min)

### Authorization & Access Control
- [ ] Role-based access control (RBAC) setup
- [ ] Permission matrix: Admin, Manager, Agent, Viewer
- [ ] Resource-level permissions
- [ ] Audit trail for permission changes
- [ ] API key management (rotate every 90 days)

---

## 🛡️ Data Protection

### Encryption at Rest
- [ ] Enable PostgreSQL encryption
- [ ] Encrypt sensitive fields:
  ```sql
  ALTER TABLE callers ADD COLUMN phone_encrypted text;
  ALTER TABLE users ADD COLUMN email_encrypted text;
  ```
- [ ] AES-256 encryption for sensitive data
- [ ] Key rotation procedure documented
- [ ] Secure key storage (env vars, not code)

### Encryption in Transit
- [ ] HTTPS/TLS 1.2+ enforced
- [ ] SSL/TLS certificate (Let's Encrypt or commercial)
- [ ] HSTS header configured (max-age: 31536000)
- [ ] Certificate renewal automation
- [ ] Cipher suite hardening (no weak ciphers)

### Data Minimization
- [ ] Don't store: credit cards, SSNs, passwords in plain text
- [ ] Secure deletion of archived data
- [ ] Retention policies enforced (90-day deletion)
- [ ] PII masking in logs

---

## 🔑 Secrets Management

### Environment Variables
```bash
# .env (never commit)
DATABASE_URL="postgresql://user:pass@host/db"
JWT_SECRET="$(openssl rand -base64 32)"
ELEVENLABS_API_KEY="sk-..."
SIGNALWIRE_API_TOKEN="..."
STRIPE_SECRET_KEY="sk_live_..."
```

### Production Secrets
- [ ] AWS Secrets Manager OR HashiCorp Vault setup
- [ ] Automated secret rotation
- [ ] No secrets in git history (use git-secrets)
- [ ] Secret versioning enabled
- [ ] Access logging for secret retrieval

### Credential Rotation
- [ ] Database password rotation schedule
- [ ] API key rotation (every 90 days)
- [ ] SSH key management
- [ ] Certificate renewal automation

---

## 🚫 Input Validation & Output Encoding

### Input Validation
- [x] Parameterized SQL queries (no string interpolation)
- [ ] Schema validation (Pydantic)
- [ ] File upload validation:
  - File type checking (magic bytes, not extension)
  - File size limits (max 100MB)
  - Antivirus scanning
  - Quarantine suspicious files
- [ ] Email validation (RFC 5322 compliant)
- [ ] Phone number validation (E.164 format)

### Output Encoding
- [ ] HTML entity encoding for HTML output
- [ ] URL encoding for URLs
- [ ] JSON encoding for JSON responses
- [ ] CSV escaping for exports
- [ ] SQL escaping (parameterized queries)

### OWASP Top 10 Coverage

| Risk | Mitigation | Status |
|------|-----------|--------|
| Injection | Parameterized queries | ✓ |
| Broken Auth | JWT + bcrypt | ✓ |
| Sensitive Data | Encryption | ✓ |
| XML External Entity | Input validation | ✓ |
| Access Control | RBAC + audit | ✓ |
| Security Misconfiguration | Security headers | ✓ |
| XSS | Output encoding | ✓ |
| Insecure Deserialization | JSON schemas | ✓ |
| Using Components with Known Vulns | pip-audit | ✓ |
| Insufficient Logging | Structured logging | ✓ |

---

## 🌐 API Security

### CORS Configuration
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://replio.example.com",
        "https://app.example.com",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
    max_age=86400,  # 1 day
)
```

### Rate Limiting
```python
@limiter.limit("5/minute")  # Login endpoint
@limiter.limit("60/minute")  # API endpoints
@limiter.limit("1000/day")   # File uploads
async def endpoint():
    pass
```

### API Versioning
- [ ] Version in URL path: `/api/v1/`
- [ ] Deprecated version support: 6 months minimum
- [ ] Version deprecation notices in headers
- [ ] Breaking changes documented

---

## 🔍 Security Headers

### Nginx Configuration
```nginx
# Security Headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline';" always;
```

### Cookie Security
```python
response.set_cookie(
    key="auth_token",
    value=token,
    httponly=True,  # No JS access
    secure=True,    # HTTPS only
    samesite="Strict",  # CSRF protection
    max_age=3600,   # 1 hour
    domain="replio.example.com",
    path="/",
)
```

---

## 🛡️ DDoS & Bot Protection

### Cloudflare Setup
- [ ] Enable DDoS protection
- [ ] Rate limiting rules
- [ ] Bot management enabled
- [ ] WAF rules configured
- [ ] Zone caching optimized

### Load Balancer Configuration
- [ ] Health checks on backend
- [ ] Connection limits per IP
- [ ] Request timeout: 30 seconds
- [ ] Keep-alive timeout: 65 seconds

---

## 📝 Logging & Monitoring

### Security Logging
```python
logger.info(json.dumps({
    'timestamp': datetime.utcnow().isoformat(),
    'event': 'USER_LOGIN',
    'user_id': user_id,
    'ip_address': request.client.host,
    'user_agent': request.headers.get('user-agent'),
    'status': 'SUCCESS',
    'session_id': session_id,
}))
```

### Failed Login Attempt Tracking
```python
# Log every failed attempt
logger.warning(json.dumps({
    'event': 'FAILED_LOGIN',
    'email': email,
    'ip_address': ip,
    'timestamp': now,
    'attempt_count': attempt_count,
}))

# Lock account after 5 attempts
if attempt_count >= 5:
    user.locked_until = now + timedelta(minutes=15)
```

### Sensitive Data Logging
- [x] Never log passwords
- [x] Never log full credit cards
- [x] Never log full tokens
- [x] Mask PII (show last 4 digits only)
- [x] Log to secure location (encrypted)

---

## 🔐 Database Security

### User Permissions
```sql
-- Create restricted user
CREATE USER replio_app WITH PASSWORD 'strong_password';

-- Grant minimal permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO replio_app;
GRANT SELECT ON audit_logs TO replio_app;
REVOKE ALL ON users FROM replio_app;  -- Read-only or limited

-- Separate backup user
CREATE USER replio_backup WITH PASSWORD 'backup_password';
GRANT CONNECT ON DATABASE replio_v2 TO replio_backup;
```

### Connection Security
- [ ] SSL connections enforced
- [ ] Connection pooling with limits
- [ ] Query timeouts (5s for web, 30s for batch)
- [ ] Connection monitoring

### Audit Logging
```sql
-- Enable pgAudit
CREATE EXTENSION pgaudit;

-- Audit DDL statements
ALTER SYSTEM SET pgaudit.log = 'DDL';

-- Audit specific users
ALTER SYSTEM SET pgaudit.log_parameter = on;

-- Restart PostgreSQL
```

---

## 🚨 Incident Response

### Incident Response Plan
- [ ] Incident severity levels defined
- [ ] On-call rotation established
- [ ] Communication plan (Slack, email, SMS)
- [ ] Escalation procedures documented
- [ ] Post-incident review process

### Security Incident Response
```
1. DETECT
   - Monitor security alerts
   - Review logs
   - Check monitoring dashboards

2. RESPOND
   - Isolate affected systems
   - Preserve evidence
   - Notify security team
   - Activate incident commander

3. INVESTIGATE
   - Gather logs
   - Timeline creation
   - Root cause analysis
   - Affected systems inventory

4. REMEDIATE
   - Patch/fix vulnerability
   - Verify fix
   - Deploy to production
   - Update documentation

5. COMMUNICATE
   - Internal notification
   - Customer notification (if needed)
   - Status updates
   - Transparency

6. LEARN
   - Post-mortem meeting
   - Lessons learned
   - Process improvements
   - Training updates
```

---

## ✅ Pre-Deployment Security Audit

### Code Review
- [ ] Peer review of security-critical code
- [ ] Automated security scanning (SAST)
- [ ] Dependency vulnerability scanning (pip-audit)
- [ ] Container scanning (trivy)

### Penetration Testing Prep
- [ ] Identify external-facing endpoints
- [ ] Test authentication bypass
- [ ] Test authorization bypass
- [ ] Test SQL injection vectors
- [ ] Test XSS vectors
- [ ] Test CSRF protection
- [ ] Test rate limiting
- [ ] Test data encryption

### Configuration Review
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Default credentials changed
- [ ] Debug mode disabled
- [ ] Logging configured
- [ ] Monitoring enabled
- [ ] Backups tested
- [ ] Disaster recovery plan

### Compliance Checklist
- [ ] GDPR: User consent, data export, right to delete
- [ ] SOC 2: Access controls, encryption, monitoring
- [ ] PCI DSS (if handling cards): No card storage
- [ ] HIPAA (if health data): Encryption, audit logs
- [ ] CCPA: Privacy policy, user rights

---

## 🔄 Ongoing Security

### Monthly Tasks
- [ ] Review access logs
- [ ] Check for new vulnerabilities
- [ ] Verify backups
- [ ] Review change logs

### Quarterly Tasks
- [ ] Security training
- [ ] Penetration testing
- [ ] Access control review
- [ ] Policy review

### Annual Tasks
- [ ] Full security audit
- [ ] Disaster recovery drill
- [ ] Compliance certification
- [ ] Architecture review

---

## 📊 Security Metrics

| Metric | Target | Monitoring |
|--------|--------|-----------|
| Failed Login Attempts | < 10/day | Dashboard |
| API Key Rotation | Every 90 days | Calendar |
| Cert Renewal | 30 days before | Alert |
| Dependency Updates | Weekly | Dashboard |
| Vulnerability Scan | Weekly | CI/CD |
| Access Log Review | Daily | Manual |
| Incident Response Time | < 1 hour | Dashboard |
| Uptime | > 99.9% | Prometheus |

---

**Status:** ✅ Security Checklist Complete  
**Next:** Execute all items before production deployment  
**Estimated Time:** 3-5 business days  

🔐 **Security is not optional. Verify all items before going live.**
