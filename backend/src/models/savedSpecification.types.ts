// Shapes for specifications persisted to Firestore under a user's account
// (feature/firebase-auth, Phase 4a). A saved record wraps the exact generated `Specification`
// (unchanged shape) with a little metadata for the library list. Documents live at
// `users/{uid}/specifications/{id}`.

import type { Specification } from './specification.types';

/** Lightweight record for the library list view (no heavy nested specification). */
export interface SavedSpecificationSummary {
  /** Firestore document id. */
  id: string;
  /** Mirrors specification.title, stored top-level so the list can be read cheaply. */
  title: string;
  /** The source idea prompt, shown as a subtitle in the list. */
  idea: string;
  /** ISO timestamp of when the record was created; null if the server timestamp is pending. */
  createdAt: string | null;
}

/** A full saved record, including the complete generated specification. */
export interface SavedSpecification extends SavedSpecificationSummary {
  specification: Specification;
}
