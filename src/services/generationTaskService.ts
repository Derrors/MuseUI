import type { GenerationTask } from '../types';
import { createId } from '../utils/id';
import { getDB } from './db';

export type CreateGenerationTaskInput = Pick<
  GenerationTask,
  'role' | 'prompt' | 'fullPrompt' | 'apiProfileId' | 'textModel' | 'imageModel' | 'inputImageIds' | 'projectId' | 'artboardId' | 'batchId'
>;

export const createGenerationTask = async (input: Partial<CreateGenerationTaskInput> & { role: string; prompt: string }): Promise<GenerationTask> => {
  const now = new Date().toISOString();
  const task: GenerationTask = {
    id: createId('task'),
    status: 'running',
    role: input.role,
    prompt: input.prompt,
    fullPrompt: input.fullPrompt,
    apiProfileId: input.apiProfileId ?? null,
    textModel: input.textModel ?? null,
    imageModel: input.imageModel ?? null,
    inputImageIds: input.inputImageIds ?? [],
    outputImageIds: [],
    outputAssetIds: [],
    error: null,
    createdAt: now,
    startedAt: now,
    finishedAt: undefined,
    elapsedMs: null,
    projectId: input.projectId ?? null,
    artboardId: input.artboardId ?? null,
    batchId: input.batchId ?? null,
  };
  const db = await getDB();
  await db.put('generationTasks', task);
  return task;
};

export const completeGenerationTask = async (
  id: string,
  updates: Pick<Partial<GenerationTask>, 'outputImageIds' | 'outputAssetIds' | 'apiProfileId' | 'textModel' | 'imageModel' | 'artboardId'> = {},
): Promise<void> => {
  const db = await getDB();
  const existing = await db.get('generationTasks', id);
  if (!existing) return;
  const finishedAt = new Date().toISOString();
  await db.put('generationTasks', {
    ...existing,
    ...updates,
    status: 'done',
    error: null,
    finishedAt,
    elapsedMs: existing.startedAt ? Math.max(0, Date.parse(finishedAt) - Date.parse(existing.startedAt)) : null,
  });
};

export const failGenerationTask = async (id: string, error: string): Promise<void> => {
  const db = await getDB();
  const existing = await db.get('generationTasks', id);
  if (!existing) return;
  const finishedAt = new Date().toISOString();
  await db.put('generationTasks', {
    ...existing,
    status: 'error',
    error,
    finishedAt,
    elapsedMs: existing.startedAt ? Math.max(0, Date.parse(finishedAt) - Date.parse(existing.startedAt)) : null,
  });
};

export const getGenerationTaskById = async (id: string): Promise<GenerationTask | undefined> => {
  const db = await getDB();
  return db.get('generationTasks', id);
};
