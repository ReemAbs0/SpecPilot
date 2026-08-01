import { FieldValue, type CollectionReference, type Timestamp } from 'firebase-admin/firestore';
import { getDb } from '../lib/firebaseAdmin';
import type { Specification } from '../models/specification.types';
import type {
  SavedSpecification,
  SavedSpecificationSummary,
} from '../models/savedSpecification.types';

// Firestore persistence for saved specifications (feature/firebase-auth, Phase 4a). Uses the
// Admin SDK exclusively — reads/writes go under the per-user subcollection
// `users/{uid}/specifications/{id}` so a user's records are naturally isolated and the token
// uid from the auth middleware is the only key needed. Nothing here touches the generation
// flow.

function userSpecifications(uid: string): CollectionReference {
  return getDb().collection('users').doc(uid).collection('specifications');
}

/** Converts a Firestore Timestamp to an ISO string; null while a serverTimestamp is pending. */
function timestampToIso(value: unknown): string | null {
  if (value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate().toISOString();
  }
  return null;
}

/** Persists a generated specification for the user and returns the new document id. */
export async function saveSpecification(
  uid: string,
  input: { idea: string; specification: Specification },
): Promise<{ id: string }> {
  const ref = await userSpecifications(uid).add({
    title: input.specification.title,
    idea: input.idea,
    specification: input.specification,
    createdAt: FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
}

/** Lists the user's saved specifications, newest first (summaries only). */
export async function listSpecifications(uid: string): Promise<SavedSpecificationSummary[]> {
  const snapshot = await userSpecifications(uid)
    .orderBy('createdAt', 'desc')
    .select('title', 'idea', 'createdAt')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: typeof data.title === 'string' ? data.title : '',
      idea: typeof data.idea === 'string' ? data.idea : '',
      createdAt: timestampToIso(data.createdAt),
    };
  });
}

/**
 * Renames one saved specification. Writes both the denormalised `title` (used by the list view)
 * and the nested `specification.title` so every read path shows the new name. Returns false when
 * the record does not exist for this user — the caller turns that into a 404.
 */
export async function updateSpecificationTitle(
  uid: string,
  id: string,
  title: string,
): Promise<boolean> {
  const ref = userSpecifications(uid).doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    return false;
  }
  // Dotted paths update the single nested field, leaving the rest of the specification intact.
  await ref.update({ title, 'specification.title': title });
  return true;
}

/**
 * Deletes one saved specification. Returns false when the record does not exist for this user,
 * so the caller can answer 404 instead of silently reporting success for someone else's id.
 */
export async function deleteSpecification(uid: string, id: string): Promise<boolean> {
  const ref = userSpecifications(uid).doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    return false;
  }
  await ref.delete();
  return true;
}

/** Fetches one saved specification by id, or null if it does not exist for this user. */
export async function getSpecification(
  uid: string,
  id: string,
): Promise<SavedSpecification | null> {
  const doc = await userSpecifications(uid).doc(id).get();
  if (!doc.exists) {
    return null;
  }
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    title: typeof data.title === 'string' ? data.title : '',
    idea: typeof data.idea === 'string' ? data.idea : '',
    specification: data.specification as Specification,
    createdAt: timestampToIso(data.createdAt),
  };
}
