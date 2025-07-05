/*
  # Enhanced Trainer Dashboard Schema

  1. New Tables
    - `trainer_dashboard_stats` - Materialized view for trainer statistics
    - `client_session_summary` - Client session summaries
    - `trainer_client_assignments` - Enhanced client assignments
    - `session_notifications` - Session-specific notifications
    - `client_activity_log` - Track client activities

  2. Enhanced Views
    - Real-time trainer dashboard data
    - Client progress tracking
    - Session management

  3. Security
    - Enable RLS on all tables
    - Add policies for trainer access
*/

-- Create enhanced trainer dashboard stats table
CREATE TABLE IF NOT EXISTS trainer_dashboard_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  total_clients integer DEFAULT 0,
  active_clients integer DEFAULT 0,
  today_sessions integer DEFAULT 0,
  completed_sessions integer DEFAULT 0,
  pending_sessions integer DEFAULT 0,
  cancelled_sessions integer DEFAULT 0,
  avg_session_rating decimal(3,2) DEFAULT 0,
  total_revenue decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(trainer_id, date)
);

-- Create client session summary table
CREATE TABLE IF NOT EXISTS client_session_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  total_sessions integer DEFAULT 0,
  completed_sessions integer DEFAULT 0,
  cancelled_sessions integer DEFAULT 0,
  no_show_sessions integer DEFAULT 0,
  avg_rating decimal(3,2) DEFAULT 0,
  last_session_date date,
  next_session_date date,
  total_training_hours decimal(5,2) DEFAULT 0,
  progress_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, trainer_id)
);

-- Create session notifications table
CREATE TABLE IF NOT EXISTS session_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES training_sessions(id) ON DELETE CASCADE,
  trainer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type text CHECK (notification_type IN ('reminder', 'confirmation', 'cancellation', 'completion', 'no_show')) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  sent boolean DEFAULT false,
  read boolean DEFAULT false,
  data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create client activity log table
CREATE TABLE IF NOT EXISTS client_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  activity_type text CHECK (activity_type IN ('session_completed', 'session_cancelled', 'goal_achieved', 'progress_updated', 'message_sent', 'login')) NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  activity_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create enhanced client assignments view
CREATE OR REPLACE VIEW enhanced_client_assignments AS
SELECT 
  ca.*,
  c.full_name as client_name,
  c.email as client_email,
  c.phone_number as client_phone,
  c.fitness_goals,
  c.last_active,
  t.full_name as trainer_name,
  css.total_sessions,
  css.completed_sessions,
  css.avg_rating,
  css.last_session_date,
  css.next_session_date,
  css.progress_score,
  CASE 
    WHEN c.last_active > now() - INTERVAL '24 hours' THEN 'active'
    WHEN c.last_active > now() - INTERVAL '7 days' THEN 'inactive'
    ELSE 'dormant'
  END as activity_status
FROM client_assignments ca
JOIN profiles c ON c.id = ca.client_id
JOIN profiles t ON t.id = ca.trainer_id
LEFT JOIN client_session_summary css ON css.client_id = ca.client_id AND css.trainer_id = ca.trainer_id
WHERE ca.status = 'active';

-- Create trainer dashboard view
CREATE OR REPLACE VIEW trainer_dashboard_view AS
SELECT 
  t.id as trainer_id,
  t.full_name as trainer_name,
  t.email as trainer_email,
  COUNT(DISTINCT ca.client_id) as total_clients,
  COUNT(DISTINCT CASE WHEN eca.activity_status = 'active' THEN ca.client_id END) as active_clients,
  COUNT(DISTINCT CASE WHEN ts.scheduled_date = CURRENT_DATE THEN ts.id END) as today_sessions,
  COUNT(DISTINCT CASE WHEN ts.scheduled_date = CURRENT_DATE AND ts.status = 'completed' THEN ts.id END) as completed_today,
  COUNT(DISTINCT CASE WHEN ts.scheduled_date = CURRENT_DATE AND ts.status = 'scheduled' THEN ts.id END) as pending_today,
  COUNT(DISTINCT CASE WHEN tn.read = false THEN tn.id END) as unread_notifications,
  AVG(CASE WHEN ts.session_rating IS NOT NULL THEN ts.session_rating END) as avg_session_rating,
  COUNT(DISTINCT CASE WHEN ts.scheduled_date >= CURRENT_DATE - INTERVAL '7 days' THEN ts.id END) as weekly_sessions
FROM profiles t
LEFT JOIN client_assignments ca ON ca.trainer_id = t.id AND ca.status = 'active'
LEFT JOIN enhanced_client_assignments eca ON eca.trainer_id = t.id
LEFT JOIN training_sessions ts ON ts.trainer_id = t.id AND ts.scheduled_date >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN trainer_notifications tn ON tn.trainer_id = t.id AND tn.created_at >= CURRENT_DATE - INTERVAL '7 days'
WHERE t.role = 'trainer'
GROUP BY t.id, t.full_name, t.email;

