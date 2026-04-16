# WeddingOS Project TODO

## CORE PRODUCT FLOW (PRIORITY)

### 1. Guests → RSVP → Dashboard End-to-End
- [ ] Verify guest list loads in Dashboard
- [ ] Verify RSVP link generation works for each guest
- [ ] Test guest submits RSVP via token link
- [ ] Verify Dashboard updates with RSVP response in real-time
- [ ] Verify meal preferences save correctly
- [ ] Verify plus-ones count updates Dashboard total

### 2. Seating System - Real Guest Assignment
- [ ] Load confirmed guests from RSVP responses
- [ ] Allow dragging guests to table seats
- [ ] Show guest names on assigned seats
- [ ] Prevent double-assignment of same guest
- [ ] Save seating arrangement
- [ ] Display seating summary on Dashboard

### 3. RSVP Plus-Ones & Meals Logic
- [ ] When guest selects "2 plus-ones", show 3 meal fields (guest + 2 companions)
- [ ] Each person gets their own meal preference
- [ ] Reset meal fields when plus-one count changes
- [ ] Save all meal preferences with RSVP
- [ ] Display meal breakdown by type on Dashboard
- [ ] Show per-person meal summary in seating

### 4. Dashboard Real-Time Updates
- [ ] Show total invited guests
- [ ] Show confirmed RSVPs count
- [ ] Show declined RSVPs count
- [ ] Show pending RSVPs count
- [ ] Show total attending (including plus-ones)
- [ ] Show meal preferences breakdown
- [ ] Show seating status

---

## COMPLETED PHASES

## Phase 1: Project Setup & Database Schema
- [x] Design and implement database schema
- [x] Create Drizzle migrations for all tables
- [x] Set up tRPC procedures for core features

## Phase 2: Core Layout & Authentication
- [x] Implement WeddingLayout with sidebar navigation
- [x] Set up authentication for couple (owner) views
- [x] Implement Scandinavian design aesthetic

## Phase 3: Dashboard & Guests (MVP)
- [x] Build Dashboard page with guest stats
- [x] Implement Guests page with add/edit/delete
- [x] Add filtering by group and role
- [x] Add search functionality

## Phase 4: RSVP System
- [x] Create guest-facing RSVP page (public, token-based)
- [x] Build RSVP form (attendance, plus-ones, meal preference)
- [x] Create RSVP summary dashboard for couple
- [x] Show meal preference breakdown
- [x] Display attendance stats (confirmed, declined, pending)

## Phase 5: Hebrew Redesign
- [x] Implement RTL (right-to-left) layout globally
- [x] Move sidebar to right side
- [x] Create Hebrew landing page with new copy
- [x] Translate all UI text to Hebrew
- [x] Update color scheme to modern Israeli wedding style

## Phase 6: RSVP Token System & QA
- [x] Add friendly Hebrew error screen for invalid tokens
- [x] Add demo token support to RSVP router
- [x] Fix RSVP submit mutation for demo token
- [x] Audit and fix Hebrew language throughout app
- [x] Fix UX issues and RTL layout

## Phase 7: Production Readiness
- [x] Create all sidebar pages (Invitations, Seating, Budget, Timeline, Gallery)
- [x] Fix all sidebar navigation links to working pages
- [x] Add fallback routing to prevent 404 errors
- [x] Convert ALL remaining English text to Hebrew
- [x] Verify RTL layout on all pages
- [x] Test mobile responsiveness

## Phase 8: UX & Logic Improvements
- [x] Simplify Add Guest form (only שם, טלפון, צד, סוג אורח)
- [x] Replace role dropdown with radio/button selection UI
- [x] Move plus-ones and meal preference to RSVP form
- [x] Implement dynamic meal preference fields for plus-ones
- [x] Build seating system with drag-and-drop tables
- [x] Write comprehensive UX feature tests

## Phase 9: Database Setup & Demo Data
- [x] Execute database migration to create all 13 tables
- [x] Create demo wedding record (דנה & עומר)
- [x] Add 5 demo guests with RSVP tokens
- [x] Verify all database connections work

## Phase 10: Transform to Real Product
- [x] Fix Guest Form - keep only name, phone, group, role
- [x] Fix RSVP Logic - ensure plusOnesMeals matches plusOnesCount
- [x] Upgrade Seating System - add chairs, assign guests, show names
- [x] Complete Budget page - working MVP
- [x] Complete Gallery page - working MVP
- [x] Complete Timeline page - working MVP
