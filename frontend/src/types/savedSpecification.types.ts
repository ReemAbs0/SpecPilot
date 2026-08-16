// Frontend shapes for specifications persisted to a user's account (feature/firebase-auth,
// Phase 5). Mirrors backend/src/models/savedSpecification.types.ts and is kept in sync manually
// (constitution Principle II — no shared package for a two-project MVP), the same convention as
// specification.types.ts.

import type { Specification } from './specification.types';

/** Lightweight record for the library list view (no heavy nested specification). */
export interface SavedSpecificationSummary {
  /** Firestore document id — used to open the saved specification at /library/:id. */
  id: string;
  /** Mirrors specification.title. */
  title: string;
  /** The source idea prompt, shown as a subtitle in the list. */
  idea: string;
  /** ISO timestamp of when the record was created; null if the server timestamp is pending. */
  createdAt: string | null;
}

/** A full saved record, including the complete generated specification (used in Phase 6). */
export interface SavedSpecification extends SavedSpecificationSummary {
  specification: Specification;
}
