import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { useCreateTask } from '../../hooks/useTasks';
import type { TaskPriority, TaskStatus } from '../../types';

const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(255, 'Task title cannot exceed 255 characters'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  onSuccess?: () => void;
}

export function TaskModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  onSuccess,
}: TaskModalProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const createTaskMutation = useCreateTask(projectId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: '',
      });
      setErrorMsg(null);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: TaskFormData) => {
    const trimmedTitle = data.title.trim();
    if (!trimmedTitle) {
      setErrorMsg('Task title cannot be empty.');
      return;
    }

    setErrorMsg(null);

    let parsedDueDate: string | null = null;
    if (data.dueDate && data.dueDate.trim() !== '') {
      try {
        parsedDueDate = new Date(`${data.dueDate}T23:59:59.000Z`).toISOString();
      } catch {
        parsedDueDate = null;
      }
    }

    try {
      await createTaskMutation.mutateAsync({
        title: trimmedTitle,
        description: data.description?.trim() || undefined,
        status: data.status as TaskStatus,
        priority: data.priority as TaskPriority,
        dueDate: parsedDueDate,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An error occurred while creating the task.');
      }
    }
  };

  const statusOptions = [
    { label: 'To Do', value: 'TODO' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  const priorityOptions = [
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Urgent', value: 'URGENT' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Task"
      description={
        projectName
          ? `Create a new task for ${projectName}`
          : 'Create a new task for this project'
      }
      className="max-w-md"
    >
      {errorMsg && (
        <div className="mb-4">
          <Alert variant="error">{errorMsg}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Task Title *"
          placeholder="e.g. Implement authentication flow"
          error={errors.title?.message}
          {...register('title')}
        />

        <Textarea
          label="Description (Optional)"
          placeholder="Provide context, acceptance criteria or details..."
          rows={3}
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Status"
            options={statusOptions}
            error={errors.status?.message}
            {...register('status')}
          />

          <Select
            label="Priority"
            options={priorityOptions}
            error={errors.priority?.message}
            {...register('priority')}
          />
        </div>

        <Input
          label="Due Date (Optional)"
          type="date"
          error={errors.dueDate?.message}
          {...register('dueDate')}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={createTaskMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createTaskMutation.isPending}
            disabled={createTaskMutation.isPending}
          >
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
