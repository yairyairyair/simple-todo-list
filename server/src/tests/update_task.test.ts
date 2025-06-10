
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task title', async () => {
    // Create a task directly in the database
    const createdTasks = await db.insert(tasksTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();
    
    const createdTask = createdTasks[0];

    // Update the title
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      title: 'Updated Title'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.completed).toEqual(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should update task description', async () => {
    // Create a task directly in the database
    const createdTasks = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();
    
    const createdTask = createdTasks[0];

    // Update the description
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      description: 'Updated description'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Test Task'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(false); // Should remain unchanged
  });

  it('should update task completion status', async () => {
    // Create a task directly in the database
    const createdTasks = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'Test description',
        completed: false
      })
      .returning()
      .execute();
    
    const createdTask = createdTasks[0];

    // Update the completion status
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      completed: true
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Test Task'); // Should remain unchanged
    expect(result.description).toEqual('Test description'); // Should remain unchanged
    expect(result.completed).toEqual(true);
  });

  it('should update multiple fields at once', async () => {
    // Create a task directly in the database
    const createdTasks = await db.insert(tasksTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();
    
    const createdTask = createdTasks[0];

    // Update multiple fields
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      title: 'Updated Title',
      description: 'Updated description',
      completed: true
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should set description to null', async () => {
    // Create a task with description
    const createdTasks = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'Has description',
        completed: false
      })
      .returning()
      .execute();
    
    const createdTask = createdTasks[0];

    // Update description to null
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      description: null
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Test Task'); // Should remain unchanged
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false); // Should remain unchanged
  });

  it('should save updated task to database', async () => {
    // Create a task directly in the database
    const createdTasks = await db.insert(tasksTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();
    
    const createdTask = createdTasks[0];

    // Update the task
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      title: 'Updated Title',
      completed: true
    };

    await updateTask(updateInput);

    // Query the database directly to verify update
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Updated Title');
    expect(tasks[0].description).toEqual('Original description');
    expect(tasks[0].completed).toEqual(true);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when task not found', async () => {
    const updateInput: UpdateTaskInput = {
      id: 999999, // Non-existent task ID
      title: 'Updated Title'
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/Task with id 999999 not found/i);
  });
});
