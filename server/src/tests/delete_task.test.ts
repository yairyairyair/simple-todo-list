
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // Create a test task first
    const [createdTask] = await db.insert(tasksTable)
      .values({
        title: 'Task to Delete',
        description: 'This task will be deleted',
        completed: false
      })
      .returning()
      .execute();

    const input: DeleteTaskInput = {
      id: createdTask.id
    };

    const result = await deleteTask(input);

    // Should return success: true
    expect(result.success).toBe(true);

    // Verify task was actually deleted from database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should return success: false for non-existent task', async () => {
    const input: DeleteTaskInput = {
      id: 999 // Non-existent ID
    };

    const result = await deleteTask(input);

    // Should return success: false when task doesn't exist
    expect(result.success).toBe(false);
  });

  it('should not affect other tasks when deleting', async () => {
    // Create multiple test tasks
    const [task1] = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        description: 'First task',
        completed: false
      })
      .returning()
      .execute();

    const [task2] = await db.insert(tasksTable)
      .values({
        title: 'Task 2', 
        description: 'Second task',
        completed: true
      })
      .returning()
      .execute();

    // Delete only task1
    const input: DeleteTaskInput = {
      id: task1.id
    };

    const result = await deleteTask(input);

    expect(result.success).toBe(true);

    // Verify task1 is deleted
    const deletedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task1.id))
      .execute();

    expect(deletedTasks).toHaveLength(0);

    // Verify task2 still exists
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task2.id))
      .execute();

    expect(remainingTasks).toHaveLength(1);
    expect(remainingTasks[0].title).toEqual('Task 2');
  });
});
