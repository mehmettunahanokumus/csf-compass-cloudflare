# 🧪 Interactive Testing Guide

Follow this step-by-step guide to test your deployed vendor self-assessment feature.

## Prerequisites

**Production URLs:**
- Frontend: https://8fa76d6a.csf-compass.pages.dev
- Backend: https://csf-compass-worker.mehmettunahanokumus.workers.dev

**What you'll need:**
- A modern browser (Chrome, Firefox, Safari)
- An incognito/private window for vendor testing
- 10-15 minutes

---

## Test 1: Organization Creates Vendor Assessment

### Step 1.1: Access Dashboard
1. Open browser: https://8fa76d6a.csf-compass.pages.dev
2. You should see the CSF Compass dashboard
3. ✅ **Verify:** Dashboard loads without errors

### Step 1.2: Check Existing Vendors
1. Click "Vendors" in the sidebar (or navigate to `/vendors`)
2. Check if any vendors exist
3. If no vendors exist, click "Add Vendor":
   - Name: `Test Vendor Corp`
   - Industry: `Technology`
   - Email: `vendor@example.com`
   - Contact Name: `John Doe`
   - Click "Create"

### Step 1.3: Create Vendor Assessment
1. Click "Assessments" in sidebar
2. Click "New Assessment" button
3. Fill out form:
   ```
   Name: Q1 2026 Security Assessment - Test Vendor
   Type: Vendor Assessment ← IMPORTANT!
   Vendor: Select "Test Vendor Corp" (or the vendor you created)
   Description: Testing vendor self-assessment feature
   ```
4. Click "Create Assessment"
5. ✅ **Verify:** Redirected to assessment detail page

### Step 1.4: Populate Some Assessment Items
1. You should see CSF function tabs (GOVERN, IDENTIFY, PROTECT, etc.)
2. Click on "GOVERN" tab
3. For the first 3-5 subcategories, update the status:
   - First one: Select "Compliant"
   - Second one: Select "Partial"
   - Third one: Select "Non-Compliant"
   - Fourth one: Select "Not Applicable"
4. ✅ **Verify:** Overall score updates as you change statuses

---

## Test 2: Send Assessment to Vendor

### Step 2.1: Open Send Modal
1. On the assessment detail page, you should see a blue "Send to Vendor" button
2. ✅ **Verify:** Button is visible (only shows for vendor assessments)
3. Click "Send to Vendor"
4. Modal should open

### Step 2.2: Configure Invitation
1. Modal form should be pre-filled with vendor email
2. Fill out:
   ```
   Vendor Email: vendor@example.com (or your email for testing)
   Vendor Contact Name: John Doe
   Custom Message: Please complete this security assessment within 30 days. Thank you!
   Link Expiration: 30 days
   ```
3. Click "Send Invitation"
4. ✅ **Verify:** Success message appears

### Step 2.3: Copy Magic Link
1. After sending, you should see a success panel with:
   - Green checkmark
   - "Invitation sent successfully!"
   - A text input with the magic link
   - A "Copy" button
2. **IMPORTANT:** Copy the magic link (it should look like):
   ```
   https://8fa76d6a.csf-compass.pages.dev/vendor-portal/eyJhbGc...
   ```
3. Paste it somewhere safe (notepad, etc.) - you'll need it
4. ✅ **Verify:** Link copies to clipboard
5. Click "Done" to close modal

### Step 2.4: Verify Invitation Status
1. On the assessment detail page, you should now see:
   - Badge: "Invitation: pending"
   - No more "Send to Vendor" button (already sent)
2. ✅ **Verify:** Status badge appears

**🎯 Checkpoint:** You now have a magic link! Save it before continuing.

---

## Test 3: Vendor Completes Self-Assessment

### Step 3.1: Open Vendor Portal (Incognito)
1. **IMPORTANT:** Open a NEW incognito/private browser window
   - Chrome: Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)
   - Firefox: Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)
   - Safari: File → New Private Window
2. Paste the magic link into the address bar
3. Press Enter
4. ✅ **Verify:** Vendor portal page loads

### Step 3.2: Verify Portal Content
You should see:
- ✅ Assessment name at top
- ✅ "Vendor Self-Assessment Portal" subtitle
- ✅ "Welcome, John Doe" (if you provided contact name)
- ✅ Custom message you entered (in blue box)
- ✅ Expiration date
- ✅ "Submit Assessment" button (top right, disabled initially)
- ✅ CSF function tabs

### Step 3.3: Check Browser Cookies (DevTools)
1. Open browser DevTools (F12)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Navigate to Cookies → https://8fa76d6a.csf-compass.pages.dev
4. ✅ **Verify:** You should see a cookie named `vendor_session`
5. Check cookie attributes:
   - HttpOnly: ✅ (should be checked)
   - Secure: ✅ (should be checked)
   - SameSite: Strict
   - Expires: ~24 hours from now

**📝 Note:** The session cookie is what allows the vendor to continue working without the magic link.

