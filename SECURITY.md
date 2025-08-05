# Security Implementation Guide

This document outlines the comprehensive security measures implemented in Monity to ensure data protection and application security for production deployment.

## 🔒 Security Features Overview

### 1. Authentication & Authorization
- **JWT-based Authentication**: Secure token-based authentication via Supabase
- **Role-Based Access Control (RBAC)**: Three tiers - `user`, `premium`, `admin`
- **Session Management**: Secure token handling with automatic expiration
- **Password Security**: Handled by Supabase with bcrypt hashing

### 2. Data Encryption
- **Field-Level Encryption**: Sensitive data encrypted at application level
- **AES-256-GCM Encryption**: Industry-standard encryption for sensitive fields
- **Encrypted Fields**: Transaction descriptions, user PII
- **Key Management**: Environment-based encryption key management

### 3. Database Security
- **Row Level Security (RLS)**: PostgreSQL policies ensure users only access their data
- **SQL Injection Prevention**: Parameterized queries via Supabase client
- **Data Isolation**: User data strictly segregated by policies

### 4. API Security
- **Rate Limiting**: Multiple tiers of rate limiting to prevent abuse
- **Input Validation**: Comprehensive validation using Joi schemas
- **XSS Protection**: Input sanitization to prevent cross-site scripting
- **CORS Configuration**: Strict origin validation
- **Security Headers**: Helmet.js for security headers

### 5. Monitoring & Auditing
- **Audit Logging**: All sensitive operations logged
- **Security Event Monitoring**: Failed login attempts, rate limit violations
- **Error Handling**: Secure error responses that don't leak information

## 🛡️ Implementation Details

### Encryption Service

The encryption service (`backend/security/encryption.js`) provides:

```javascript
// Encrypt sensitive data
const encrypted = encryption.encrypt("sensitive data");

// Decrypt when needed
const decrypted = encryption.decrypt(encrypted);

// Hash for searching (one-way)
const hash = encryption.hash("searchable data");
```

**Encrypted Fields:**
- Transaction descriptions
- User names (if sensitive)
- Any custom PII fields

### Input Validation

All API endpoints use comprehensive validation schemas:

```javascript
// Example: Transaction validation
transaction: Joi.object({
    description: Joi.string().min(1).max(500).required(),
    amount: Joi.number().precision(2).positive().max(1000000).required(),
    category: Joi.string().min(1).max(100).required(),
    date: Joi.date().iso().max('now').required()
})
```

### Rate Limiting Configuration

Different endpoints have different rate limits:

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 attempts per 15 minutes
- **Intensive Operations**: 10 requests per minute
- **File Uploads**: 10 uploads per hour

### Database Policies

Row Level Security policies ensure data isolation:

```sql
-- Example: Transactions policy
CREATE POLICY "Allow individual access to transactions" 
ON "transactions" FOR SELECT 
USING (auth.uid() = "userId");
```

## 🔧 Environment Configuration

### Required Environment Variables

**Backend (`backend/.env`):**
```env
# Critical - Must be set for production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
ENCRYPTION_KEY=your-32-byte-encryption-key
NODE_ENV=production

# Security Configuration
HASH_SALT=your-hash-salt
FRONTEND_URL=https://your-frontend-domain.com
```

**Frontend (`frontend/.env`):**
```env
# Public configuration only
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://your-backend-domain.com
```

### Generating Secure Keys

```bash
# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate hash salt
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## 🚀 Deployment Security Checklist

### Pre-Deployment
- [ ] All environment variables set and secure
- [ ] HTTPS enforced on hosting platform
- [ ] Database RLS policies active
- [ ] Rate limiting configured
- [ ] CORS origins restricted to production domains
- [ ] Error reporting configured (but not leaking sensitive data)

### Post-Deployment
- [ ] Security headers verified (use securityheaders.com)
- [ ] SSL certificate valid and configured
- [ ] Rate limits working correctly
- [ ] Audit logs functioning
- [ ] Backup encryption verified
- [ ] Database access restricted

### Ongoing Security
- [ ] Regular security updates
- [ ] Monitor failed login attempts
- [ ] Review audit logs monthly
- [ ] Update encryption keys annually
- [ ] Monitor rate limit violations

## 🔍 Security Testing

### Testing Authentication
```bash
# Test rate limiting
for i in {1..10}; do curl -X POST https://your-api.com/login -d '{"email":"test","password":"wrong"}'; done

# Test input validation
curl -X POST https://your-api.com/add-expense -d '{"description":"<script>alert(1)</script>","amount":-100}'
```

### Testing Encryption
```javascript
// Verify data is encrypted in database
const { data } = await supabase.from('transactions').select('description').limit(1);
console.log('Raw data:', data[0].description); // Should be encrypted
```

## 🚨 Incident Response

### Security Breach Response
1. **Immediate**: Revoke compromised API keys
2. **Within 1 hour**: Change encryption keys
3. **Within 24 hours**: Force password resets for affected users
4. **Within 72 hours**: Notify users if required by law

### Monitoring Alerts
Set up alerts for:
- Multiple failed login attempts from same IP
- Rate limit violations
- Unusual API usage patterns
- Database connection anomalies

## 📋 Compliance Considerations

### Data Protection
- **GDPR Compliance**: Right to deletion, data portability
- **Data Minimization**: Only collect necessary data
- **Consent Management**: Clear opt-in for data processing
- **Data Retention**: Automatic cleanup of old data

### Financial Data
- **PCI DSS**: If handling payment cards (not applicable for basic expense tracking)
- **SOX Compliance**: If publicly traded (financial reporting accuracy)
- **Data Locality**: Ensure data residency requirements met

## 🔧 Maintenance

### Regular Tasks
- **Monthly**: Review audit logs and security metrics
- **Quarterly**: Update dependencies and security patches
- **Annually**: Rotate encryption keys and certificates
- **As needed**: Update rate limits based on usage patterns

### Security Updates
1. Monitor security advisories for dependencies
2. Test security updates in staging environment
3. Deploy critical security patches immediately
4. Document all security-related changes

## 📞 Support & Contact

For security-related questions or to report vulnerabilities:
- **Security Email**: security@monity.app
- **Bug Bounty**: (Configure responsible disclosure program)
- **Documentation**: This file and inline code comments

---

**Last Updated**: December 2024
**Review Schedule**: Quarterly
**Owner**: Development Team 