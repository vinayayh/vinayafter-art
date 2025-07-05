import { supabase } from './supabase';

export interface TrainerDashboardStats {
  trainer_id: string;
  trainer_name: string;
  total_clients: number;
  active_clients: number;
  today_sessions: number;
  completed_today: number;
  pending_today: number;
  unread_notifications: number;
  avg_session_rating: number;
}

export interface TrainerNotification {
  id: string;
  trainer_id: string;
  type: 'session_reminder' | 'client_milestone' | 'session_cancelled' | 'new_client' | 'payment_due' | 'system_alert';
  title: string;
  message: string;
  data: any;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_for?: string;
  created_at: string;
  expires_at?: string;
}

export interface ClientWithProgress {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  fitness_goals?: string[];
  last_active: string;
  assignment_status: string;
  last_session?: {
    date: string;
    type: string;
    status: string;
    rating?: number;
  };
  upcoming_session?: {
    date: string;
    time: string;
    type: string;
    location?: string;
  };
  progress_metrics?: {
    weight?: number;
    body_fat?: number;
    strength_improvement?: number;
  };
}

export interface EnhancedTrainingSession {
  id: string;
  client_id: string;
  trainer_id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  location?: string;
  notes?: string;
  trainer_notes?: string;
  client_feedback?: string;
  session_rating?: number;
  exercises_completed?: any[];
  created_at: string;
  updated_at: string;
  client: {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
  };
  reminders?: {
    id: string;
    reminder_type: string;
    sent: boolean;
    scheduled_for: string;
  }[];
}

// Get current trainer profile
export const getCurrentTrainerProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'trainer')
      .single();

    if (error) {
      console.error('Error fetching trainer profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCurrentTrainerProfile:', error);
    return null;
  }
};

// Get trainer dashboard statistics
export const getTrainerDashboardStats = async (): Promise<TrainerDashboardStats | null> => {
  try {
    const profile = await getCurrentTrainerProfile();
    if (!profile) return null;

    const { data, error } = await supabase
      .from('trainer_dashboard_stats')
      .select('*')
      .eq('trainer_id', profile.id)
      .single();

    if (error) {
      console.error('Error fetching trainer dashboard stats:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getTrainerDashboardStats:', error);
    return null;
  }
};

// Get trainer's active clients with progress
export const getTrainerActiveClients = async (): Promise<ClientWithProgress[]> => {
  try {
    const profile = await getCurrentTrainerProfile();
    if (!profile) return [];

    const { data, error } = await supabase
      .from('client_assignments')
      .select(`
        client:profiles!client_assignments_client_id_fkey(
          id,
          full_name,
          email,
          phone_number,
          fitness_goals,
          last_active
        ),
        status,
        assigned_date
      `)
      .eq('trainer_id', profile.id)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching trainer clients:', error);
      return [];
    }

    // Enhance with session and progress data
    const enhancedClients = await Promise.all(
      (data || []).map(async (assignment) => {
        const client = assignment.client;
        if (!client) return null;

        // Get last session
        const { data: lastSession } = await supabase
          .from('training_sessions')
          .select('scheduled_date, type, status, session_rating')
          .eq('client_id', client.id)
          .eq('trainer_id', profile.id)
          .order('scheduled_date', { ascending: false })
          .limit(1)
          .single();

        // Get upcoming session
        const { data: upcomingSession } = await supabase
          .from('training_sessions')
          .select('scheduled_date, scheduled_time, type, location')
          .eq('client_id', client.id)
          .eq('trainer_id', profile.id)
          .eq('status', 'scheduled')
          .gte('scheduled_date', new Date().toISOString().split('T')[0])
          .order('scheduled_date', { ascending: true })
          .limit(1)
          .single();

        // Get latest progress metrics
        const { data: progressData } = await supabase
          .from('client_progress_tracking')
          .select('metric_type, value, unit, recorded_date')
          .eq('client_id', client.id)
          .eq('trainer_id', profile.id)
          .order('recorded_date', { ascending: false });

        const progressMetrics: any = {};
        progressData?.forEach(metric => {
          progressMetrics[metric.metric_type] = metric.value;
        });

        return {
          ...client,
          assignment_status: assignment.status,
          last_session: lastSession ? {
            date: lastSession.scheduled_date,
            type: lastSession.type,
            status: lastSession.status,
            rating: lastSession.session_rating
          } : undefined,
          upcoming_session: upcomingSession ? {
            date: upcomingSession.scheduled_date,
            time: upcomingSession.scheduled_time,
            type: upcomingSession.type,
            location: upcomingSession.location
          } : undefined,
          progress_metrics: progressMetrics
        };
      })
    );

    return enhancedClients.filter(Boolean) as ClientWithProgress[];
  } catch (error) {
    console.error('Error in getTrainerActiveClients:', error);
    return [];
  }
};

