import { supabase } from './supabase';
import { WorkoutTemplate, Exercise, TemplateExercise } from '@/types/workout';

// Get all workout templates with their exercises
export const getWorkoutTemplates = async (): Promise<WorkoutTemplate[]> => {
  try {
    const { data: templates, error: templatesError } = await supabase
      .from('workout_templates')
      .select(`
        *,
        template_exercises (
          id,
          exercise_id,
          order_index,
          sets_config,
          notes,
          created_at,
          exercises (
            id,
            name,
            category,
            muscle_groups,
            instructions,
            equipment,
            created_by,
            is_public,
            created_at,
            updated_at
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (templatesError) {
      console.error('Error fetching workout templates:', templatesError);
      return [];
    }

    // Transform the data to match our WorkoutTemplate interface
    const transformedTemplates: WorkoutTemplate[] = (templates || []).map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      estimated_duration_minutes: template.estimated_duration_minutes,
      created_by: template.created_by,
      is_public: template.is_public,
      created_at: template.created_at,
      updated_at: template.updated_at,
      exercises: (template.template_exercises || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((te: any) => ({
          id: te.id,
          template_id: template.id,
          exercise_id: te.exercise_id,
          exercise: te.exercises,
          order_index: te.order_index,
          sets_config: te.sets_config || [],
          notes: te.notes,
          created_at: te.created_at,
        }))
    }));

    return transformedTemplates;
  } catch (error) {
    console.error('Error in getWorkoutTemplates:', error);
    return [];
  }
};

// Get a specific workout template by ID
export const getWorkoutTemplate = async (id: string): Promise<WorkoutTemplate | null> => {
  try {
    const { data: template, error } = await supabase
      .from('workout_templates')
      .select(`
        *,
        template_exercises (
          id,
          exercise_id,
          order_index,
          sets_config,
          notes,
          created_at,
          exercises (
            id,
            name,
            category,
            muscle_groups,
            instructions,
            equipment,
            created_by,
            is_public,
            created_at,
            updated_at
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching workout template:', error);
      return null;
    }

    if (!template) return null;

    // Transform the data to match our WorkoutTemplate interface
    const transformedTemplate: WorkoutTemplate = {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      estimated_duration_minutes: template.estimated_duration_minutes,
      created_by: template.created_by,
      is_public: template.is_public,
      created_at: template.created_at,
      updated_at: template.updated_at,
      exercises: (template.template_exercises || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((te: any) => ({
          id: te.id,
          template_id: template.id,
          exercise_id: te.exercise_id,
          exercise: te.exercises,
          order_index: te.order_index,
          sets_config: te.sets_config || [],
          notes: te.notes,
          created_at: te.created_at,
        }))
    };

    return transformedTemplate;
  } catch (error) {
    console.error('Error in getWorkoutTemplate:', error);
    return null;
  }
};

// Get all exercises
export const getExercises = async (): Promise<Exercise[]> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching exercises:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getExercises:', error);
    return [];
  }
};

// Create a new exercise
export const createExercise = async (exercise: Omit<Exercise, 'id' | 'created_at' | 'updated_at'>): Promise<Exercise | null> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .insert(exercise)
      .select()
      .single();

    if (error) {
      console.error('Error creating exercise:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createExercise:', error);
    return null;
  }
};

