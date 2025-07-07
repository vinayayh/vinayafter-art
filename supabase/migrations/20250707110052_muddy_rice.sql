/*
  # Create Workout Templates Table

  1. New Tables
    - `workout_templates` - Store workout template data

  2. Security
    - Enable RLS on workout_templates table
    - Add policies for authenticated users
*/

-- Create workout_templates table
CREATE TABLE IF NOT EXISTS workout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  duration integer DEFAULT 0,
  exercises jsonb DEFAULT '[]',
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

-- Policies for workout templates
CREATE POLICY "Anyone can read public workout templates"
  ON workout_templates
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can read own workout templates"
  ON workout_templates
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid()::text);

CREATE POLICY "Users can create workout templates"
  ON workout_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid()::text);

CREATE POLICY "Users can update own workout templates"
  ON workout_templates
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid()::text);

CREATE POLICY "Users can delete own workout templates"
  ON workout_templates
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid()::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workout_templates_created_by ON workout_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_workout_templates_category ON workout_templates(category);
CREATE INDEX IF NOT EXISTS idx_workout_templates_public ON workout_templates(is_public);

-- Insert default workout templates
INSERT INTO workout_templates (name, description, category, duration, exercises, created_by, is_public) VALUES
  (
    'Upper Body Strength',
    'Focus on building upper body strength with compound movements',
    'Strength',
    60,
    '[
      {
        "id": "ex-1",
        "name": "Bench Press",
        "sets": [
          {"reps": 8, "weight": 135, "restTime": 120},
          {"reps": 8, "weight": 135, "restTime": 120},
          {"reps": 8, "weight": 135, "restTime": 120}
        ],
        "order": 1,
        "notes": "Focus on controlled movement"
      },
      {
        "id": "ex-2",
        "name": "Pull-ups",
        "sets": [
          {"reps": 8, "restTime": 90},
          {"reps": 8, "restTime": 90},
          {"reps": 8, "restTime": 90}
        ],
        "order": 2,
        "notes": "Use assistance if needed"
      }
    ]',
    'system',
    true
  ),
  (
    'Lower Body Power',
    'Build explosive lower body strength and power',
    'Strength',
    45,
    '[
      {
        "id": "ex-3",
        "name": "Squats",
        "sets": [
          {"reps": 12, "weight": 185, "restTime": 120},
          {"reps": 10, "weight": 205, "restTime": 120},
          {"reps": 8, "weight": 225, "restTime": 120}
        ],
        "order": 1,
        "notes": "Progressive overload"
      },
      {
        "id": "ex-4",
        "name": "Deadlift",
        "sets": [
          {"reps": 5, "weight": 275, "restTime": 180},
          {"reps": 5, "weight": 275, "restTime": 180},
          {"reps": 5, "weight": 275, "restTime": 180}
        ],
        "order": 2,
        "notes": "Focus on form over weight"
      }
    ]',
    'system',
    true
  ),
  (
    'HIIT Cardio Blast',
    'High-intensity interval training for cardiovascular fitness',
    'Cardio',
    30,
    '[
      {
        "id": "ex-5",
        "name": "Push-ups",
        "sets": [
          {"reps": 15, "restTime": 30},
          {"reps": 15, "restTime": 30},
          {"reps": 15, "restTime": 30},
          {"reps": 15, "restTime": 30}
        ],
        "order": 1,
        "notes": "High intensity, short rest"
      },
      {
        "id": "ex-6",
        "name": "Squats",
        "sets": [
          {"reps": 20, "restTime": 30},
          {"reps": 20, "restTime": 30},
          {"reps": 20, "restTime": 30},
          {"reps": 20, "restTime": 30}
        ],
        "order": 2,
        "notes": "Explosive movement"
      }
    ]',
    'system',
    true
  ),
  (
    'Full Body Functional',
    'Functional movements for everyday strength',
    'Functional',
    50,
    '[
      {
        "id": "ex-7",
        "name": "Push-ups",
        "sets": [
          {"reps": 12, "restTime": 60},
          {"reps": 12, "restTime": 60},
          {"reps": 12, "restTime": 60}
        ],
        "order": 1,
        "notes": "Maintain proper form"
      },
      {
        "id": "ex-8",
        "name": "Squats",
        "sets": [
          {"reps": 15, "restTime": 60},
          {"reps": 15, "restTime": 60},
          {"reps": 15, "restTime": 60}
        ],
        "order": 2,
        "notes": "Full range of motion"
      },
      {
        "id": "ex-9",
        "name": "Pull-ups",
        "sets": [
          {"reps": 6, "restTime": 90},
          {"reps": 6, "restTime": 90},
          {"reps": 6, "restTime": 90}
        ],
        "order": 3,
        "notes": "Assisted if necessary"
      }
    ]',
    'system',
    true
  )
ON CONFLICT DO NOTHING;