### Step 3.4: Test Magic Link Reuse (Should Fail)
1. Copy the vendor portal URL from address bar
2. Open ANOTHER new incognito window
3. Paste the same magic link
4. ✅ **Verify:** You should see an error:
   - "Invalid or expired invitation link"
   - OR "Magic link already used. Please use the link from your browser where you first opened it."
5. This is correct behavior! Magic links work only once.

### Step 3.5: Update Assessment Items
1. Return to the FIRST incognito window (where vendor portal loaded successfully)
2. Click on "GOVERN" function tab
3. Update statuses for 5-10 subcategories:
   - Click buttons: "Compliant", "Partial", "Non-Compliant", "Not Applicable"
4. ✅ **Verify:** Status badges update immediately
5. ✅ **Verify:** No page reload required
6. Check DevTools → Network tab:
   - Should see PATCH requests to `/api/vendor-invitations/.../items/...`
   - Request Headers should include `Cookie: vendor_session=...`

### Step 3.6: Test Page Refresh (Session Persistence)
1. Refresh the vendor portal page (F5 or Cmd+R)
2. ✅ **Verify:** Page reloads successfully
3. ✅ **Verify:** Previously updated items still show correct status
4. ✅ **Verify:** No "magic link already used" error
5. This proves session cookies are working!

### Step 3.7: Update More Items
1. Click through different function tabs (IDENTIFY, PROTECT, etc.)
2. Update 10-15 more items with various statuses
3. Try to make some match the organization's assessment, some different
4. ✅ **Verify:** All updates save immediately

### Step 3.8: Submit Assessment
1. Click "Submit Assessment" button (top right)
2. Confirm in the dialog
3. ✅ **Verify:** Success screen appears:
   - Green checkmark icon
   - "Assessment Completed"
   - "Thank you for completing the cybersecurity assessment"
   - Completion date

**🎯 Checkpoint:** Vendor self-assessment is complete!

---

## Test 4: Organization Views Comparison

### Step 4.1: Return to Organization View
1. Go back to your ORIGINAL browser window (not incognito)
2. Navigate back to the assessment detail page
3. Refresh the page (F5)
4. ✅ **Verify:** Invitation status badge now shows "Invitation: completed"

### Step 4.2: Access Comparison Page
1. You should see a new button: "View Comparison"
2. Click "View Comparison"
3. ✅ **Verify:** Comparison page loads