-- Enable RLS on new tables
ALTER TABLE trainer_dashboard_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_session_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_activity_log ENABLE ROW LEVEL SECURITY;

-- Trainer dashboard stats policies
CREATE POLICY "Trainers can view own dashboard stats"
  ON trainer_dashboard_stats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = trainer_id AND p.user_id = auth.uid()
    )
  );

-- Client session summary policies
CREATE POLICY "Trainers can view client session summaries"
  ON client_session_summary
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = trainer_id AND p.user_id = auth.uid()
    )
  );

-- Session notifications policies
CREATE POLICY "Trainers can manage session notifications"
  ON session_notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = trainer_id AND p.user_id = auth.uid()
    )
  );

-- Client activity log policies
CREATE POLICY "Trainers can view client activity"
  ON client_activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = trainer_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view own activity"
  ON client_activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = client_id AND p.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trainer_dashboard_stats_trainer_date ON trainer_dashboard_stats(trainer_id, date);
CREATE INDEX IF NOT EXISTS idx_client_session_summary_trainer ON client_session_summary(trainer_id);
CREATE INDEX IF NOT EXISTS idx_session_notifications_trainer_sent ON session_notifications(trainer_id, sent);
CREATE INDEX IF NOT EXISTS idx_client_activity_log_client_date ON client_activity_log(client_id, activity_date);

-- Function to update trainer dashboard stats
CREATE OR REPLACE FUNCTION update_trainer_dashboard_stats(p_trainer_id uuid)
RETURNS void AS $$
DECLARE
  stats_record RECORD;
BEGIN
  -- Calculate stats for the trainer
  SELECT 
    COUNT(DISTINCT ca.client_id) as total_clients,
    COUNT(DISTINCT CASE WHEN eca.activity_status = 'active' THEN ca.client_id END) as active_clients,
    COUNT(DISTINCT CASE WHEN ts.scheduled_date = CURRENT_DATE THEN ts.id END) as today_sessions,
    COUNT(DISTINCT CASE WHEN ts.scheduled_date = CURRENT_DATE AND ts.status = 'completed' THEN ts.id END) as completed_sessions,
    COUNT(DISTINCT CASE WHEN ts.scheduled_date = CURRENT_DATE AND ts.status = 'scheduled' THEN ts.id END) as pending_sessions,
    COUNT(DISTINCT CASE WHEN ts.scheduled_date = CURRENT_DATE AND ts.status = 'cancelled' THEN ts.id END) as cancelled_sessions,
    AVG(CASE WHEN ts.session_rating IS NOT NULL THEN ts.session_rating END) as avg_rating
  INTO stats_record
  FROM client_assignments ca
  LEFT JOIN enhanced_client_assignments eca ON eca.client_id = ca.client_id AND eca.trainer_id = ca.trainer_id
  LEFT JOIN training_sessions ts ON ts.trainer_id = ca.trainer_id AND ts.scheduled_date >= CURRENT_DATE - INTERVAL '30 days'
  WHERE ca.trainer_id = p_trainer_id AND ca.status = 'active';

  -- Upsert the stats
  INSERT INTO trainer_dashboard_stats (
    trainer_id, date, total_clients, active_clients, today_sessions, 
    completed_sessions, pending_sessions, cancelled_sessions, avg_session_rating
  ) VALUES (
    p_trainer_id, CURRENT_DATE, 
    COALESCE(stats_record.total_clients, 0),
    COALESCE(stats_record.active_clients, 0),
    COALESCE(stats_record.today_sessions, 0),
    COALESCE(stats_record.completed_sessions, 0),
    COALESCE(stats_record.pending_sessions, 0),
    COALESCE(stats_record.cancelled_sessions, 0),
    COALESCE(stats_record.avg_rating, 0)
  )
  ON CONFLICT (trainer_id, date) 
  DO UPDATE SET
    total_clients = EXCLUDED.total_clients,
    active_clients = EXCLUDED.active_clients,
    today_sessions = EXCLUDED.today_sessions,
    completed_sessions = EXCLUDED.completed_sessions,
    pending_sessions = EXCLUDED.pending_sessions,
    cancelled_sessions = EXCLUDED.cancelled_sessions,
    avg_session_rating = EXCLUDED.avg_session_rating,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to update client session summary
CREATE OR REPLACE FUNCTION update_client_session_summary(p_client_id uuid, p_trainer_id uuid)
RETURNS void AS $$
DECLARE
  summary_record RECORD;
