import { describe, it, expect, vi } from 'vitest';
import { useEffect, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { IdeaForm } from '../src/components/generator/IdeaForm';
import ResultPage from '../src/pages/ResultPage';
import { SpecificationProvider, useSpecification } from '../src/state/SpecificationContext';
import type { Specification } from '../src/types/specification.types';

// T040: component tests for IdeaForm validation and ResultPage section rendering.

// ResultPage reads auth to persist a renamed title; a guest (user: null) keeps the rename local.
vi.mock('../src/state/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({ user: null, loading: false }),
}));

describe('IdeaForm validation', () => {
  it('blocks submission below the minimum length and shows a message', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <IdeaForm value="too short" onChange={() => {}} onSubmit={onSubmit} isSubmitting={false} />,
    );

    await user.click(screen.getByRole('button', { name: /generate specification/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/at least 20 characters/i)).toBeInTheDocument();
  });

  it('submits when the idea meets the minimum length', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <IdeaForm
        value="A budgeting app that tracks expenses and income for individuals."
        onChange={() => {}}
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: /generate specification/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows a server-provided submit error', () => {
    render(
      <IdeaForm
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
        isSubmitting={false}
        submitError="A specification is already being generated."
      />,
    );
    expect(screen.getByText(/already being generated/i)).toBeInTheDocument();
  });
});

const SPEC: Specification = {
  title: 'Habit Tracker Specification',
  projectSummary: 'A habit tracking application for daily routines.',
  targetUsers: 'People building better habits',
  userRoles: ['Member', 'Coach'],
  functionalRequirements: ['Create habits', 'Track streaks'],
  nonFunctionalRequirements: ['Fast load times'],
  userStories: [
    { title: 'Track', narrative: 'As a Member, I want to log a habit', role: 'Member' },
  ],
  milestones: [{ name: 'MVP', description: 'Core tracking', order: 1 }],
  technicalConsiderations: ['Offline-first storage'],
};

// Seeds the context to a successful result BEFORE mounting ResultPage, so the page's
// "not success → redirect" guard doesn't fire during setup.
function SeededResult({ spec, children }: { spec: Specification; children: ReactNode }) {
  const { state, dispatch } = useSpecification();
  useEffect(() => {
    dispatch({ type: 'SUCCEEDED', specification: spec });
  }, [dispatch, spec]);
  // Only mount the children (ResultPage) once the context reflects a successful result, so the
  // page's "not success → redirect" guard never fires during setup.
  return state.status === 'success' ? <>{children}</> : null;
}

describe('ResultPage section rendering', () => {
  it('renders the title and all eight specification sections', async () => {
    render(
      <MemoryRouter initialEntries={['/result']}>
        <SpecificationProvider>
          <SeededResult spec={SPEC}>
            <Routes>
              <Route path="/result" element={<ResultPage />} />
              <Route path="/generate" element={<div>generator</div>} />
            </Routes>
          </SeededResult>
        </SpecificationProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Habit Tracker Specification')).toBeInTheDocument();
    for (const heading of [
      'Project Summary',
      'Target Users',
      'User Roles',
      'Functional Requirements',
      'Non-functional Requirements',
      'User Stories',
      'Development Milestones',
      'Technical Considerations',
    ]) {
      expect(screen.getByText(heading)).toBeInTheDocument();
    }
    // Representative content from a few sections.
    expect(screen.getByText(SPEC.projectSummary)).toBeInTheDocument();
    expect(screen.getByText('Create habits')).toBeInTheDocument();
    expect(screen.getByText('Offline-first storage')).toBeInTheDocument();
  });
});
