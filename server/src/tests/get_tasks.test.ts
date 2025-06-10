
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();
    expect(result).toEqual([]);
  });

  it('should return all tasks', async () => {
    // Create test tasks
    await db.insert(tasksTable)
      .values([
        {
          title: 'First Task',
          description: 'First task description',
          completed: false
        },
        {
          title: 'Second Task',
          description: null,
          completed: true
        }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    
    // Verify task fields
    const firstTask = result.find(task => task.title === 'First Task');
    expect(firstTask).toBeDefined();
    expect(firstTask!.title).toEqual('First Task');
    expect(firstTask!.description).toEqual('First task description');
    expect(firstTask!.completed).toEqual(false);
    expect(firstTask!.id).toBeDefined();
    expect(firstTask!.created_at).toBeInstanceOf(Date);
    expect(firstTask!.updated_at).toBeInstanceOf(Date);

    const secondTask = result.find(task => task.title === 'Second Task');
    expect(secondTask).toBeDefined();
    expect(secondTask!.title).toEqual('Second Task');
    expect(secondTask!.description).toBeNull();
    expect(secondTask!.completed).toEqual(true);
  });

  it('should return tasks ordered by creation date (newest first)', async () => {
    // Create tasks with slight delay to ensure different timestamps
    await db.insert(tasksTable)
      .values({ title: 'Older Task', completed: false })
      .execute();
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(tasksTable)
      .values({ title: 'Newer Task', completed: false })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Newer Task');
    expect(result[1].title).toEqual('Older Task');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });
});