BEGIN
  -- Calculate session summary for the client-trainer pair
  SELECT 
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_sessions,
    COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show_sessions,
    AVG(CASE WHEN session_rating IS NOT NULL THEN session_rating END) as avg_rating,
    MAX(CASE WHEN status = 'completed' THEN scheduled_date END) as last_session_date,
    MIN(CASE WHEN status = 'scheduled' AND scheduled_date >= CURRENT_DATE THEN scheduled_date END) as next_session_date,
    SUM(CASE WHEN status = 'completed' THEN duration_minutes ELSE 0 END) / 60.0 as total_hours
  INTO summary_record
  FROM training_sessions
  WHERE client_id = p_client_id AND trainer_id = p_trainer_id;

  -- Upsert the summary
  INSERT INTO client_session_summary (
    client_id, trainer_id, total_sessions, completed_sessions, cancelled_sessions,
    no_show_sessions, avg_rating, last_session_date, next_session_date, total_training_hours
  ) VALUES (
    p_client_id, p_trainer_id,
    COALESCE(summary_record.total_sessions, 0),
    COALESCE(summary_record.completed_sessions, 0),
    COALESCE(summary_record.cancelled_sessions, 0),
    COALESCE(summary_record.no_show_sessions, 0),
    COALESCE(summary_record.avg_rating, 0),
    summary_record.last_session_date,
    summary_record.next_session_date,
    COALESCE(summary_record.total_hours, 0)
  )
  ON CONFLICT (client_id, trainer_id)
  DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    completed_sessions = EXCLUDED.completed_sessions,
    cancelled_sessions = EXCLUDED.cancelled_sessions,
    no_show_sessions = EXCLUDED.no_show_sessions,
    avg_rating = EXCLUDED.avg_rating,
    last_session_date = EXCLUDED.last_session_date,
    next_session_date = EXCLUDED.next_session_date,
    total_training_hours = EXCLUDED.total_training_hours,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to log client activity
CREATE OR REPLACE FUNCTION log_client_activity(
  p_client_id uuid,
  p_trainer_id uuid,
  p_activity_type text,
  p_description text,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  activity_id uuid;
BEGIN
  INSERT INTO client_activity_log (
    client_id, trainer_id, activity_type, description, metadata
  ) VALUES (
    p_client_id, p_trainer_id, p_activity_type, p_description, p_metadata
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session summary when training session changes
CREATE OR REPLACE FUNCTION trigger_update_session_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Update client session summary
  PERFORM update_client_session_summary(
    COALESCE(NEW.client_id, OLD.client_id),
    COALESCE(NEW.trainer_id, OLD.trainer_id)
  );
  
  -- Update trainer dashboard stats
  PERFORM update_trainer_dashboard_stats(COALESCE(NEW.trainer_id, OLD.trainer_id));
  
  -- Log activity if session completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM log_client_activity(
      NEW.client_id,
      NEW.trainer_id,
      'session_completed',
      'Training session completed: ' || NEW.type,
      jsonb_build_object('session_id', NEW.id, 'rating', NEW.session_rating)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for training sessions
DROP TRIGGER IF EXISTS trigger_training_session_changes ON training_sessions;
CREATE TRIGGER trigger_training_session_changes
  AFTER INSERT OR UPDATE OR DELETE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_session_summary();

-- Function to create session notifications
CREATE OR REPLACE FUNCTION create_session_notification(
  p_session_id uuid,
  p_notification_type text,
  p_scheduled_for timestamptz
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
  session_record RECORD;
  notification_title text;
  notification_message text;
BEGIN
  -- Get session details
  SELECT ts.*, c.full_name as client_name, t.full_name as trainer_name
  INTO session_record
  FROM training_sessions ts
  JOIN profiles c ON c.id = ts.client_id
  JOIN profiles t ON t.id = ts.trainer_id
  WHERE ts.id = p_session_id;
  
  -- Generate notification content based on type
  CASE p_notification_type
    WHEN 'reminder' THEN
      notification_title := 'Session Reminder';
      notification_message := 'Upcoming session with ' || session_record.client_name || ' in 1 hour';
    WHEN 'confirmation' THEN
      notification_title := 'Session Confirmed';
      notification_message := session_record.client_name || ' confirmed the session';
    WHEN 'cancellation' THEN
      notification_title := 'Session Cancelled';
      notification_message := session_record.client_name || ' cancelled the session';
    WHEN 'completion' THEN
      notification_title := 'Session Completed';
      notification_message := 'Session with ' || session_record.client_name || ' completed';
    WHEN 'no_show' THEN
      notification_title := 'Client No-Show';
      notification_message := session_record.client_name || ' did not attend the session';
    ELSE
      notification_title := 'Session Update';
      notification_message := 'Session update for ' || session_record.client_name;
  END CASE;
  
  -- Create notification
  INSERT INTO session_notifications (
    session_id, trainer_id, client_id, notification_type,
    title, message, scheduled_for, data
  ) VALUES (
    p_session_id, session_record.trainer_id, session_record.client_id,
    p_notification_type, notification_title, notification_message,
    p_scheduled_for,
    jsonb_build_object(
      'session_type', session_record.type,
      'session_date', session_record.scheduled_date,
      'session_time', session_record.scheduled_time
    )
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;