// Get today's training sessions with enhanced data
export const getTodayTrainingSessions = async (): Promise<EnhancedTrainingSession[]> => {
  try {
    const profile = await getCurrentTrainerProfile();
    if (!profile) return [];

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('training_sessions')
      .select(`
        *,
        client:profiles!training_sessions_client_id_fkey(
          id,
          full_name,
          email,
          phone_number
        )
      `)
      .eq('trainer_id', profile.id)
      .eq('scheduled_date', today)
      .order('scheduled_time', { ascending: true });

    if (error) {
      console.error('Error fetching today training sessions:', error);
      return [];
    }

    // Enhance with reminder data
    const enhancedSessions = await Promise.all(
      (data || []).map(async (session) => {
        const { data: reminders } = await supabase
          .from('session_reminders')
          .select('id, reminder_type, sent, scheduled_for')
          .eq('session_id', session.id);

        return {
          ...session,
          reminders: reminders || []
        };
      })
    );

    return enhancedSessions;
  } catch (error) {
    console.error('Error in getTodayTrainingSessions:', error);
    return [];
  }
};

// Get upcoming training sessions (next 7 days)
export const getUpcomingTrainingSessions = async (): Promise<EnhancedTrainingSession[]> => {
  try {
    const profile = await getCurrentTrainerProfile();
    if (!profile) return [];

    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('training_sessions')
      .select(`
        *,
        client:profiles!training_sessions_client_id_fkey(
          id,
          full_name,
          email,
          phone_number
        )
      `)
      .eq('trainer_id', profile.id)
      .eq('status', 'scheduled')
      .gte('scheduled_date', today)
      .lte('scheduled_date', nextWeekStr)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });

    if (error) {
      console.error('Error fetching upcoming training sessions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUpcomingTrainingSessions:', error);
    return [];
  }
};

// Get trainer notifications
export const getTrainerNotifications = async (limit: number = 10): Promise<TrainerNotification[]> => {
  try {
    const profile = await getCurrentTrainerProfile();
    if (!profile) return [];

    const { data, error } = await supabase
      .from('trainer_notifications')
      .select('*')
      .eq('trainer_id', profile.id)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching trainer notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTrainerNotifications:', error);
    return [];
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('trainer_notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    return false;
  }
};

// Create a new training session
export const createTrainingSession = async (sessionData: {
  client_id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  type: string;
  location?: string;
  notes?: string;
}): Promise<EnhancedTrainingSession | null> => {
  try {
    const profile = await getCurrentTrainerProfile();
    if (!profile) return null;

    const { data, error } = await supabase
      .from('training_sessions')
      .insert({
        trainer_id: profile.id,
        ...sessionData,
        status: 'scheduled'
      })
      .select(`
        *,
        client:profiles!training_sessions_client_id_fkey(
          id,
          full_name,
          email,
          phone_number
        )
      `)
      .single();

    if (error) {
      console.error('Error creating training session:', error);
      return null;
    }

    // Create notification for new session
    await supabase.rpc('create_trainer_notification', {
      p_trainer_id: profile.id,
      p_type: 'session_reminder',
      p_title: 'New Session Scheduled',
      p_message: `Session with ${data.client?.full_name} scheduled for ${sessionData.scheduled_date} at ${sessionData.scheduled_time}`,
      p_data: { session_id: data.id, client_id: sessionData.client_id }
    });

    return data;
  } catch (error) {
    console.error('Error in createTrainingSession:', error);
    return null;
  }
};

// Update training session
export const updateTrainingSession = async (
  sessionId: string,
  updates: Partial<EnhancedTrainingSession>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('training_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating training session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateTrainingSession:', error);
    return false;
  }
};

// Complete training session with feedback
export const completeTrainingSession = async (
  sessionId: string,
  data: {
    trainer_notes?: string;
    exercises_completed?: any[];
    session_rating?: number;
  }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('training_sessions')
      .update({
        status: 'completed',
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error completing training session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in completeTrainingSession:', error);
    return false;
  }
};

// Record client progress
export const recordClientProgress = async (
  clientId: string,
  metrics: {
    metric_type: 'weight' | 'body_fat' | 'muscle_mass' | 'strength' | 'endurance' | 'flexibility';
    value: number;
    unit: string;
    notes?: string;
  }[]
): Promise<boolean> => {
  try {
    const profile = await getCurrentTrainerProfile();
    if (!profile) return false;

    const progressEntries = metrics.map(metric => ({
      client_id: clientId,
      trainer_id: profile.id,
      ...metric,
      recorded_date: new Date().toISOString().split('T')[0]
    }));

    const { error } = await supabase
      .from('client_progress_tracking')
      .insert(progressEntries);

    if (error) {
      console.error('Error recording client progress:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in recordClientProgress:', error);
    return false;
  }
};

// Get client progress history
export const getClientProgressHistory = async (
  clientId: string,
  metricType?: string,
  days: number = 30
): Promise<any[]> => {
  try {
    const profile = await getCurrentTrainerProfile();
    if (!profile) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('client_progress_tracking')
      .select('*')
      .eq('client_id', clientId)
      .eq('trainer_id', profile.id)
      .gte('recorded_date', startDate.toISOString().split('T')[0])
      .order('recorded_date', { ascending: false });

    if (metricType) {
      query = query.eq('metric_type', metricType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching client progress history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getClientProgressHistory:', error);
    return [];
  }
};