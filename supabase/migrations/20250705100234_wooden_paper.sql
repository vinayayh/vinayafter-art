/*
  # Sample Enhanced Trainer Data

  1. Sample Data
    - Enhanced trainer and client profiles with detailed information
    - Training sessions with comprehensive tracking
    - Session notifications with various types
    - Client activity logs with different activity types
    - Trainer dashboard stats with performance metrics

  2. Notes
    - This provides realistic data for testing the enhanced trainer dashboard
    - Includes various session statuses, client progress, and notification types
*/

-- Update existing profiles with enhanced data
UPDATE profiles SET 
  phone_number = '+1 (555) 123-4567',
  fitness_goals = ARRAY['Weight Loss', 'Strength Building', 'Endurance'],
  last_active = now() - INTERVAL '2 hours',
  medical_conditions = ARRAY['None'],
  emergency_contact = jsonb_build_object(
    'name', 'John Johnson',
    'phone', '+1 (555) 123-4568',
    'relationship', 'Spouse'
  )
WHERE id = '44444444-4444-4444-4444-444444444444';

UPDATE profiles SET 
  phone_number = '+1 (555) 234-5678',
  fitness_goals = ARRAY['Muscle Gain', 'Athletic Performance', 'Strength'],
  last_active = now() - INTERVAL '30 minutes',
  medical_conditions = ARRAY['None'],
  emergency_contact = jsonb_build_object(
    'name', 'Lisa Chen',
    'phone', '+1 (555) 234-5679',
    'relationship', 'Sister'
  )
WHERE id = '55555555-5555-5555-5555-555555555555';

-- Insert additional enhanced training sessions
INSERT INTO training_sessions (
  id, client_id, trainer_id, scheduled_date, scheduled_time, duration_minutes, 
  type, status, location, notes, trainer_notes, session_rating, exercises_completed
) VALUES
  (
    '77777777-7777-7777-7777-777777777777',
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE - INTERVAL '2 days',
    '09:00:00',
    60,
    'Strength Training',
    'completed',
    'Gym A - Main Floor',
    'Focus on upper body strength',
    'Excellent progress on bench press. Client increased weight by 10lbs and maintained perfect form throughout all sets.',
    5,
    '[
      {"exercise": "Bench Press", "sets": 4, "reps": 8, "weight": 135, "completed": true},
      {"exercise": "Incline Dumbbell Press", "sets": 3, "reps": 10, "weight": 35, "completed": true},
      {"exercise": "Pull-ups", "sets": 3, "reps": 8, "weight": 0, "completed": true},
      {"exercise": "Seated Row", "sets": 3, "reps": 12, "weight": 120, "completed": true}
    ]'
  ),
  (
    '88888888-8888-8888-8888-888888888888',
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE,
    '16:00:00',
    45,
    'HIIT Training',
    'scheduled',
    'Studio B - HIIT Room',
    'High intensity interval training session',
    NULL,
    NULL,
    '[]'
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE + INTERVAL '1 day',
    '10:00:00',
    60,
    'Lower Body Strength',
    'scheduled',
    'Gym A - Main Floor',
    'Focus on leg development and glute activation',
    NULL,
    NULL,
    '[]'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE + INTERVAL '2 days',
    '14:00:00',
    45,
    'Cardio & Conditioning',
    'scheduled',
    'Cardio Room',
    'Endurance building and cardiovascular improvement',
    NULL,
    NULL,
    '[]'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert session notifications
INSERT INTO session_notifications (
  session_id, trainer_id, client_id, notification_type, title, message, scheduled_for, sent, read, data
) VALUES
  (
    '88888888-8888-8888-8888-888888888888',
    '22222222-2222-2222-2222-222222222222',
    '55555555-5555-5555-5555-555555555555',
    'reminder',
    'Session Reminder',
    'You have a HIIT session with Mike Chen in 1 hour',
    CURRENT_DATE + INTERVAL '15 hours',
    false,
    false,
    jsonb_build_object(
      'session_type', 'HIIT Training',
      'session_date', CURRENT_DATE,
      'session_time', '16:00:00'
    )
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    '22222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-4444-444444444444',
    'completion',
    'Session Completed',
    'Great session with Sarah Johnson! She achieved a new personal record.',
    CURRENT_DATE - INTERVAL '2 days' + INTERVAL '1 hour',
    true,
    false,
    jsonb_build_object(
      'session_type', 'Strength Training',
      'session_rating', 5,
      'achievements', 'New bench press PR'
    )
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    '22222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-4444-444444444444',
    'confirmation',
    'Session Confirmed',
    'Sarah Johnson confirmed tomorrow\'s lower body session',
    CURRENT_DATE + INTERVAL '12 hours',
    true,
    true,
    jsonb_build_object(
      'session_type', 'Lower Body Strength',
      'confirmed_at', now()
    )
  )
ON CONFLICT DO NOTHING;

-- Insert client activity logs
INSERT INTO client_activity_log (
  client_id, trainer_id, activity_type, description, metadata, activity_date
) VALUES
  (
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'session_completed',
    'Completed strength training session with new bench press personal record',
    jsonb_build_object(
      'session_id', '77777777-7777-7777-7777-777777777777',
      'rating', 5,
      'achievements', ARRAY['Bench Press PR', 'Perfect Form'],
      'weight_lifted', 135
    ),
    CURRENT_DATE - INTERVAL '2 days' + INTERVAL '1 hour'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    'progress_updated',
    'Updated body weight and measurements - gained 2lbs of muscle mass',
    jsonb_build_object(
      'weight_change', 2,
      'muscle_gain', 1.5,
      'body_fat_change', -0.5
    ),
    CURRENT_DATE - INTERVAL '1 day'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'goal_achieved',
    'Achieved goal of bench pressing bodyweight (135lbs)',
    jsonb_build_object(
      'goal_type', 'strength',
      'target_weight', 135,
      'achieved_weight', 135,
      'goal_id', 'bench-press-bodyweight'
    ),
    CURRENT_DATE - INTERVAL '2 days'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    'message_sent',
    'Sent message asking about nutrition plan adjustments',
    jsonb_build_object(
      'message_type', 'nutrition_question',
      'topic', 'meal_timing'
    ),
    CURRENT_DATE - INTERVAL '3 hours'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'login',
    'Logged into the app and reviewed workout plan',
    jsonb_build_object(
      'session_duration', 15,
      'pages_viewed', ARRAY['workout_plan', 'progress', 'nutrition']
    ),
    CURRENT_DATE - INTERVAL '4 hours'
  )
ON CONFLICT DO NOTHING;

-- Insert client session summaries
INSERT INTO client_session_summary (
  client_id, trainer_id, total_sessions, completed_sessions, cancelled_sessions,
  no_show_sessions, avg_rating, last_session_date, next_session_date, total_training_hours, progress_score
) VALUES
  (
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    28,
    25,
    2,
    1,
    4.8,
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '1 day',
    25.5,
    85
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    22,
    20,
    1,
    1,
    4.9,
    CURRENT_DATE - INTERVAL '3 days',
    CURRENT_DATE,
    18.75,
    92
  )
ON CONFLICT (client_id, trainer_id) DO UPDATE SET
  total_sessions = EXCLUDED.total_sessions,
  completed_sessions = EXCLUDED.completed_sessions,
  cancelled_sessions = EXCLUDED.cancelled_sessions,
  no_show_sessions = EXCLUDED.no_show_sessions,
  avg_rating = EXCLUDED.avg_rating,
  last_session_date = EXCLUDED.last_session_date,
  next_session_date = EXCLUDED.next_session_date,
  total_training_hours = EXCLUDED.total_training_hours,
  progress_score = EXCLUDED.progress_score,
  updated_at = now();

-- Insert trainer dashboard stats
INSERT INTO trainer_dashboard_stats (
  trainer_id, date, total_clients, active_clients, today_sessions, 
  completed_sessions, pending_sessions, cancelled_sessions, avg_session_rating
) VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE,
    15,
    12,
    3,
    1,
    2,
    0,
    4.85
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE - INTERVAL '1 day',
    15,
    12,
    4,
    4,
    0,
    0,
    4.75
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE - INTERVAL '2 days',
    14,
    11,
    5,
    4,
    0,
    1,
    4.80
  )
