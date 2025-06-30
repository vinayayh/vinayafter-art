import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Clock,
  Calendar,
  Dumbbell,
  TrendingUp,
  FileText,
  Award
} from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';
import { WorkoutSession, WorkoutTemplate } from '@/types/workout';
import { getSession, getTemplate } from '@/utils/storage';
import { formatDuration, calculateSessionVolume, calculateTotalVolume } from '@/utils/workoutUtils';

interface SessionWithTemplate extends WorkoutSession {
  templateName: string;
}

export default function SessionDetailsScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { sessionId } = useLocalSearchParams();

  const [session, setSession] = useState<SessionWithTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionDetails();
  }, []);

  const loadSessionDetails = async () => {
    try {
      const loadedSession = await getSession(sessionId as string);
      if (loadedSession) {
        const template = await getTemplate(loadedSession.templateId);
        setSession({
          ...loadedSession,
          templateName: template?.name || 'Unknown Workout'
        });
      }
    } catch (error) {
      console.error('Error loading session details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSessionDuration = (): string => {
    if (session?.startTime && session?.endTime) {
      const start = new Date(`${session.date}T${session.startTime}`);
      const end = new Date(`${session.date}T${session.endTime}`);
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      return formatDuration(durationMinutes);
    }
    return 'N/A';
  };

  const getTotalSets = (): number => {
    if (!session) return 0;
    return session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  };

  const getCompletedSets = (): number => {
    if (!session) return 0;
    return session.exercises.reduce((total, exercise) => 
      total + exercise.sets.filter(set => set.completed).length, 0
    );
  };

  const getPersonalRecords = () => {
    if (!session) return [];
    
    const records: { exerciseName: string; weight: number; reps: number }[] = [];
    
    session.exercises.forEach(exercise => {
      const maxWeightSet = exercise.sets
        .filter(set => set.completed && set.weight && set.reps)
        .reduce((max, set) => 
          (set.weight || 0) > (max.weight || 0) ? set : max, 
          { weight: 0, reps: 0 }
        );
      
      if (maxWeightSet.weight && maxWeightSet.weight > 0) {
        // In a real app, you'd compare against historical data
        // For now, we'll just show the best set from this session
        records.push({
          exerciseName: exercise.exerciseId, // Would need to map to actual exercise name
          weight: maxWeightSet.weight,
          reps: maxWeightSet.reps || 0
        });
      }
    });
    
    return records;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading session details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Session not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalVolume = calculateSessionVolume(session);
  const totalSets = getTotalSets();
  const completedSets = getCompletedSets();
  const personalRecords = getPersonalRecords();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Session Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Session Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.workoutName}>{session.templateName}</Text>
          <Text style={styles.workoutDate}>
            {new Date(session.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          
          <View style={[
            styles.statusBadge,
            { backgroundColor: session.completed ? colors.success : colors.warning }
          ]}>
            <Text style={styles.statusText}>
              {session.completed ? 'Completed' : 'In Progress'}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Clock size={20} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{getSessionDuration()}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
              <Dumbbell size={20} color={colors.success} />
            </View>
            <Text style={styles.statValue}>{completedSets}/{totalSets}</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
              <TrendingUp size={20} color={colors.warning} />
            </View>
            <Text style={styles.statValue}>{totalVolume.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Volume (kg)</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.error}15` }]}>
              <Award size={20} color={colors.error} />
            </View>
            <Text style={styles.statValue}>{session.exercises.length}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
        </View>

        {/* Exercise Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercise Details</Text>
          
          {session.exercises.map((exercise, exerciseIndex) => (
            <View key={exerciseIndex} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>
                Exercise {exerciseIndex + 1} {/* Would map to actual exercise name */}
              </Text>
              
              <View style={styles.setsTable}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>Set</Text>
                  <Text style={styles.tableHeaderText}>Reps</Text>
                  <Text style={styles.tableHeaderText}>Weight</Text>
                  <Text style={styles.tableHeaderText}>Volume</Text>
                </View>
                
                {exercise.sets.map((set, setIndex) => (
                  <View key={set.id} style={[
                    styles.tableRow,
                    !set.completed && styles.incompleteRow
                  ]}>
                    <Text style={styles.tableCell}>{setIndex + 1}</Text>
                    <Text style={styles.tableCell}>{set.reps || '-'}</Text>
                    <Text style={styles.tableCell}>{set.weight ? `${set.weight} kg` : '-'}</Text>
                    <Text style={styles.tableCell}>
                      {set.reps && set.weight ? `${(set.reps * set.weight).toLocaleString()} kg` : '-'}
                    </Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.exerciseStats}>
                <Text style={styles.exerciseStatText}>
                  Total Volume: {calculateTotalVolume(exercise.sets).toLocaleString()} kg
                </Text>
                <Text style={styles.exerciseStatText}>
                  Sets Completed: {exercise.sets.filter(s => s.completed).length}/{exercise.sets.length}
                </Text>
              </View>

              {exercise.notes && (
                <View style={styles.exerciseNotes}>
                  <Text style={styles.notesLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{exercise.notes}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Personal Records */}
        {personalRecords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Highlights</Text>
            
            {personalRecords.map((record, index) => (
              <View key={index} style={styles.recordCard}>
                <View style={styles.recordIcon}>
                  <Award size={20} color={colors.warning} />
                </View>
                <View style={styles.recordInfo}>
                  <Text style={styles.recordTitle}>Best Set</Text>
                  <Text style={styles.recordDetails}>
                    {record.weight} kg × {record.reps} reps
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Session Notes */}
        {session.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Notes</Text>
            <View style={styles.notesCard}>
              <FileText size={20} color={colors.textSecondary} />
              <Text style={styles.sessionNotesText}>{session.notes}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBackButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  overviewCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  workoutName: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  workoutDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  statusBadge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  setsTable: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderText: {
    flex: 1,
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  incompleteRow: {
    opacity: 0.6,
  },
  tableCell: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  exerciseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  exerciseStatText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  exerciseNotes: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
  },
  notesLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.text,
    marginBottom: 4,
  },
  notesText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  recordIcon: {
    width: 40,
    height: 40,
    backgroundColor: `${colors.warning}15`,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  recordDetails: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  notesCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionNotesText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
});