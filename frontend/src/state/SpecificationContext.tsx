import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
  type Dispatch,
} from 'react';
import {
  specReducer,
  initialSpecState,
  type SpecState,
  type SpecAction,
} from './specificationReducer';
import { useAuth } from './AuthContext';

// React wiring for the generation flow. The pure state logic lives in specificationReducer.ts;
// this file only provides the Context, Provider, and access hook (constitution Principle II —
// Context + useReducer is the whole state layer, no external store).
//
// The provider is mounted once for the lifetime of the tab, so it outlives any single sign-in.
// That makes generation state — idea text, the generated specification, its Firestore id — the
// one place where one account's data could survive into another's session. It is therefore
// subscribed to auth here: every change of identity is reported to the reducer, which owns the
// decision of what survives it (see the AUTH_CHANGED case).

interface SpecContextValue {
  state: SpecState;
  dispatch: Dispatch<SpecAction>;
}

const SpecificationContext = createContext<SpecContextValue | undefined>(undefined);

export function SpecificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(specReducer, initialSpecState);
  const { user, loading } = useAuth();
  const uid = user?.uid ?? null;

  useEffect(() => {
    // While auth is still resolving, "no user" only means "not known yet" — acting on it would
    // read a restored session as a sign-out. Depending on the uid rather than the user object
    // keeps a token refresh (new object, same uid) from reaching the reducer at all.
    if (loading) {
      return;
    }
    dispatch({ type: 'AUTH_CHANGED', uid });
  }, [uid, loading]);

  return (
    <SpecificationContext.Provider value={{ state, dispatch }}>
      {children}
    </SpecificationContext.Provider>
  );
}

/** Access the generation flow state and dispatch. Must be used within SpecificationProvider. */
export function useSpecification(): SpecContextValue {
  const context = useContext(SpecificationContext);
  if (context === undefined) {
    throw new Error('useSpecification must be used within a SpecificationProvider');
  }
  return context;
}
