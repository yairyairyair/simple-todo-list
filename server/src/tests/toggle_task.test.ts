
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type ToggleTaskInput } from '../schema';
import { toggleTask } from '../handlers/toggle_task';
import { eq } from 'drizzle-orm';

describe('toggleTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle task completion status from false to true', async () => {
    // Create a test task
    const createResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing',
        completed: false
      })
      .returning()
      .execute();

    const testTask = createResult[0];

    const toggleInput: ToggleTaskInput = {
      id: testTask.id,
      completed: true
    };

    const result = await toggleTask(toggleInput);

    // Verify the result
    expect(result.id).toEqual(testTask.id);
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.completed).toBe(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testTask.updated_at).toBe(true);
  });

  it('should toggle task completion status from true to false', async () => {
    // Create a completed test task
    const createResult = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'A completed task for testing',
        completed: true
      })
      .returning()
      .execute();

    const testTask = createResult[0];

    const toggleInput: ToggleTaskInput = {
      id: testTask.id,
      completed: false
    };

    const result = await toggleTask(toggleInput);

    // Verify the result
    expect(result.id).toEqual(testTask.id);
    expect(result.title).toEqual('Completed Task');
    expect(result.description).toEqual('A completed task for testing');
    expect(result.completed).toBe(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testTask.updated_at).toBe(true);
  });

  it('should save changes to database', async () => {
    // Create a test task
    const createResult = await db.insert(tasksTable)
      .values({
        title: 'Database Test Task',
        completed: false
      })
      .returning()
      .execute();

    const testTask = createResult[0];

    const toggleInput: ToggleTaskInput = {
      id: testTask.id,
      completed: true
    };

    await toggleTask(toggleInput);

    // Query the database to verify changes were saved
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testTask.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].completed).toBe(true);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at > testTask.updated_at).toBe(true);
  });

  it('should throw error for non-existent task', async () => {
    const toggleInput: ToggleTaskInput = {
      id: 999,
      completed: true
    };

    await expect(toggleTask(toggleInput)).rejects.toThrow(/Task with id 999 not found/i);
  });

  it('should handle null description correctly', async () => {
    // Create a task with null description
    const createResult = await db.insert(tasksTable)
      .values({
        title: 'Task with no description',
        description: null,
        completed: false
      })
      .returning()
      .execute();

    const testTask = createResult[0];

    const toggleInput: ToggleTaskInput = {
      id: testTask.id,
      completed: true
    };

    const result = await toggleTask(toggleInput);

    expect(result.description).toBeNull();
    expect(result.completed).toBe(true);
  });
});
