# NEXORA Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **User Profile Privacy**: `/users/{userId}` contains PII (`email`, `displayName`). Only the verified owner (`request.auth.uid == userId`) can read, create, or update their profile.
2. **Project Ownership**: Every `/projects/{projectId}` document belongs to an authenticated, email-verified user (`ownerId == request.auth.uid`). `ownerId` and `createdAt` are immutable after creation.
3. **Relational Sync for Milestones & Tasks**: Every `/milestones/{milestoneId}` and `/tasks/{taskId}` must reference an existing parent `/projects/{projectId}` owned by `request.auth.uid` on creation.
4. **URL Safety for Resources**: `/resources/{resourceId}` URLs must begin with `http://` or `https://` to prevent `javascript:` XSS payloads.
5. **Activity Log Integrity**: `/activities/{activityId}` entries are append-only by the authenticated owner and cannot be forged for another `ownerId`.
6. **Temporal Integrity**: `createdAt` and `updatedAt` are validated against `request.time`.

## 2. Adversarial Test Vectors ("Dirty Dozen")
1. Unauthenticated read/write to `/projects/proj-1` -> PERMISSION_DENIED
2. Unverified email user creating `/projects/proj-2` -> PERMISSION_DENIED
3. Spoofed `ownerId` (`ownerId != request.auth.uid`) on project create -> PERMISSION_DENIED
4. Shadow field injection (`isAdmin: true`) on `/users/{uid}` or `/projects/{id}` -> PERMISSION_DENIED
5. Oversized document ID (`> 128` chars or invalid chars `../`) -> PERMISSION_DENIED
6. Changing immutable `ownerId` or `createdAt` on update -> PERMISSION_DENIED
7. Creating a task for another user's `projectId` -> PERMISSION_DENIED
8. Creating a milestone with a non-existent `projectId` -> PERMISSION_DENIED
9. Injecting `javascript:alert(1)` as a resource `url` -> PERMISSION_DENIED
10. Blanket `list` query without `where('ownerId', '==', uid)` -> PERMISSION_DENIED
11. Backdating `createdAt` or `updatedAt` (not equal to `request.time`) -> PERMISSION_DENIED
12. Exceeding string or array length bounds (`objectives.size() > 10` or `title.size() > 200`) -> PERMISSION_DENIED