// Create a new workout template
export const createWorkoutTemplate = async (
  template: Omit<WorkoutTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<WorkoutTemplate | null> => {
  try {
    // Start a transaction by creating the template first
    const { data: newTemplate, error: templateError } = await supabase
      .from('workout_templates')
      .insert({
        name: template.name,
        description: template.description,
        category: template.category,
        estimated_duration_minutes: template.estimated_duration_minutes,
        created_by: template.created_by,
        is_public: template.is_public,
      })
      .select()
      .single();

    if (templateError) {
      console.error('Error creating workout template:', templateError);
      return null;
    }

    // Create template exercises
    if (template.exercises && template.exercises.length > 0) {
      const templateExercises = template.exercises.map((exercise, index) => ({
        template_id: newTemplate.id,
        exercise_id: exercise.exercise_id,
        order_index: exercise.order_index || index,
        sets_config: exercise.sets_config,
        notes: exercise.notes,
      }));

      const { error: exercisesError } = await supabase
        .from('template_exercises')
        .insert(templateExercises);

      if (exercisesError) {
        console.error('Error creating template exercises:', exercisesError);
        // Clean up the template if exercises failed
        await supabase.from('workout_templates').delete().eq('id', newTemplate.id);
        return null;
      }
    }

    // Fetch the complete template with exercises
    return await getWorkoutTemplate(newTemplate.id);
  } catch (error) {
    console.error('Error in createWorkoutTemplate:', error);
    return null;
  }
};

// Update a workout template
export const updateWorkoutTemplate = async (
  id: string,
  updates: Partial<WorkoutTemplate>
): Promise<WorkoutTemplate | null> => {
  try {
    // Update the template
    const { error: templateError } = await supabase
      .from('workout_templates')
      .update({
        name: updates.name,
        description: updates.description,
        category: updates.category,
        estimated_duration_minutes: updates.estimated_duration_minutes,
        is_public: updates.is_public,
      })
      .eq('id', id);

    if (templateError) {
      console.error('Error updating workout template:', templateError);
      return null;
    }

    // If exercises are being updated, replace them
    if (updates.exercises) {
      // Delete existing template exercises
      await supabase
        .from('template_exercises')
        .delete()
        .eq('template_id', id);

      // Insert new template exercises
      if (updates.exercises.length > 0) {
        const templateExercises = updates.exercises.map((exercise, index) => ({
          template_id: id,
          exercise_id: exercise.exercise_id,
          order_index: exercise.order_index || index,
          sets_config: exercise.sets_config,
          notes: exercise.notes,
        }));

        const { error: exercisesError } = await supabase
          .from('template_exercises')
          .insert(templateExercises);

        if (exercisesError) {
          console.error('Error updating template exercises:', exercisesError);
          return null;
        }
      }
    }

    // Fetch the updated template
    return await getWorkoutTemplate(id);
  } catch (error) {
    console.error('Error in updateWorkoutTemplate:', error);
    return null;
  }
};

// Delete a workout template
export const deleteWorkoutTemplate = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting workout template:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteWorkoutTemplate:', error);
    return false;
  }
};

// Initialize default templates (this will be called once to set up the system)
export const initializeDefaultTemplates = async (): Promise<void> => {
  try {
    // Check if templates already exist
    const { data: existingTemplates } = await supabase
      .from('workout_templates')
      .select('id')
      .limit(1);

    if (existingTemplates && existingTemplates.length > 0) {
      console.log('Workout templates already exist');
      return;
    }

    // Get current user profile to use as creator
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      console.log('No profile found for user');
      return;
    }

    // Get available exercises
    const exercises = await getExercises();
    if (exercises.length === 0) {
      console.log('No exercises available to create templates');
      return;
    }

    // Create default templates using available exercises
    const pushUpExercise = exercises.find(e => e.name.toLowerCase().includes('push'));
    const squatExercise = exercises.find(e => e.name.toLowerCase().includes('squat'));
    const pullUpExercise = exercises.find(e => e.name.toLowerCase().includes('pull'));
    const plankExercise = exercises.find(e => e.name.toLowerCase().includes('plank'));

    if (pushUpExercise && squatExercise) {
      const defaultTemplate = {
        name: 'Beginner Full Body',
        description: 'A complete full body workout for beginners',
        category: 'Full Body',
        estimated_duration_minutes: 45,
        created_by: profile.id,
        is_public: true,
        exercises: [
          {
            exercise_id: pushUpExercise.id,
            exercise: pushUpExercise,
            order_index: 0,
            sets_config: [
              { reps: 10, rest_time: 60 },
              { reps: 10, rest_time: 60 },
              { reps: 10, rest_time: 60 }
            ],
            notes: 'Start with knee push-ups if needed'
          },
          {
            exercise_id: squatExercise.id,
            exercise: squatExercise,
            order_index: 1,
            sets_config: [
              { reps: 15, rest_time: 60 },
              { reps: 15, rest_time: 60 },
              { reps: 15, rest_time: 60 }
            ],
            notes: 'Focus on proper form'
          }
        ]
      };

      if (pullUpExercise) {
        defaultTemplate.exercises.push({
          exercise_id: pullUpExercise.id,
          exercise: pullUpExercise,
          order_index: 2,
          sets_config: [
            { reps: 5, rest_time: 90 },
            { reps: 5, rest_time: 90 },
            { reps: 5, rest_time: 90 }
          ],
          notes: 'Use assistance if needed'
        });
      }

      if (plankExercise) {
        defaultTemplate.exercises.push({
          exercise_id: plankExercise.id,
          exercise: plankExercise,
          order_index: 3,
          sets_config: [
            { duration: 30, rest_time: 60 },
            { duration: 30, rest_time: 60 },
            { duration: 30, rest_time: 60 }
          ],
          notes: 'Hold for specified duration'
        });
      }

      await createWorkoutTemplate(defaultTemplate);
      console.log('Default workout template created successfully');
    }
  } catch (error) {
    console.error('Error initializing default templates:', error);
  }
};