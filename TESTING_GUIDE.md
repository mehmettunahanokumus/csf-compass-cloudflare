# Vendor Self-Assessment Testing Guide

## Prerequisites

### 1. Start the Worker (Backend)

```bash
cd /Users/mehmettunahanokumus/Desktop/CSF_Check/csf-cloudflare/worker

# Ensure JWT_SECRET is set in .dev.vars
# Already created with: JWT_SECRET="hT+Vq34YYsU87lRO0gcGEhaD9O46nv4EnUaxnDxzvek="

# Start the worker in development mode
npm run dev
```

Worker should start on `http://localhost:8787`

### 2. Start the Frontend

```bash
cd /Users/mehmettunahanokumus/Desktop/CSF_Check/csf-cloudflare/frontend

# Update .env if needed to point to worker
# VITE_API_URL=http://localhost:8787

# Start the frontend
npm run dev
```

Frontend should start on `http://localhost:5173`

## Test Scenarios

### Scenario 1: Create and Send Vendor Assessment

**Goal:** Verify invitation creation and magic link generation

**Steps:**
1. Navigate to Dashboard: `http://localhost:5173/dashboard`
2. Click "Assessments" in sidebar
3. Click "New Assessment" button
4. Fill out form:
   - Name: "Acme Corp Security Assessment"
   - Type: "Vendor Assessment"
   - Select a vendor (or create one first)
   - Description: "Q1 2026 vendor security review"
5. Click "Create Assessment"
6. You should see the assessment detail page
7. Click "Send to Vendor" button
8. Fill out modal:
   - Email: `vendor@example.com`
   - Contact Name: `John Doe`
   - Message: `Please complete this security assessment by end of month`
   - Expiration: `30 days`
9. Click "Send Invitation"
10. **Expected result:**
    - Success message appears
    - Magic link is displayed
    - "Copy Link" button works
    - Invitation status badge appears on assessment page

**What to verify:**
- ✅ Magic link format: `http://localhost:5173/vendor-portal/{jwt-token}`
- ✅ Token is a valid JWT (check at jwt.io - should decode to show invitationId, vendorAssessmentId, orgAssessmentId, exp)
- ✅ Database record created in `vendor_assessment_invitations` table
- ✅ Cloned assessment created in `assessments` table with name "[Vendor Response] Acme Corp Security Assessment"
- ✅ Audit log entry created with action='token_validated'

**Check database:**
```bash
cd worker
npx wrangler d1 execute csf-compass-db --local --command "SELECT * FROM vendor_assessment_invitations ORDER BY created_at DESC LIMIT 1"
npx wrangler d1 execute csf-compass-db --local --command "SELECT * FROM vendor_audit_log ORDER BY created_at DESC LIMIT 5"
```

---

### Scenario 2: Vendor Completes Self-Assessment (First-Time Access)

**Goal:** Verify one-time token consumption and session cookie creation