ON CONFLICT (trainer_id, date) DO UPDATE SET
  total_clients = EXCLUDED.total_clients,
  active_clients = EXCLUDED.active_clients,
  today_sessions = EXCLUDED.today_sessions,
  completed_sessions = EXCLUDED.completed_sessions,
  pending_sessions = EXCLUDED.pending_sessions,
  cancelled_sessions = EXCLUDED.cancelled_sessions,
  avg_session_rating = EXCLUDED.avg_session_rating,
  updated_at = now();

-- Update client progress tracking with more detailed data
INSERT INTO client_progress_tracking (
  client_id, trainer_id, metric_type, value, unit, notes, recorded_date
) VALUES
  (
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'weight',
    68.2,
    'kg',
    'Lost 2.3kg this month through consistent training and nutrition',
    CURRENT_DATE
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'body_fat',
    21.8,
    '%',
    'Decreased from 24.5% - excellent progress',
    CURRENT_DATE
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'strength',
    135,
    'lbs',
    'Bench press max - achieved bodyweight goal!',
    CURRENT_DATE - INTERVAL '2 days'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    'weight',
    76.8,
    'kg',
    'Gained 1.6kg of lean muscle mass',
    CURRENT_DATE
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    'muscle_mass',
    54.2,
    'kg',
    'Significant muscle mass increase',
    CURRENT_DATE
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    'endurance',
    22.5,
    'minutes',
    '5K run time - improved by 2 minutes',
    CURRENT_DATE - INTERVAL '1 day'
  )
ON CONFLICT DO NOTHING;

-- Update last_active timestamps for realistic data
UPDATE profiles SET last_active = now() - INTERVAL '1 hour' 
WHERE id = '44444444-4444-4444-4444-444444444444';

UPDATE profiles SET last_active = now() - INTERVAL '30 minutes' 
WHERE id = '55555555-5555-5555-5555-555555555555';

UPDATE profiles SET last_active = now() - INTERVAL '2 days' 
WHERE id = '66666666-6666-6666-6666-666666666666';