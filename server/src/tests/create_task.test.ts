
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test inputs
const testInputWithDescription: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing'
};

const testInputWithoutDescription: CreateTaskInput = {
  title: 'Test Task Without Description'
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with description', async () => {
    const result = await createTask(testInputWithDescription);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.completed).toEqual(false); // Default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task without description', async () => {
    const result = await createTask(testInputWithoutDescription);

    // Basic field validation
    expect(result.title).toEqual('Test Task Without Description');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false); // Default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInputWithDescription);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].description).toEqual('A task for testing');
    expect(tasks[0].completed).toEqual(false);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description correctly', async () => {
    const result = await createTask(testInputWithoutDescription);

    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task Without Description');
    expect(tasks[0].description).toBeNull();
    expect(tasks[0].completed).toEqual(false);
  });
});