**Steps:**
1. Copy the magic link from Scenario 1
2. **Open in incognito/private browser window** (to simulate vendor's first visit)
3. Paste magic link in browser
4. **Expected result:**
   - Page loads successfully
   - Welcome message shows vendor contact name
   - Assessment name displays
   - Custom message displays (if provided)
   - CSF functions tabs appear
   - Browser receives session cookie (check DevTools → Application → Cookies)

**What to verify:**
- ✅ Cookie name: `vendor_session`
- ✅ Cookie attributes: `HttpOnly`, `Secure` (if HTTPS), `SameSite=Strict`
- ✅ Cookie Max-Age: `86400` (24 hours)
- ✅ Database: `token_consumed_at` is set in `vendor_assessment_invitations`
- ✅ Database: `session_token` is set
- ✅ Database: `invitation_status` changed to 'accessed'
- ✅ Audit log: action='token_validated'

**Check browser DevTools:**
- Open DevTools (F12)
- Go to Application → Cookies → http://localhost:5173
- Find cookie named `vendor_session`
- Verify HttpOnly = true, SameSite = Strict

**Check database:**
```bash
npx wrangler d1 execute csf-compass-db --local --command "SELECT token_consumed_at, session_token, invitation_status FROM vendor_assessment_invitations ORDER BY created_at DESC LIMIT 1"
```

---

### Scenario 3: Vendor Updates Assessment Items

**Goal:** Verify session cookie authentication and item updates

**Steps:**
1. Continue from Scenario 2 (vendor portal open)
2. Click on first CSF function tab (e.g., "Govern")
3. For first subcategory, click "Compliant" button
4. For second subcategory, click "Partial" button
5. For third subcategory, click "Non-Compliant" button
6. **Expected result:**
   - Status updates immediately (no page reload)
   - Badge changes color (green/yellow/red)
   - No errors in console

**What to verify:**
- ✅ Network tab shows PATCH requests to `/api/vendor-invitations/{token}/items/{itemId}`
- ✅ Requests include `Cookie: vendor_session=xxx` header (NOT URL token)
- ✅ Response status: 200 OK
- ✅ Database: `assessment_items` records updated with new status
- ✅ Database: `last_accessed_at` updated in `vendor_assessment_invitations`
- ✅ Audit log: action='status_updated' for each update

**Check network requests:**
- Open DevTools → Network tab
- Click status button
- Find PATCH request
- Check Request Headers → Cookie (should include vendor_session)

---

### Scenario 4: Magic Link Already Used Error

**Goal:** Verify one-time token enforcement

**Steps:**
1. Copy the same magic link from Scenario 1
2. **Open a NEW incognito window** (to clear cookies)
3. Paste magic link
4. **Expected result:**
   - Error page displays
   - Message: "Magic link already used. Please use the link from your browser where you first opened it."
   - OR: "Invalid or expired invitation link"

**What to verify:**
- ✅ HTTP status: 403 Forbidden
- ✅ No session cookie created (since token already consumed)
- ✅ Audit log: action='token_rejected' with reason='token_already_consumed'

---

### Scenario 5: Session Cookie Continuation (24-hour window)

**Goal:** Verify vendor can return within 24 hours using session cookie

**Steps:**
1. From original incognito window (Scenario 2), refresh the page
2. **Expected result:**
   - Page loads successfully
   - Assessment data displays
   - Previously updated items show correct status
   - No "magic link already used" error

**What to verify:**
- ✅ No GET request to `/validate/:token` (uses existing session cookie)
- ✅ Page loads using session cookie authentication
- ✅ Database: `last_accessed_at` updated

**Note:** Session cookies persist until browser is closed or 24 hours expire (whichever comes first).

---

### Scenario 6: Submit Vendor Self-Assessment

**Goal:** Verify assessment completion

**Steps:**
1. From vendor portal (with active session), update at least 10 items
2. Click "Submit Assessment" button
3. Confirm submission in dialog
4. **Expected result:**
   - Success message appears
   - Page shows "Assessment Completed" screen
   - Completion date displays
   - Thank you message

**What to verify:**
- ✅ HTTP POST to `/api/vendor-invitations/{token}/complete`
- ✅ Response status: 200 OK
- ✅ Database: `invitation_status` = 'completed'
- ✅ Database: `completed_at` timestamp set
- ✅ Database: Assessment status = 'completed'
- ✅ Audit log: action='assessment_submitted'

**Check database:**
```bash
npx wrangler d1 execute csf-compass-db --local --command "SELECT invitation_status, completed_at FROM vendor_assessment_invitations ORDER BY created_at DESC LIMIT 1"
npx wrangler d1 execute csf-compass-db --local --command "SELECT status, completed_at FROM assessments WHERE name LIKE '[Vendor Response]%' ORDER BY created_at DESC LIMIT 1"
```

---

### Scenario 7: View Assessment Comparison

**Goal:** Verify side-by-side comparison view

**Steps:**
1. Navigate to organization's original assessment (from Scenario 1)
2. Verify invitation status badge shows "Invitation: completed"
3. Click "View Comparison" button
4. **Expected result:**
   - Comparison page loads
   - Stats cards show: Total Items, Matches, Differences, Not Assessed
   - Filter buttons work: All Items, Matches, Differences
   - Function tabs display
   - Table shows: Subcategory | Your Assessment | Vendor Self-Assessment | Status
   - Matching items show green "✓ Match" badge
   - Different items show yellow "⚠ Difference" badge
   - Not assessed items show gray badge

**What to verify:**
- ✅ GET request to `/api/vendor-invitations/{assessmentId}/comparison`
- ✅ Response includes both assessments and comparison_items array
- ✅ Color coding works (green=match, yellow=diff, gray=not assessed)
- ✅ Filters work correctly
- ✅ Function tabs filter items

---

### Scenario 8: Rate Limiting (Token Validation)

**Goal:** Verify rate limiting prevents abuse

**Steps:**
1. Using a tool like Postman or curl, make 11 GET requests to `/api/vendor-invitations/validate/{token}` within 1 minute
2. **Expected result:**
   - First 10 requests: 200 OK (or 403 if already consumed)
   - 11th request: 429 Too Many Requests
   - Response includes `Retry-After: 60` header

**Manual test:**
```bash
# Replace {token} with actual token from magic link
TOKEN="your-jwt-token-here"

# Run this 11 times quickly
for i in {1..11}; do
  echo "Request $i:"
  curl -i "http://localhost:8787/api/vendor-invitations/validate/$TOKEN"
  echo ""
done
```

**What to verify:**
- ✅ 11th request returns HTTP 429
- ✅ Response body: `{"error": "Rate limit exceeded. Please try again later."}`
- ✅ Retry-After header present
- ✅ KV key created: `rate:token_validation:{ip}`
- ✅ Audit log: action='rate_limited'

**Check KV:**
```bash
# This won't work directly - KV is internal to the worker
# Instead, check audit logs for rate_limited events
npx wrangler d1 execute csf-compass-db --local --command "SELECT * FROM vendor_audit_log WHERE action='rate_limited' ORDER BY created_at DESC LIMIT 5"
```

---

### Scenario 9: Rate Limiting (Status Updates)

**Goal:** Verify rate limiting on status updates

**Steps:**
1. From vendor portal with active session
2. Using browser console, run:
```javascript
// Update the same item 31 times
const token = window.location.pathname.split('/').pop();
const itemId = 'get-first-item-id-from-page';

for (let i = 0; i < 31; i++) {
  fetch(`http://localhost:8787/api/vendor-invitations/${token}/items/${itemId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: i % 2 ? 'compliant' : 'partial' })
  }).then(r => console.log(`Request ${i+1}: ${r.status}`));
}
```

**Expected result:**
- First 30 requests: 200 OK
- 31st request: 429 Too Many Requests

**What to verify:**
- ✅ 31st request returns HTTP 429
- ✅ KV key: `rate:status_update:{ip}`
- ✅ Audit log: action='rate_limited'

---

### Scenario 10: Token Revocation

**Goal:** Verify invitation can be revoked

**Steps:**
1. From organization view, go to assessment with active invitation
2. Click "Send to Vendor" button
3. In modal showing magic link, click "Revoke Invitation"
4. Confirm revocation
5. **Expected result:**
   - Success message appears
   - Modal closes
   - Invitation status badge changes to "revoked"

**Now test revoked access:**
1. Copy the revoked magic link
2. Open in incognito window
3. **Expected result:**
   - Error page: "This invitation has been revoked"
   - HTTP 403 Forbidden

**What to verify:**
- ✅ POST to `/api/vendor-invitations/{invitationId}/revoke`
- ✅ Database: `revoked_at` timestamp set
- ✅ Database: `revoked_by` = 'DEMO_USER_ID'
- ✅ Database: `invitation_status` = 'revoked'
- ✅ Database: `session_token` = NULL (active sessions killed)
- ✅ Audit log: action='token_revoked'

**Check database:**
```bash
npx wrangler d1 execute csf-compass-db --local --command "SELECT invitation_status, revoked_at, revoked_by, session_token FROM vendor_assessment_invitations ORDER BY created_at DESC LIMIT 1"
```

---

### Scenario 11: Session Expiry (Manual Test)

**Goal:** Verify 24-hour session expiration

**Steps:**
1. Manually set `session_expires_at` to past timestamp in database
2. Try to update an item from vendor portal
3. **Expected result:**
   - Error: "Session expired. Please use the magic link again."
   - HTTP 401 Unauthorized

**Manual database update:**
```bash
# Get invitation ID
npx wrangler d1 execute csf-compass-db --local --command "SELECT id FROM vendor_assessment_invitations ORDER BY created_at DESC LIMIT 1"

