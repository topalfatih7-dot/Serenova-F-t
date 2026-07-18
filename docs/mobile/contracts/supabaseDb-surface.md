# Contract — supabaseDb Surface (mobile-relevant)

Implement equivalent service functions (names for parity):

## Auth / registration

`getSession`, `login`, `logout`, `ensureAuthForRegistration`, `register`, `registerWithPlan`, `registerWithPayment`, `completeOAuthMember`, `resolveQuickPostLoginPath`, `savePendingRegistrationMetadata`

## Member

`hydrate`, `saveMemberPatch`, `changeMemberPlan`, `processPremiumPayment`, `fetchMemberSessions`

## Programs / tickets

`createProgram`, `createTicket`, `setTicketStatus`, `sendTicketReply`

## Exercises

`getExerciseVideoUrl`, `prefetchExerciseVideoUrls`, `getExerciseThumbUrl`, `add/edit/removeExercise` (admin), `uploadExerciseVideo` (admin)

## Staff / admin

`addStaff`, `editStaff`, `updateStaffSelfProfile`, `adminUpdatePremiumMembership`, `adminSetMembershipStatus`, `bookStaffSession`, application resolve/submit helpers

## Content

`getPlans`, `upsertPlan`, posts/content CRUD, `submitSuccessStory`

Full list evolves with web `src/services/supabaseDb.js` exports — keep this file updated when porting.