### Step 4.3: Verify Comparison Stats
At the top, you should see 4 stat cards:
- Total Items (should be 106-120)
- Matches (items where org and vendor statuses match)
- Differences (items where statuses differ)
- Not Assessed (items vendor didn't assess)

✅ **Verify:** Numbers add up correctly

### Step 4.4: Test Filters
1. Click "Matches" filter button
   - ✅ **Verify:** Only shows items where statuses match (green badges)
2. Click "Differences" filter button
   - ✅ **Verify:** Only shows items where statuses differ (yellow badges) or not assessed
3. Click "All Items" filter button
   - ✅ **Verify:** Shows all items

### Step 4.5: Test Function Tabs
1. Click through different function tabs (GOVERN, IDENTIFY, etc.)
2. ✅ **Verify:** Items filter by function
3. ✅ **Verify:** Table shows:
   - Subcategory ID and name
   - Your Assessment status (color-coded badge)
   - Vendor Self-Assessment status (color-coded badge)
   - Status column ("✓ Match" or "⚠ Difference")

### Step 4.6: Check Comparison Details
1. Find an item where statuses match:
   - ✅ **Verify:** Shows green "✓ Match" badge
   - ✅ **Verify:** Both columns show same status
2. Find an item where statuses differ:
   - ✅ **Verify:** Shows yellow "⚠ Difference" badge
   - ✅ **Verify:** Different status badges in each column
3. Find an item vendor didn't assess:
   - ✅ **Verify:** Vendor column shows "Not assessed" (gray, italic)

**🎯 Checkpoint:** Comparison view is working!

---

## Test 5: Security Features

### Test 5.1: Rate Limiting (Token Validation)

**⚠️ Warning:** This test will temporarily block your IP for 60 seconds.

Open Terminal and run:
```bash
# Replace {TOKEN} with the actual token from your magic link
TOKEN="paste-your-token-here"

for i in {1..12}; do
  echo "Request $i:"
  curl -s -w "HTTP Status: %{http_code}\n" \
    "https://csf-compass-worker.mehmettunahanokumus.workers.dev/api/vendor-invitations/validate/$TOKEN" \
    -o /dev/null
  sleep 0.1
done
```

✅ **Expected result:**
- Requests 1-10: HTTP Status: 401 or 403 (token already used, but passes rate limit)
- Request 11: HTTP Status: 429 (rate limited!)
- Request 12: HTTP Status: 429 (still rate limited)

### Test 5.2: Check Audit Log

Run in terminal:
```bash
npx wrangler d1 execute csf-compass-db --remote --command \
  "SELECT action, COUNT(*) as count FROM vendor_audit_log GROUP BY action ORDER BY action"
```

✅ **Expected output:** Should show counts for:
- `token_validated` (at least 1)
- `status_updated` (should match number of items you updated)
- `assessment_submitted` (should be 1)
- `rate_limited` (if you ran the rate limit test)

### Test 5.3: Verify Session Cookie Security

In the vendor portal (incognito window with valid session):
1. Open DevTools → Console
2. Try to access the cookie via JavaScript:
   ```javascript
   document.cookie
   ```
3. ✅ **Verify:** The `vendor_session` cookie should NOT appear in the output
4. This confirms HttpOnly is working (JavaScript can't access it)

---

## Test 6: Token Revocation

### Step 6.1: Send Another Invitation
1. Go back to organization view
2. Navigate to Assessments
3. Create a NEW vendor assessment (or use existing one)
4. Send invitation to vendor (get magic link)
5. **Don't open the magic link yet!**

### Step 6.2: Revoke the Invitation
1. After sending, you should see the success modal with magic link
2. ✅ **Verify:** You should see a "Revoke Invitation" button (bottom left)
3. Click "Revoke Invitation"
4. Confirm the revocation
5. ✅ **Verify:** Success message appears
6. Modal closes

### Step 6.3: Test Revoked Link
1. Copy the revoked magic link
2. Open in new incognito window
3. ✅ **Verify:** Error appears:
   - "This invitation has been revoked"
   - HTTP 403 Forbidden
4. This proves revocation works!

### Step 6.4: Check Revocation in Database
```bash
npx wrangler d1 execute csf-compass-db --remote --command \
  "SELECT invitation_status, revoked_at, revoked_by FROM vendor_assessment_invitations WHERE revoked_at IS NOT NULL LIMIT 5"
```

✅ **Expected:** Should show the revoked invitation with timestamp and user ID

---

## Test 7: Error Handling

### Test 7.1: Invalid Token
1. Open browser: `https://8fa76d6a.csf-compass.pages.dev/vendor-portal/invalid-token-12345`
2. ✅ **Verify:** Error page appears:
   - "Invalid Invitation"
   - "Invalid or expired invitation link"

### Test 7.2: Expired Token
**Note:** Can't easily test 7-day expiration, but system handles it

### Test 7.3: Network Error Handling
1. Open vendor portal with valid session
2. Open DevTools → Network
3. Throttle network: "Slow 3G"
4. Try to update an item status
5. ✅ **Verify:** Loading state appears
6. ✅ **Verify:** Eventually succeeds or shows error

---

## 📊 Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Worker Health | ⬜ | |
| Database Tables | ⬜ | |
| Create Vendor Assessment | ⬜ | |
| Send Invitation | ⬜ | |
| Magic Link (First Use) | ⬜ | |
| Magic Link (Reuse - Should Fail) | ⬜ | |
| Session Cookie Set | ⬜ | |
| Session Persistence (Refresh) | ⬜ | |
| Update Items | ⬜ | |
| Submit Assessment | ⬜ | |
| View Comparison | ⬜ | |
| Comparison Filters | ⬜ | |
| Rate Limiting | ⬜ | |
| Audit Logging | ⬜ | |
| HttpOnly Cookie | ⬜ | |
| Token Revocation | ⬜ | |
| Error Handling | ⬜ | |

---

## 🐛 Common Issues & Solutions

### Issue: "Failed to fetch" errors
**Solution:**
- Check browser console for CORS errors
- Verify ALLOWED_ORIGINS in worker config
- Try in different browser

### Issue: Session cookie not set
**Solution:**
- Must use HTTPS in production
- Check if browser blocks third-party cookies
- Verify SameSite=Strict compatibility

### Issue: Magic link shows "already used" immediately
**Solution:**
- This is correct if you used it before!
- Test in fresh incognito window with new invitation

### Issue: Items don't update
**Solution:**
- Check DevTools → Network for errors
- Verify session cookie present in request
- Check worker logs: `npx wrangler tail`

---

## ✅ Success Criteria

Your deployment is successful if:

1. ✅ Vendor portal loads via magic link
2. ✅ Session cookie created (HttpOnly + Secure + SameSite=Strict)
3. ✅ Magic link reuse fails (one-time use enforced)
4. ✅ Session persists after refresh (no magic link needed)
5. ✅ Items update and save
6. ✅ Assessment submission works
7. ✅ Comparison view shows correct data
8. ✅ Rate limiting triggers after 10 requests
9. ✅ Audit log records all actions
10. ✅ Token revocation prevents access

---

## 📝 Notes

- **Magic links expire after 7 days** (configurable in SendToVendorModal)
- **Session cookies expire after 24 hours** (hardcoded in backend)
- **Rate limits reset after 60 seconds** (KV TTL)
- **Audit logs never expire** (stored in D1 permanently)

---

## 🎊 Congratulations!

If all tests pass, your vendor self-assessment feature is **production-ready**!

**Next steps:**
- Share the feature with real users
- Monitor worker logs for errors
- Set up Cloudflare Analytics
- Configure email notifications (future enhancement)

**Need help?** Check:
- `TESTING_GUIDE.md` - Detailed test scenarios
- `VENDOR_SELF_ASSESSMENT_IMPLEMENTATION.md` - Technical docs
- Worker logs: `npx wrangler tail`