# Set session_expires_at to past (replace {id} with actual ID)
npx wrangler d1 execute csf-compass-db --local --command "UPDATE vendor_assessment_invitations SET session_expires_at = 1000000000 WHERE id = '{id}'"
```

**What to verify:**
- ✅ PATCH request to update item returns HTTP 401
- ✅ Response: `{"error": "Invalid or expired session"}`

---

## Security Verification Checklist

### JWT Security

- [ ] JWT_SECRET is set (not empty, not default value)
- [ ] JWT_SECRET is at least 32 characters
- [ ] JWT tokens cannot be decoded and modified (signature verification works)
- [ ] Expired tokens are rejected

**Test JWT tampering:**
```javascript
// Copy a valid JWT token from magic link
const token = "your-jwt-token";

// Decode it (use jwt.io)
// Modify the payload (change invitationId)
// Try to use modified token
// Should fail with "Invalid token signature"
```

### Cookie Security

- [ ] Cookies are HttpOnly (JavaScript cannot access)
- [ ] Cookies are Secure in production (HTTPS only)
- [ ] Cookies are SameSite=Strict (CSRF protection)
- [ ] Cookies have 24-hour expiration
- [ ] Cookies are scoped to `/api/vendor-invitations` path

**Test HttpOnly:**
```javascript
// In browser console on vendor portal
document.cookie
// Should NOT show vendor_session cookie
```

### CORS Security

- [ ] CORS is configured for vendor endpoints
- [ ] Credentials are enabled (`withCredentials: true`)
- [ ] Origin is restricted (not wildcard `*` in production)
- [ ] OPTIONS preflight requests work

**Check CORS headers:**
```bash
curl -i -X OPTIONS \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: PATCH" \
  http://localhost:8787/api/vendor-invitations/validate/test

