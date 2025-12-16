# Delete Supplier Feature - Test Checklist

## Prerequisites
- [ ] Backend server is running (`npm start` in backend folder)
- [ ] You have a valid JWT token (login first)
- [ ] You have at least one supplier created

## Test Cases

### ✅ Test 1: Delete Supplier Without Bills
**Objective:** Successfully delete a supplier that has no associated bills

**Steps:**
1. Create a new supplier (POST /api/suppliers)
2. Note the supplier ID from response
3. Delete the supplier (DELETE /api/suppliers/:id)

**Expected Result:**
- Status: 200 OK
- Response includes: supplierId, supplierName, deletedAt
- Message: "Supplier deleted successfully"

**Actual Result:** _________

---

### ✅ Test 2: Delete Supplier With Bills
**Objective:** Successfully delete a supplier that has associated bills

**Steps:**
1. Create a supplier (POST /api/suppliers)
2. Create one or more bills for that supplier (POST /api/bills)
3. Delete the supplier (DELETE /api/suppliers/:id)

**Expected Result:**
- Status: 200 OK
- Response includes: supplierId, supplierName, associatedBills, deletedAt
- Message: "Supplier deleted successfully. Note: X associated bill(s) remain intact."
- Bills should still be retrievable

**Actual Result:** _________

---

### ✅ Test 3: Invalid Supplier ID Format
**Objective:** Validate proper error handling for invalid ID

**Steps:**
1. Attempt to delete with invalid ID: DELETE /api/suppliers/invalid-id

**Expected Result:**
- Status: 400 Bad Request
- Message: "Invalid supplier ID format"

**Actual Result:** _________

---

### ✅ Test 4: Non-Existent Supplier
**Objective:** Validate proper error handling for non-existent supplier

**Steps:**
1. Attempt to delete with valid but non-existent ID: DELETE /api/suppliers/507f1f77bcf86cd799439011

**Expected Result:**
- Status: 404 Not Found
- Message: "Supplier not found"

**Actual Result:** _________

---

### ✅ Test 5: Unauthorized Access
**Objective:** Ensure authentication is required

**Steps:**
1. Attempt to delete without Authorization header

**Expected Result:**
- Status: 401 Unauthorized
- Message: "No token provided" or similar auth error

**Actual Result:** _________

---

### ✅ Test 6: Delete Already Deleted Supplier
**Objective:** Ensure can't delete same supplier twice

**Steps:**
1. Delete a supplier (first time - should succeed)
2. Try to delete same supplier again

**Expected Result:**
- First delete: 200 OK
- Second delete: 404 Not Found (supplier not found)

**Actual Result:** _________

---

### ✅ Test 7: Deleted Supplier Not in List
**Objective:** Verify deleted suppliers don't appear in GET requests

**Steps:**
1. Get list of suppliers (GET /api/suppliers)
2. Note total count
3. Delete one supplier
4. Get list again

**Expected Result:**
- List count decreases by 1
- Deleted supplier not in results

**Actual Result:** _________

---

### ✅ Test 8: Cannot Update Deleted Supplier
**Objective:** Verify deleted suppliers can't be updated

**Steps:**
1. Delete a supplier
2. Try to update it (PUT /api/suppliers/:id)

**Expected Result:**
- Status: 404 Not Found
- Message: "Supplier not found"

**Actual Result:** _________

---

### ✅ Test 9: Cannot Get Deleted Supplier by ID
**Objective:** Verify deleted supplier returns 404 on direct fetch

**Steps:**
1. Delete a supplier
2. Try to fetch it (GET /api/suppliers/:id)

**Expected Result:**
- Status: 404 Not Found
- Message: "Supplier not found"

**Actual Result:** _________

---

### ✅ Test 10: Verify Logging
**Objective:** Ensure delete actions are logged

**Steps:**
1. Delete a supplier
2. Check backend console/terminal

**Expected Result:**
- Console shows: [DELETE SUPPLIER] logs with details
- Includes supplier name, ID, user ID, bill count

**Actual Result:** _________

---

## Sample cURL Commands

### Delete Supplier
```bash
curl -X DELETE http://localhost:5000/api/suppliers/YOUR_SUPPLIER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Invalid ID
```bash
curl -X DELETE http://localhost:5000/api/suppliers/invalid-id \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### No Authorization
```bash
curl -X DELETE http://localhost:5000/api/suppliers/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json"
```

## Testing with Thunder Client / Postman

### Setup
1. Import: `backend/thunder-collection.json`
2. Set environment variables:
   - `baseUrl`: http://localhost:5000
   - `token`: Your JWT token
3. Add DELETE request:
   - Method: DELETE
   - URL: {{baseUrl}}/api/suppliers/:id
   - Headers: Authorization: Bearer {{token}}

### Test Flow
1. Login → Get token
2. Create supplier → Get supplier ID
3. Delete supplier → Verify response
4. Try to get deleted supplier → Should return 404

## Database Verification (Optional)

Connect to MongoDB and verify:
```javascript
// Check supplier is marked as deleted, not removed
db.suppliers.find({ _id: ObjectId("YOUR_SUPPLIER_ID") })
// Should show: { isDeleted: true, deletedAt: ISODate(...) }

// Verify bills still exist
db.bills.find({ supplierId: ObjectId("YOUR_SUPPLIER_ID") })
// Should return bills if any existed
```

## Sign-Off

- [ ] All test cases passed
- [ ] Logging verified
- [ ] No errors in console
- [ ] Bills remain intact after supplier deletion
- [ ] Deleted suppliers don't appear in lists
- [ ] Authentication works correctly

**Tested By:** _________________  
**Date:** _________________  
**Status:** ☐ Pass ☐ Fail  
**Notes:** _________________
