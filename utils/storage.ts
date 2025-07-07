import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutTemplate, WorkoutPlan, WorkoutSession, Client, Exercise } from '../types/workout';

const STORAGE_KEYS = {
  TEMPLATES: '@workout_templates',
  PLANS: '@workout_plans',
  SESSIONS: '@workout_sessions',
  CLIENTS: '@clients',
  EXERCISES: '@exercises',
  PENDING_SYNC: '@pending_sync',
  USER_ROLE: '@user_role',
  USER_ID: '@user_id',
};

// Generic storage functions
export const storeData = async (key: string, data: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error storing data:', error);
    throw error;
  }
};

export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting data:', error);
    return null;
  }
};

export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing data:', error);
    throw error;
  }
};

// Template functions
export const saveTemplate = async (template: WorkoutTemplate): Promise<void> => {
  const templates = await getTemplates();
  const updatedTemplates = templates.filter(t => t.id !== template.id);
  updatedTemplates.push(template);
  await storeData(STORAGE_KEYS.TEMPLATES, updatedTemplates);
  await addToPendingSync('template', template.id, 'create');
};

export const getTemplates = async (): Promise<WorkoutTemplate[]> => {
  return await getData<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES) || [];
};

export const getTemplate = async (id: string): Promise<WorkoutTemplate | null> => {
  const templates = await getTemplates();
  return templates.find(t => t.id === id) || null;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  const templates = await getTemplates();
  const updatedTemplates = templates.filter(t => t.id !== id);
  await storeData(STORAGE_KEYS.TEMPLATES, updatedTemplates);
  await addToPendingSync('template', id, 'delete');
};

// Plan functions
export const savePlan = async (plan: WorkoutPlan): Promise<void> => {
  const plans = await getPlans();
  const updatedPlans = plans.filter(p => p.id !== plan.id);
  updatedPlans.push(plan);
  await storeData(STORAGE_KEYS.PLANS, updatedPlans);
  await addToPendingSync('plan', plan.id, 'create');
};

export const getPlans = async (): Promise<WorkoutPlan[]> => {
  return await getData<WorkoutPlan[]>(STORAGE_KEYS.PLANS) || [];
};

export const getPlan = async (id: string): Promise<WorkoutPlan | null> => {
  const plans = await getPlans();
  return plans.find(p => p.id === id) || null;
};

export const getClientPlans = async (clientId: string): Promise<WorkoutPlan[]> => {
  const plans = await getPlans();
  return plans.filter(p => p.clientId === clientId);
};

// Session functions
export const saveSession = async (session: WorkoutSession): Promise<void> => {
  const sessions = await getSessions();
  const updatedSessions = sessions.filter(s => s.id !== session.id);
  updatedSessions.push(session);
  await storeData(STORAGE_KEYS.SESSIONS, updatedSessions);
  await addToPendingSync('session', session.id, 'create');
};

export const getSessions = async (): Promise<WorkoutSession[]> => {
  return await getData<WorkoutSession[]>(STORAGE_KEYS.SESSIONS) || [];
};

export const getSession = async (id: string): Promise<WorkoutSession | null> => {
  const sessions = await getSessions();
  return sessions.find(s => s.id === id) || null;
};

export const getClientSessions = async (clientId: string): Promise<WorkoutSession[]> => {
  const sessions = await getSessions();
  return sessions.filter(s => s.clientId === clientId);
};

// Client functions
export const saveClient = async (client: Client): Promise<void> => {
  const clients = await getClients();
  const updatedClients = clients.filter(c => c.id !== client.id);
  updatedClients.push(client);
  await storeData(STORAGE_KEYS.CLIENTS, updatedClients);
  await addToPendingSync('client', client.id, 'create');
};

export const getClients = async (): Promise<Client[]> => {
  return await getData<Client[]>(STORAGE_KEYS.CLIENTS) || [];
};

export const getClient = async (id: string): Promise<Client | null> => {
  const clients = await getClients();
  return clients.find(c => c.id === id) || null;
};

// Exercise functions
export const getExercises = async (): Promise<Exercise[]> => {
  return await getData<Exercise[]>(STORAGE_KEYS.EXERCISES) || [];
};

export const saveExercises = async (exercises: Exercise[]): Promise<void> => {
  await storeData(STORAGE_KEYS.EXERCISES, exercises);
};