# Should see:
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Credentials: true
```

### Rate Limiting

- [ ] Token validation: 10 requests/min per IP
- [ ] Status updates: 30 requests/min per IP
- [ ] Rate limit returns 429 status
- [ ] Retry-After header present
- [ ] KV keys auto-expire after 60 seconds

### Audit Logging

- [ ] All token validations logged
- [ ] All status updates logged
- [ ] All assessment submissions logged
- [ ] All rate limit events logged
- [ ] All token revocations logged
- [ ] IP address captured
- [ ] User agent captured

**Check audit completeness:**
```bash
npx wrangler d1 execute csf-compass-db --local --command "SELECT action, COUNT(*) as count FROM vendor_audit_log GROUP BY action"

# Should see counts for:
# - token_validated
# - status_updated
# - assessment_submitted
# - rate_limited (if tested)
# - token_revoked (if tested)
```

---

## Common Issues & Solutions

### Issue: "JWT_SECRET not configured"

**Cause:** .dev.vars file missing or JWT_SECRET not set

**Solution:**
```bash
cd worker
cat .dev.vars  # Check if file exists

# If missing, create it:
echo 'JWT_SECRET="hT+Vq34YYsU87lRO0gcGEhaD9O46nv4EnUaxnDxzvek="' > .dev.vars
```

### Issue: CORS errors in browser console

**Cause:** Frontend and backend on different origins without proper CORS

**Solution:**
1. Check `ALLOWED_ORIGINS` in `worker/wrangler.toml`
2. Ensure frontend URL is included: `http://localhost:5173`
3. Restart worker after changing config

### Issue: Session cookie not set

**Cause:** SameSite=Strict requires same origin, or browser blocking cookies

