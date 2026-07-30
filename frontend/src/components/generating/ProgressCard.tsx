import { Bot } from 'lucide-react';
import {
  GENERATION_STAGES,
  GENERATION_STAGE_LABELS,
  type GenerationStage,
} from '../../types/specification.types';
import { Surface } from '../ui';
import { StageListItem, type StageStatus } from './StageListItem';
import { ProgressBar } from './ProgressBar';

// The generation progress card (T027). Shows the five stages with live status and a progress
// bar. The stage list is an aria-live region so screen readers hear stage changes announced.

export interface ProgressCardProps {
  activeStage: GenerationStage | null;
  completedStages: GenerationStage[];
}

function stageStatus(
  stage: GenerationStage,
  activeStage: GenerationStage | null,
  completedStages: GenerationStage[],
): StageStatus {
  if (completedStages.includes(stage)) return 'done';
  if (activeStage === stage) return 'active';
  return 'pending';
}

export function ProgressCard({ activeStage, completedStages }: ProgressCardProps) {
  const progress = completedStages.length / GENERATION_STAGES.length;

  return (
    <Surface surface="rounded-2xl bg-white shadow-card" className="p-8" elevation={4}>
      <div className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600">
            <Bot className="h-6 w-6 text-white" aria-hidden="true" />
          </span>
        </span>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Generating your Specification…</h1>
        <p className="mt-2 text-slate-500">
          Fetch AI Agent is analyzing your project requirements.
        </p>
      </div>

      <ul className="mx-auto mt-8 flex max-w-sm flex-col gap-4" aria-live="polite">
        {GENERATION_STAGES.map((stage) => (
          <StageListItem
            key={stage}
            label={GENERATION_STAGE_LABELS[stage]}
            status={stageStatus(stage, activeStage, completedStages)}
          />
        ))}
      </ul>

      <div className="mt-8">
        <ProgressBar value={progress} />
      </div>
    </Surface>
  );
}