// Sync functions
export const addToPendingSync = async (type: string, id: string, action: 'create' | 'update' | 'delete'): Promise<void> => {
  const pendingSync = await getData<any[]>(STORAGE_KEYS.PENDING_SYNC) || [];
  const syncItem = {
    type,
    id,
    action,
    timestamp: new Date().toISOString(),
  };
  
  // Remove existing sync item for the same type and id
  const updatedSync = pendingSync.filter(item => !(item.type === type && item.id === id));
  updatedSync.push(syncItem);
  
  await storeData(STORAGE_KEYS.PENDING_SYNC, updatedSync);
};

export const getPendingSync = async (): Promise<any[]> => {
  return await getData<any[]>(STORAGE_KEYS.PENDING_SYNC) || [];
};

export const clearPendingSync = async (): Promise<void> => {
  await storeData(STORAGE_KEYS.PENDING_SYNC, []);
};

export const removeSyncItem = async (type: string, id: string): Promise<void> => {
  const pendingSync = await getPendingSync();
  const updatedSync = pendingSync.filter(item => !(item.type === type && item.id === id));
  await storeData(STORAGE_KEYS.PENDING_SYNC, updatedSync);
};

// Initialize default data
export const initializeDefaultData = async (): Promise<void> => {
  const exercises = await getExercises();
  if (exercises.length === 0) {
    const defaultExercises: Exercise[] = [
      {
        id: '1',
        name: 'Push-ups',
        category: 'Bodyweight',
        muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
        instructions: 'Start in plank position, lower body to ground, push back up',
        equipment: 'None'
      },
      {
        id: '2',
        name: 'Squats',
        category: 'Bodyweight',
        muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
        instructions: 'Stand with feet shoulder-width apart, lower hips back and down',
        equipment: 'None'
      },
      {
        id: '3',
        name: 'Bench Press',
        category: 'Strength',
        muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
        instructions: 'Lie on bench, lower bar to chest, press up',
        equipment: 'Barbell, Bench'
      },
      {
        id: '4',
        name: 'Deadlift',
        category: 'Strength',
        muscleGroups: ['Hamstrings', 'Glutes', 'Back'],
        instructions: 'Stand with feet hip-width apart, lift bar from ground',
        equipment: 'Barbell'
      },
      {
        id: '5',
        name: 'Pull-ups',
        category: 'Bodyweight',
        muscleGroups: ['Back', 'Biceps'],
        instructions: 'Hang from bar, pull body up until chin over bar',
        equipment: 'Pull-up bar'
      }
    ];
    await saveExercises(defaultExercises);
  }

  // Initialize default workout templates
  const templates = await getTemplates();
  if (templates.length === 0) {
    const defaultTemplates: WorkoutTemplate[] = [
      {
        id: 'template-1',
        name: 'Upper Body Strength',
        description: 'Focus on building upper body strength with compound movements',
        category: 'Strength',
        duration: 60,
        exercises: [
          {
            id: 'ex-1',
            exerciseId: '3',
            exercise: {
              id: '3',
              name: 'Bench Press',
              category: 'Strength',
              muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
              instructions: 'Lie on bench, lower bar to chest, press up',
              equipment: 'Barbell, Bench'
            },
            sets: [
              { reps: 8, weight: 135, restTime: 120 },
              { reps: 8, weight: 135, restTime: 120 },
              { reps: 8, weight: 135, restTime: 120 }
            ],
            order: 1,
            notes: 'Focus on controlled movement'
          },
          {
            id: 'ex-2',
            exerciseId: '5',
            exercise: {
              id: '5',
              name: 'Pull-ups',
              category: 'Bodyweight',
              muscleGroups: ['Back', 'Biceps'],
              instructions: 'Hang from bar, pull body up until chin over bar',
              equipment: 'Pull-up bar'
            },
            sets: [
              { reps: 8, restTime: 90 },
              { reps: 8, restTime: 90 },
              { reps: 8, restTime: 90 }
            ],
            order: 2,
            notes: 'Use assistance if needed'
          }
        ],
        createdBy: 'trainer-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: true
      },
      {
        id: 'template-2',
        name: 'Lower Body Power',
        description: 'Build explosive lower body strength and power',
        category: 'Strength',
        duration: 45,
        exercises: [
          {
            id: 'ex-3',
            exerciseId: '2',
            exercise: {
              id: '2',
              name: 'Squats',
              category: 'Bodyweight',
              muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
              instructions: 'Stand with feet shoulder-width apart, lower hips back and down',
              equipment: 'None'
            },
            sets: [
              { reps: 12, weight: 185, restTime: 120 },
              { reps: 10, weight: 205, restTime: 120 },
              { reps: 8, weight: 225, restTime: 120 }
            ],
            order: 1,
            notes: 'Progressive overload'
          },
          {
            id: 'ex-4',
            exerciseId: '4',
            exercise: {
              id: '4',
              name: 'Deadlift',
              category: 'Strength',
              muscleGroups: ['Hamstrings', 'Glutes', 'Back'],
              instructions: 'Stand with feet hip-width apart, lift bar from ground',
              equipment: 'Barbell'
            },
            sets: [
              { reps: 5, weight: 275, restTime: 180 },
              { reps: 5, weight: 275, restTime: 180 },
              { reps: 5, weight: 275, restTime: 180 }
            ],
            order: 2,
            notes: 'Focus on form over weight'
          }
        ],
        createdBy: 'trainer-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: true
      },
      {
        id: 'template-3',
        name: 'HIIT Cardio Blast',
        description: 'High-intensity interval training for cardiovascular fitness',
        category: 'Cardio',
        duration: 30,
        exercises: [
          {
            id: 'ex-5',
            exerciseId: '1',
            exercise: {
              id: '1',
              name: 'Push-ups',
              category: 'Bodyweight',
              muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
              instructions: 'Start in plank position, lower body to ground, push back up',
              equipment: 'None'
            },
            sets: [
              { reps: 15, restTime: 30 },
              { reps: 15, restTime: 30 },
              { reps: 15, restTime: 30 },
              { reps: 15, restTime: 30 }
            ],
            order: 1,
            notes: 'High intensity, short rest'
          },
          {
            id: 'ex-6',
            exerciseId: '2',
            exercise: {
              id: '2',
              name: 'Squats',
              category: 'Bodyweight',
              muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
              instructions: 'Stand with feet shoulder-width apart, lower hips back and down',
              equipment: 'None'
            },
            sets: [
              { reps: 20, restTime: 30 },
              { reps: 20, restTime: 30 },
              { reps: 20, restTime: 30 },
              { reps: 20, restTime: 30 }
            ],
            order: 2,
            notes: 'Explosive movement'
          }
        ],
        createdBy: 'trainer-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: true
      },
      {
        id: 'template-4',
        name: 'Full Body Functional',
        description: 'Functional movements for everyday strength',
        category: 'Functional',
        duration: 50,
        exercises: [
          {
            id: 'ex-7',
            exerciseId: '1',
            exercise: {
              id: '1',
              name: 'Push-ups',
              category: 'Bodyweight',
              muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
              instructions: 'Start in plank position, lower body to ground, push back up',
              equipment: 'None'
            },
            sets: [
              { reps: 12, restTime: 60 },
              { reps: 12, restTime: 60 },
              { reps: 12, restTime: 60 }
            ],
            order: 1,
            notes: 'Maintain proper form'
          },
          {
            id: 'ex-8',
            exerciseId: '2',
            exercise: {
              id: '2',
              name: 'Squats',
              category: 'Bodyweight',
              muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
              instructions: 'Stand with feet shoulder-width apart, lower hips back and down',
              equipment: 'None'
            },
            sets: [
              { reps: 15, restTime: 60 },
              { reps: 15, restTime: 60 },
              { reps: 15, restTime: 60 }
            ],
            order: 2,
            notes: 'Full range of motion'
          },
          {
            id: 'ex-9',
            exerciseId: '5',
            exercise: {
              id: '5',
              name: 'Pull-ups',
              category: 'Bodyweight',
              muscleGroups: ['Back', 'Biceps'],
              instructions: 'Hang from bar, pull body up until chin over bar',
              equipment: 'Pull-up bar'
            },
            sets: [
              { reps: 6, restTime: 90 },
              { reps: 6, restTime: 90 },
              { reps: 6, restTime: 90 }
            ],
            order: 3,
            notes: 'Assisted if necessary'
          }
        ],
        createdBy: 'trainer-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: true
      }
    ];
    await storeData(STORAGE_KEYS.TEMPLATES, defaultTemplates);
  }

  // Initialize sample clients for trainers
  const clients = await getClients();
  if (clients.length === 0) {
    const defaultClients: Client[] = [
      {
        id: 'client-1',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        avatar: '👩‍💼',
        joinDate: '2024-01-15',
        trainerId: 'trainer-1'
      },
      {
        id: 'client-2',
        name: 'Mike Chen',
        email: 'mike@example.com',
        avatar: '👨‍💻',
        joinDate: '2024-02-01',
        trainerId: 'trainer-1'
      },
      {
        id: 'client-3',
        name: 'Emma Wilson',
        email: 'emma@example.com',
        avatar: '👩‍🎨',
        joinDate: '2024-01-20',
        trainerId: 'trainer-1'
      }
    ];
    await storeData(STORAGE_KEYS.CLIENTS, defaultClients);
  }
};