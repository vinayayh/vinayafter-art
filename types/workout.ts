export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  instructions?: string;
  equipment?: string;
}

export interface WorkoutSet {
  id: string;
  reps?: number;
  weight?: number;
  duration?: number; // in seconds
  distance?: number; // in meters
  restTime?: number; // in seconds
  completed?: boolean;
  notes?: string;
}

export interface TemplateExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: Omit<WorkoutSet, 'completed' | 'id'>[];
  order: number;
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  duration: number; // estimated duration in minutes
  exercises: TemplateExercise[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
}

export interface WorkoutPlan {
  id: string;
  clientId: string;
  trainerId: string;
  name: string;
  startDate: string;
  endDate: string;
  schedule: {
    [key: string]: string | null; // day of week -> templateId
  };
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSession {
  id: string;
  clientId: string;
  templateId: string;
  planId?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  exercises: {
    exerciseId: string;
    sets: WorkoutSet[];
    notes?: string;
  }[];
  notes?: string;
  completed: boolean;
  synced: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinDate: string;
  trainerId?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';