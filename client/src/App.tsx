
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, CircleIcon } from 'lucide-react';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state for new task
  const [newTaskData, setNewTaskData] = useState<CreateTaskInput>({
    title: '',
    description: null
  });

  // Form state for editing task
  const [editTaskData, setEditTaskData] = useState<UpdateTaskInput>({
    id: 0,
    title: '',
    description: null
  });

  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskData.title.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.createTask.mutate(newTaskData);
      setTasks((prev: Task[]) => [...prev, response]);
      setNewTaskData({ title: '', description: null });
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const response = await trpc.toggleTask.mutate({
        id: task.id,
        completed: !task.completed
      });
      setTasks((prev: Task[]) => 
        prev.map((t: Task) => t.id === task.id ? response : t)
      );
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditTaskData({
      id: task.id,
      title: task.title,
      description: task.description
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTaskData.title?.trim()) return;

    setIsLoading(true);
    try {
      const response = await trpc.updateTask.mutate(editTaskData);
      setTasks((prev: Task[]) => 
        prev.map((t: Task) => t.id === editTaskData.id ? response : t)
      );
      setIsEditDialogOpen(false);
      setEditTaskData({ id: 0, title: '', description: null });
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter((t: Task) => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const completedTasks = tasks.filter((task: Task) => task.completed);
  const pendingTasks = tasks.filter((task: Task) => !task.completed);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Todo List</h1>
          <p className="text-gray-600">Stay organized and productive</p>
        </div>

        {/* Task Creation Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              Add New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <Input
                placeholder="What needs to be done?"
                value={newTaskData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTaskData((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
                }
                required
                className="text-lg"
              />
              <Textarea
                placeholder="Add description (optional)"
                value={newTaskData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNewTaskData((prev: CreateTaskInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                rows={3}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Adding...' : 'Add Task'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Task Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
                <div className="text-sm text-gray-600">Total Tasks</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{pendingTasks.length}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Lists */}
        <div className="space-y-8">
          {/* Pending Tasks */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CircleIcon className="h-5 w-5 text-orange-500" />
              <h2 className="text-xl font-semibold text-gray-900">Pending Tasks</h2>
              <Badge variant="secondary">{pendingTasks.length}</Badge>
            </div>
            
            {pendingTasks.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500 py-8">No pending tasks. Great job!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((task: Task) => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleTask(task)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 mb-1">{task.title}</h3>
                          {task.description && (
                            <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                          )}
                          <p className="text-xs text-gray-400">
                            Created: {task.created_at.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTask(task)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{task.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTask(task.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Completed Tasks */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900">Completed Tasks</h2>
              <Badge variant="secondary">{completedTasks.length}</Badge>
            </div>
            
            {completedTasks.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500 py-8">No completed tasks yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {completedTasks.map((task: Task) => (
                  <Card key={task.id} className="opacity-75 hover:opacity-100 transition-opacity">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleTask(task)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 mb-1 line-through">{task.title}</h3>
                          {task.description && (
                            <p className="text-gray-600 text-sm mb-2 line-through">{task.description}</p>
                          )}
                          <p className="text-xs text-gray-400">
                            Completed: {task.updated_at.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTask(task)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{task.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTask(task.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit Task Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <Input
                placeholder="Task title"
                value={editTaskData.title || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditTaskData((prev: UpdateTaskInput) => ({ ...prev, title: e.target.value }))
                }
                required
              />
              <Textarea
                placeholder="Task description (optional)"
                value={editTaskData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditTaskData((prev: UpdateTaskInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
