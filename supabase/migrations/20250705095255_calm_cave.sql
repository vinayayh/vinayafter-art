/*
  # Trainer Today View Enhancements

  1. New Tables
    - `trainer_notifications` - Trainer-specific notifications
    - `session_reminders` - Session reminder settings
    - `client_progress_tracking` - Track client progress metrics

  2. Enhanced Tables
    - Add more fields to existing tables for better trainer functionality
    - Add indexes for performance

  3. Security
    - Enable RLS on all new tables
    - Add policies for trainer access
*/

-- Create trainer_notifications table
CREATE TABLE IF NOT EXISTS trainer_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text CHECK (type IN ('session_reminder', 'client_milestone', 'session_cancelled', 'new_client', 'payment_due', 'system_alert')) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  scheduled_for timestamptz,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Create session_reminders table
CREATE TABLE IF NOT EXISTS session_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id uuid REFERENCES training_sessions(id) ON DELETE CASCADE,
  reminder_type text CHECK (reminder_type IN ('15_minutes', '1_hour', '1_day')) NOT NULL,
  sent boolean DEFAULT false,
  scheduled_for timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, reminder_type)
);

-- Create client_progress_tracking table
CREATE TABLE IF NOT EXISTS client_progress_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  metric_type text CHECK (metric_type IN ('weight', 'body_fat', 'muscle_mass', 'strength', 'endurance', 'flexibility')) NOT NULL,
  value decimal(10,2) NOT NULL,
  unit text NOT NULL,
  notes text,
  recorded_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Create trainer_availability table
CREATE TABLE IF NOT EXISTS trainer_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6) NOT NULL, -- 0 = Sunday
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(trainer_id, day_of_week, start_time, end_time)
);

-- Add additional fields to training_sessions for better tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'session_rating'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN session_rating integer CHECK (session_rating >= 1 AND session_rating <= 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'client_feedback'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN client_feedback text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'trainer_notes'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN trainer_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'exercises_completed'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN exercises_completed jsonb DEFAULT '[]';
  END IF;
END $$;

-- Add additional fields to profiles for better client tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'emergency_contact'
  ) THEN
    ALTER TABLE profiles ADD COLUMN emergency_contact jsonb DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'fitness_goals'
  ) THEN
    ALTER TABLE profiles ADD COLUMN fitness_goals text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'medical_conditions'
  ) THEN
    ALTER TABLE profiles ADD COLUMN medical_conditions text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_active timestamptz DEFAULT now();
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE trainer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_availability ENABLE ROW LEVEL SECURITY;

-- Trainer notifications policies
CREATE POLICY "Trainers can manage own notifications"
  ON trainer_notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = trainer_id AND p.user_id = auth.uid()
    )
  );

-- Session reminders policies
CREATE POLICY "Trainers can manage own session reminders"
  ON session_reminders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = trainer_id AND p.user_id = auth.uid()
    )
  );

-- Client progress tracking policies
CREATE POLICY "Trainers can manage client progress"
  ON client_progress_tracking
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = trainer_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view own progress"
  ON client_progress_tracking
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = client_id AND p.user_id = auth.uid()
    )
  );

-- Trainer availability policies
CREATE POLICY "Trainers can manage own availability"
  ON trainer_availability
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = trainer_id AND p.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trainer_notifications_trainer_read ON trainer_notifications(trainer_id, read);
CREATE INDEX IF NOT EXISTS idx_trainer_notifications_scheduled ON trainer_notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_session_reminders_scheduled ON session_reminders(scheduled_for, sent);
CREATE INDEX IF NOT EXISTS idx_client_progress_date ON client_progress_tracking(client_id, recorded_date);
CREATE INDEX IF NOT EXISTS idx_trainer_availability_day ON trainer_availability(trainer_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status_date ON training_sessions(trainer_id, status, scheduled_date);

-- Create function to automatically create session reminders
CREATE OR REPLACE FUNCTION create_session_reminders()
RETURNS TRIGGER AS $$
BEGIN
  -- Create 1 day reminder
  INSERT INTO session_reminders (trainer_id, session_id, reminder_type, scheduled_for)
  VALUES (
    NEW.trainer_id,
    NEW.id,
    '1_day',
    (NEW.scheduled_date || ' ' || NEW.scheduled_time)::timestamp - INTERVAL '1 day'
  );

  -- Create 1 hour reminder
  INSERT INTO session_reminders (trainer_id, session_id, reminder_type, scheduled_for)
  VALUES (
    NEW.trainer_id,
    NEW.id,
    '1_hour',
    (NEW.scheduled_date || ' ' || NEW.scheduled_time)::timestamp - INTERVAL '1 hour'
  );

  -- Create 15 minutes reminder
  INSERT INTO session_reminders (trainer_id, session_id, reminder_type, scheduled_for)
  VALUES (
    NEW.trainer_id,
    NEW.id,
    '15_minutes',
    (NEW.scheduled_date || ' ' || NEW.scheduled_time)::timestamp - INTERVAL '15 minutes'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session reminders
DROP TRIGGER IF EXISTS trigger_create_session_reminders ON training_sessions;
CREATE TRIGGER trigger_create_session_reminders
  AFTER INSERT ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION create_session_reminders();

-- Create function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating last_active
DROP TRIGGER IF EXISTS trigger_update_last_active ON profiles;
CREATE TRIGGER trigger_update_last_active
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();

-- Create function to send notifications for important events
CREATE OR REPLACE FUNCTION create_trainer_notification(
  p_trainer_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT '{}',
  p_priority text DEFAULT 'medium',
  p_scheduled_for timestamptz DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO trainer_notifications (
    trainer_id, type, title, message, data, priority, scheduled_for
  ) VALUES (
    p_trainer_id, p_type, p_title, p_message, p_data, p_priority, p_scheduled_for
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for trainer dashboard stats
CREATE OR REPLACE VIEW trainer_dashboard_stats AS
SELECT 
  t.id as trainer_id,
  t.full_name as trainer_name,
  COUNT(DISTINCT ca.client_id) as total_clients,
  COUNT(DISTINCT CASE WHEN ca.status = 'active' THEN ca.client_id END) as active_clients,
  COUNT(DISTINCT CASE WHEN ts.scheduled_date = CURRENT_DATE THEN ts.id END) as today_sessions,
  COUNT(DISTINCT CASE WHEN ts.scheduled_date = CURRENT_DATE AND ts.status = 'completed' THEN ts.id END) as completed_today,
  COUNT(DISTINCT CASE WHEN ts.scheduled_date = CURRENT_DATE AND ts.status = 'scheduled' THEN ts.id END) as pending_today,
  COUNT(DISTINCT CASE WHEN tn.read = false THEN tn.id END) as unread_notifications,
  AVG(CASE WHEN ts.session_rating IS NOT NULL THEN ts.session_rating END) as avg_session_rating
FROM profiles t
LEFT JOIN client_assignments ca ON ca.trainer_id = t.id
LEFT JOIN training_sessions ts ON ts.trainer_id = t.id AND ts.scheduled_date >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN trainer_notifications tn ON tn.trainer_id = t.id AND tn.created_at >= CURRENT_DATE - INTERVAL '7 days'
WHERE t.role = 'trainer'
GROUP BY t.id, t.full_name;