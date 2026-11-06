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
import { useCreateProject, useUpdateProject } from '../../hooks/useProjects';
import type { Project, ProjectStatus } from '../../types';

const projectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(150, 'Project name cannot exceed 150 characters'),
  description: z.string().optional(),
  repositoryUrl: z
    .string()
    .url('Please enter a valid URL')
    .max(500, 'Repository URL cannot exceed 500 characters')
    .or(z.literal(''))
    .optional(),
  techStack: z
    .string()
    .max(500, 'Tech stack cannot exceed 500 characters')
    .optional(),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: Project | null;
}

export function ProjectModal({ isOpen, onClose, projectToEdit }: ProjectModalProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isEditing = !!projectToEdit;

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      repositoryUrl: '',
      techStack: '',
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (projectToEdit) {
      reset({
        name: projectToEdit.name,
        description: projectToEdit.description || '',
        repositoryUrl: projectToEdit.repositoryUrl || '',
        techStack: projectToEdit.techStack || '',
        status: projectToEdit.status,
      });
    } else {
      reset({
        name: '',
        description: '',
        repositoryUrl: '',
        techStack: '',
        status: 'ACTIVE',
      });
    }
    setErrorMsg(null);
  }, [projectToEdit, reset, isOpen]);

  const onSubmit = async (data: ProjectFormData) => {
    setErrorMsg(null);
    try {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        repositoryUrl: data.repositoryUrl || undefined,
        techStack: data.techStack || undefined,
        status: data.status as ProjectStatus,
      };

      if (isEditing && projectToEdit) {
        await updateMutation.mutateAsync({ id: projectToEdit.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An error occurred while saving the project.');
      }
    }
  };

  const statusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'On Hold', value: 'ON_HOLD' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Archived', value: 'ARCHIVED' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Project' : 'Create New Project'}
      description={
        isEditing
          ? 'Update the project details and metadata'
          : 'Define a new project repository or workspace to track'
      }
    >
      {errorMsg && (
        <div className="mb-4">
          <Alert variant="error">{errorMsg}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Project Name *"
          placeholder="e.g. devpulse-web-client"
          error={errors.name?.message}
          {...register('name')}
        />

        <Textarea
          label="Description"
          placeholder="What is this project about?"
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Repository URL"
            placeholder="https://github.com/..."
            error={errors.repositoryUrl?.message}
            {...register('repositoryUrl')}
          />

          <Select
            label="Project Status"
            options={statusOptions}
            error={errors.status?.message}
            {...register('status')}
          />
        </div>

        <Input
          label="Tech Stack"
          placeholder="e.g. React, TypeScript, Spring Boot, MySQL"
          helperText="Comma-separated technologies or libraries"
          error={errors.techStack?.message}
          {...register('techStack')}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={isSubmitting || createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

