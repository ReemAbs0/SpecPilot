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
