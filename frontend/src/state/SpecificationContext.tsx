import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import {
  specReducer,
  initialSpecState,
  type SpecState,
  type SpecAction,
} from './specificationReducer';

// React wiring for the generation flow. The pure state logic lives in specificationReducer.ts;
// this file only provides the Context, Provider, and access hook (constitution Principle II —
// Context + useReducer is the whole state layer, no external store).

interface SpecContextValue {
  state: SpecState;
  dispatch: Dispatch<SpecAction>;
}

const SpecificationContext = createContext<SpecContextValue | undefined>(undefined);

export function SpecificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(specReducer, initialSpecState);
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
