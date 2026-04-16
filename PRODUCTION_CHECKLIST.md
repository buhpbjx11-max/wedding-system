# Production Completion Checklist

## Core System Verification

### 1. Guests Management
- [ ] createGuest returns valid guest object with ID
- [ ] updateGuest works without errors
- [ ] deleteGuest removes from database
- [ ] getGuestsByWeddingId returns all guests
- [ ] No undefined values in guest data

### 2. RSVP Token Generation
- [ ] generateToken creates unique token
- [ ] Token stored in database with expiration
- [ ] getRsvpTokenByToken retrieves token correctly
- [ ] Token never returns undefined
- [ ] Expiration date set to 30 days

### 3. RSVP Submission
- [ ] getByToken loads correct guest by token
- [ ] Guest name displays on RSVP form
- [ ] submit mutation saves attendance
- [ ] Plus-ones count saved correctly
- [ ] Meal preferences saved per person
- [ ] No data loss on submission

### 4. Dashboard
- [ ] Shows total invited guests
- [ ] Shows confirmed count
- [ ] Shows declined count
- [ ] Shows pending count
- [ ] Shows total attending (including plus-ones)
- [ ] Shows meal breakdown
- [ ] All numbers update after RSVP submission

### 5. Seating System
- [ ] Only confirmed guests appear in list
- [ ] Guest names display correctly
- [ ] Can assign guests to seats
- [ ] Assignments persist in database
- [ ] No placeholder data

### 6. End-to-End Flow
- [ ] Create guest → works
- [ ] Generate RSVP link → works
- [ ] Copy link → works
- [ ] Open link → loads correct guest
- [ ] Submit RSVP → updates database
- [ ] Dashboard updates → reflects new data
- [ ] Seating shows confirmed guest → works

## Bug Fixes Required
- [ ] Fix all undefined returns
- [ ] Fix all database write failures
- [ ] Fix all API response mismatches
- [ ] Remove all console-only outputs
- [ ] Remove all test/debug code
- [ ] Remove all mock data

## Production Ready Criteria
- [ ] Zero runtime errors
- [ ] Zero undefined values
- [ ] Zero broken flows
- [ ] All UI reflects real data
- [ ] All database operations persist
- [ ] All API responses valid
