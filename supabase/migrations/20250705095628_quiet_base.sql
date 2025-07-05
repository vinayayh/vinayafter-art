/*
  # Sample Trainer Data for Enhanced Dashboard

  1. Sample Data
    - Enhanced trainer and client profiles
    - Training sessions with ratings and feedback
    - Trainer notifications
    - Client progress tracking data
    - Session reminders

  2. Notes
    - This provides realistic data for testing the enhanced trainer dashboard
    - Includes various session statuses and client progress metrics
*/

-- Update existing profiles with enhanced data
UPDATE profiles SET 
  phone_number = '+1 (555) 123-4567',
  fitness_goals = ARRAY['Weight Loss', 'Strength Building'],
  last_active = now() - INTERVAL '2 hours'
WHERE id = '44444444-4444-4444-4444-444444444444';

UPDATE profiles SET 
  phone_number = '+1 (555) 234-5678',
  fitness_goals = ARRAY['Muscle Gain', 'Athletic Performance'],
  last_active = now() - INTERVAL '30 minutes'
WHERE id = '55555555-5555-5555-5555-555555555555';

UPDATE profiles SET 
  phone_number = '+1 (555) 345-6789',
  fitness_goals = ARRAY['Endurance', 'General Fitness'],
  last_active = now() - INTERVAL '1 day'
WHERE id = '66666666-6666-6666-6666-666666666666';

-- Insert additional training sessions with enhanced data
INSERT INTO training_sessions (
  id, client_id, trainer_id, scheduled_date, scheduled_time, duration_minutes, 
  type, status, location, notes, trainer_notes, session_rating, exercises_completed
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE - INTERVAL '1 day',
    '09:00:00',
    60,
    'Strength Training',
    'completed',
    'Gym A',
    'Focus on upper body',
    'Great progress on bench press. Increased weight by 5kg.',
    5,
    '[{"exercise": "Bench Press", "sets": 3, "reps": 10, "weight": 70}, {"exercise": "Pull-ups", "sets": 3, "reps": 8}]'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE,
    '16:00:00',
    45,
    'HIIT Training',
    'scheduled',
    'Studio B',
    'High intensity interval training',
    NULL,
    NULL,
    '[]'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE + INTERVAL '1 day',
    '10:00:00',
    60,
    'Lower Body',
    'scheduled',
    'Gym A',
    'Leg day focus',
    NULL,
    NULL,
    '[]'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE + INTERVAL '2 days',
    '14:00:00',
    45,
    'Cardio',
    'scheduled',
    'Cardio Room',
    'Endurance building',
    NULL,
    NULL,
    '[]'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert trainer notifications
INSERT INTO trainer_notifications (
  trainer_id, type, title, message, data, priority, read
) VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    'session_reminder',
    'Upcoming Session',
    'You have a HIIT session with Mike Chen in 1 hour',
    '{"session_id": "22222222-2222-2222-2222-222222222222", "client_id": "55555555-5555-5555-5555-555555555555"}',
    'high',
    false
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'client_milestone',
    'Client Achievement',
    'Sarah Johnson completed her 25th workout! 🎉',
    '{"client_id": "44444444-4444-4444-4444-444444444444", "milestone": "25_workouts"}',
    'medium',
    false
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'new_client',
    'New Client Assigned',
    'Emma Wilson has been assigned to you as a new client',
    '{"client_id": "66666666-6666-6666-6666-666666666666"}',
    'medium',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'system_alert',
    'Schedule Update',
    'Your availability has been updated for next week',
    '{}',
    'low',
    true
  )
ON CONFLICT DO NOTHING;

-- Insert client progress tracking data
INSERT INTO client_progress_tracking (
  client_id, trainer_id, metric_type, value, unit, notes, recorded_date
) VALUES
  (
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'weight',
    68.5,
    'kg',
    'Lost 2kg this month',
    CURRENT_DATE
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'body_fat',
    22.5,
    '%',
    'Decreased from 25%',
    CURRENT_DATE
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'strength',
    70,
    'kg',
    'Bench press max',
    CURRENT_DATE
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    'weight',
    75.2,
    'kg',
    'Gained 3kg muscle mass',
    CURRENT_DATE
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    'muscle_mass',
    52.8,
    'kg',
    'Increased muscle mass',
    CURRENT_DATE
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    'endurance',
    12,
    'minutes',
    '5K run time improvement',
    CURRENT_DATE
  )
ON CONFLICT DO NOTHING;

-- Insert trainer availability
INSERT INTO trainer_availability (
  trainer_id, day_of_week, start_time, end_time, is_available
) VALUES
  ('22222222-2222-2222-2222-222222222222', 1, '08:00:00', '18:00:00', true), -- Monday
  ('22222222-2222-2222-2222-222222222222', 2, '08:00:00', '18:00:00', true), -- Tuesday
  ('22222222-2222-2222-2222-222222222222', 3, '08:00:00', '18:00:00', true), -- Wednesday
  ('22222222-2222-2222-2222-222222222222', 4, '08:00:00', '18:00:00', true), -- Thursday
  ('22222222-2222-2222-2222-222222222222', 5, '08:00:00', '16:00:00', true), -- Friday
  ('22222222-2222-2222-2222-222222222222', 6, '09:00:00', '14:00:00', true), -- Saturday
  ('22222222-2222-2222-2222-222222222222', 0, '10:00:00', '14:00:00', false) -- Sunday (not available)
ON CONFLICT DO NOTHING;

-- Update existing training sessions with ratings
UPDATE training_sessions SET 
  session_rating = 4,
  trainer_notes = 'Good session, client showed improvement',
  exercises_completed = '[{"exercise": "Squats", "sets": 3, "reps": 12}, {"exercise": "Deadlifts", "sets": 3, "reps": 8}]'
WHERE id = '11111111-1111-1111-1111-111111111111' AND status = 'completed';

UPDATE training_sessions SET 
  session_rating = 5,
  trainer_notes = 'Excellent energy and form throughout',
  exercises_completed = '[{"exercise": "Burpees", "sets": 4, "reps": 10}, {"exercise": "Mountain Climbers", "sets": 4, "reps": 20}]'
WHERE id = '22222222-2222-2222-2222-222222222222' AND status = 'completed';

-- Create some session reminders for upcoming sessions
INSERT INTO session_reminders (
  trainer_id, session_id, reminder_type, scheduled_for, sent
)
SELECT 
  ts.trainer_id,
  ts.id,
  '1_hour',
  (ts.scheduled_date || ' ' || ts.scheduled_time)::timestamp - INTERVAL '1 hour',
  false
FROM training_sessions ts
WHERE ts.status = 'scheduled' 
  AND ts.scheduled_date >= CURRENT_DATE
  AND NOT EXISTS (
    SELECT 1 FROM session_reminders sr 
    WHERE sr.session_id = ts.id AND sr.reminder_type = '1_hour'
  );