**Solution:**
1. Ensure frontend and backend are on same origin (localhost:5173 ↔ localhost:8787)
2. Check browser DevTools → Application → Cookies
3. Try in different browser (some block third-party cookies)

### Issue: "Magic link already used" immediately

**Cause:** Token consumed on validation request

**Solution:**
- This is expected behavior! Magic link can only be used once
- Subsequent access uses session cookie (browser remembers)
- Test in fresh incognito window to simulate first use

### Issue: Database migration not applied

**Cause:** Migration files exist but not executed

**Solution:**
```bash
cd worker
npx wrangler d1 migrations apply csf-compass-db --local
# Should see: ✅ 0004_vendor_invitations.sql
```

---

## Production Deployment Checklist

### Before Deploying

- [ ] All tests pass
- [ ] JWT_SECRET generated (32+ characters)
- [ ] ALLOWED_ORIGINS configured for production domain
- [ ] FRONTEND_URL configured for production domain
- [ ] Migration ready to apply to production D1

### Deployment Steps

**1. Set production secrets:**
```bash
cd worker
wrangler secret put JWT_SECRET
# Enter: <paste-generated-secret>
```

**2. Update wrangler.toml for production:**
```toml
[env.production]
[env.production.vars]
ENVIRONMENT = "production"
ALLOWED_ORIGINS = "https://your-app.pages.dev"
FRONTEND_URL = "https://your-app.pages.dev"
```

**3. Apply production migration:**
```bash
wrangler d1 migrations apply csf-compass-db
# Confirm: yes
```

**4. Deploy worker:**
```bash
wrangler deploy
# Note the worker URL: https://csf-compass-worker.your-account.workers.dev
```

**5. Update frontend .env.production:**
```
VITE_API_URL=https://csf-compass-worker.your-account.workers.dev
```

**6. Build and deploy frontend:**
```bash
cd ../frontend
npm run build
wrangler pages deploy dist
```

**7. Verify production:**
- [ ] Create test vendor assessment
- [ ] Send invitation
- [ ] Complete as vendor
- [ ] View comparison
- [ ] Check audit logs in production D1

---

## Performance Monitoring

### Key Metrics to Monitor

**Backend (Worker):**
- Request latency (p50, p95, p99)
- Error rate
- Rate limit trigger frequency
- KV read/write latency
- D1 query latency

**Frontend:**
- Page load time
- API request latency
- Error rate
- Session cookie success rate

**Database:**
- `vendor_assessment_invitations` table size
- `vendor_audit_log` table size
- Query performance (use EXPLAIN)

### Logging

Check worker logs:
```bash
wrangler tail
```

Look for:
- Rate limit events
- Token validation failures
- Audit logging errors
- CORS errors

---

## Support & Troubleshooting

### Debug Mode

Enable verbose logging in worker:
```typescript
// Add to worker/src/index.ts
app.use('*', async (c, next) => {
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url}`);
  await next();
});
```

### Database Inspection

```bash
# List all invitations
npx wrangler d1 execute csf-compass-db --local --command "SELECT * FROM vendor_assessment_invitations"

# List recent audit logs
npx wrangler d1 execute csf-compass-db --local --command "SELECT * FROM vendor_audit_log ORDER BY created_at DESC LIMIT 20"

# Find cloned assessments
npx wrangler d1 execute csf-compass-db --local --command "SELECT * FROM assessments WHERE name LIKE '[Vendor Response]%'"
```

### Reset Test Data

```bash
# Delete all test invitations (LOCAL ONLY!)
npx wrangler d1 execute csf-compass-db --local --command "DELETE FROM vendor_assessment_invitations"

# Delete all audit logs (LOCAL ONLY!)
npx wrangler d1 execute csf-compass-db --local --command "DELETE FROM vendor_audit_log"
```

---

**Happy Testing!** 🚀

For issues or questions, check:
- `VENDOR_SELF_ASSESSMENT_IMPLEMENTATION.md` - Full implementation details
- `worker/src/routes/vendor-invitations.ts` - Backend API code
- `frontend/src/pages/VendorPortal.tsx` - Vendor portal UI
