import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Menu, 
  RotateCcw, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Undo2,
  Calendar,
  Play,
  Dumbbell,
  Target,
  TrendingUp,
  ChevronRight
} from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface WorkoutSession {
  id: string;
  date: string;
  dayName: string;
  dayNumber: number;
  dayShort: string;
  template_id: string | null;
  trainer_id: string | null;
  status: 'completed' | 'missed' | 'scheduled' | 'rest';
  duration_minutes: number | null;
  exercises: any[];
  notes: string | null;
  completed: boolean;
}

interface WeeklyStats {
  totalWorkouts: number;
  completedWorkouts: number;
  totalDuration: number;
  completionRate: number;
}

export default function TrainingCalendarScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [weeklyWorkouts, setWeeklyWorkouts] = useState<WorkoutSession[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    totalWorkouts: 0,
    completedWorkouts: 0,
    totalDuration: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [isRearrangeMode, setIsRearrangeMode] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

  useEffect(() => {
    loadWeeklySchedule();
  }, [currentWeekStart]);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isRearrangeMode ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isRearrangeMode]);

  const getCurrentUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCurrentUserProfile:', error);
      return null;
    }
  };

  const getWeekDates = (startDate: Date) => {
    const week = [];
    const monday = new Date(startDate);
    const dayOfWeek = startDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(startDate.getDate() + diff);

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      week.push(date);
    }

    return week;
  };

  const loadWeeklySchedule = async () => {
    try {
      setLoading(true);
      const profile = await getCurrentUserProfile();
      if (!profile) {
        setLoading(false);
        return;
      }

      const weekDates = getWeekDates(currentWeekStart);
      const startDate = weekDates[0].toISOString().split('T')[0];
      const endDate = weekDates[6].toISOString().split('T')[0];

      // Fetch workout sessions for the week
      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('client_id', profile.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching workout sessions:', error);
        setLoading(false);
        return;
      }

      // Create weekly schedule
      const weeklySchedule: WorkoutSession[] = [];
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayShortNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

      weekDates.forEach((date, index) => {
        const dateString = date.toISOString().split('T')[0];
        const session = sessions?.find(s => s.date === dateString);
        
        const workoutSession: WorkoutSession = {
          id: session?.id || `${dateString}-${index}`,
          date: dateString,
          dayName: dayNames[index],
          dayNumber: date.getDate(),
          dayShort: dayShortNames[index],
          template_id: session?.template_id || null,
          trainer_id: session?.trainer_id || null,
          status: session ? (session.completed ? 'completed' : 'scheduled') : 'rest',
          duration_minutes: session?.duration_minutes || null,
          exercises: session?.exercises || [],
          notes: session?.notes || null,
          completed: session?.completed || false
        };

        // Determine if missed (past date, scheduled but not completed)
        const today = new Date().toISOString().split('T')[0];
        if (dateString < today && session && !session.completed) {
          workoutSession.status = 'missed';
        }

        weeklySchedule.push(workoutSession);
      });

      setWeeklyWorkouts(weeklySchedule);
      calculateWeeklyStats(weeklySchedule);
    } catch (error) {
      console.error('Error loading weekly schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyStats = (workouts: WorkoutSession[]) => {
    const totalWorkouts = workouts.filter(w => w.template_id !== null).length;
    const completedWorkouts = workouts.filter(w => w.status === 'completed').length;
    const totalDuration = workouts
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
    const completionRate = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;

    setWeeklyStats({
      totalWorkouts,
      completedWorkouts,
      totalDuration,
      completionRate
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWeeklySchedule();
    setRefreshing(false);
  };

  const handleRearrangeToggle = () => {
    setIsRearrangeMode(!isRearrangeMode);
    setSelectedItem(null);
  };

  const handleWorkoutPress = (workout: WorkoutSession, index: number) => {
    if (isRearrangeMode) {
      if (selectedItem === null) {
        setSelectedItem(index);
      } else if (selectedItem === index) {
        setSelectedItem(null);
      } else {
        // Swap workouts logic would go here
        setSelectedItem(null);
      }
    } else {
      // Navigate to workout details or start workout
      if (workout.template_id) {
        if (workout.status === 'scheduled') {
          router.push(`/start-workout/${workout.id}`);
        } else {
          router.push(`/workout-detail/${workout.template_id}`);
        }
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color={colors.success} />;
      case 'missed':
        return <AlertCircle size={16} color={colors.error} />;
      case 'scheduled':
        return <Clock size={16} color={colors.primary} />;
      default:
        return null;
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const getWeekRange = () => {
    const weekDates = getWeekDates(currentWeekStart);
    const start = weekDates[0];
    const end = weekDates[6];
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}-${end.getDate()}`;
    } else {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
  };

  const renderCalendarHeader = () => (
    <View style={styles.calendarHeader}>
      <View style={styles.weekNavigation}>
        <TouchableOpacity onPress={() => navigateWeek('prev')} style={styles.navButton}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <View style={styles.weekInfo}>
          <Text style={styles.weekRange}>{getWeekRange()}</Text>
          <Text style={styles.weekYear}>{currentWeekStart.getFullYear()}</Text>
        </View>
        
        <TouchableOpacity onPress={() => navigateWeek('next')} style={styles.navButton}>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekContainer}>
        {weeklyWorkouts.map((workout, index) => (
          <View key={index} style={styles.dayHeaderContainer}>
            <Text style={styles.dayHeaderText}>{workout.dayName}</Text>
            <TouchableOpacity
              style={[
                styles.dayHeaderCircle,
                workout.template_id && styles.activeDayHeaderCircle,
                workout.status === 'completed' && styles.completedDayHeaderCircle,
                workout.status === 'missed' && styles.missedDayHeaderCircle
              ]}
              onPress={() => handleWorkoutPress(workout, index)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dayHeaderNumber,
                workout.template_id && styles.activeDayHeaderNumber,
                (workout.status === 'completed' || workout.status === 'missed') && styles.statusDayHeaderNumber
              ]}>
                {workout.dayNumber}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderWeeklyStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <View style={styles.statIcon}>
          <Dumbbell size={20} color={colors.primary} />
        </View>
        <Text style={styles.statNumber}>{weeklyStats.completedWorkouts}</Text>
        <Text style={styles.statLabel}>Completed</Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={styles.statIcon}>
          <Target size={20} color={colors.success} />
        </View>
        <Text style={styles.statNumber}>{Math.round(weeklyStats.completionRate)}%</Text>
        <Text style={styles.statLabel}>Success Rate</Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={styles.statIcon}>
          <Clock size={20} color={colors.warning} />
        </View>
        <Text style={styles.statNumber}>{weeklyStats.totalDuration}</Text>
        <Text style={styles.statLabel}>Minutes</Text>
      </View>
    </View>
  );

  const renderWorkoutItem = (workout: WorkoutSession, index: number) => {
    const isSelected = selectedItem === index;
    
    return (
      <Animated.View
        key={index}
        style={[
          styles.workoutItemContainer,
          {
            transform: [{
              scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [1, isSelected ? 1.02 : 1],
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.workoutItem,
            isSelected && styles.selectedWorkoutItem,
            !workout.template_id && styles.restDayItem,
            workout.status === 'missed' && styles.missedWorkoutItem
          ]}
          onPress={() => handleWorkoutPress(workout, index)}
          activeOpacity={0.7}
        >
          <View style={styles.workoutItemLeft}>
            <View style={styles.workoutDateContainer}>
              <Text style={styles.workoutDayShort}>{workout.dayShort}</Text>
              <Text style={styles.workoutDayNumber}>{workout.dayNumber}</Text>
            </View>
            
            <View style={styles.workoutInfoContainer}>
              <Text style={[
                styles.workoutName,
                workout.status === 'missed' && styles.missedWorkoutName
              ]}>
                {workout.template_id ? 'Workout Scheduled' : 'Rest Day'}
              </Text>
              {workout.template_id && (
                <View style={styles.workoutStatusContainer}>
                  {getStatusIcon(workout.status)}
                  <Text style={[
                    styles.workoutStatus,
                    workout.status === 'missed' && styles.missedWorkoutStatus,
                    workout.status === 'completed' && styles.completedWorkoutStatus
                  ]}>
                    {workout.status === 'completed' && `${workout.duration_minutes || 0} min completed`}
                    {workout.status === 'scheduled' && 'Ready to start'}
                    {workout.status === 'missed' && 'Missed workout'}
                  </Text>
                </View>
              )}
              {workout.notes && (
                <Text style={styles.workoutNotes}>{workout.notes}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.workoutItemRight}>
            {workout.status === 'scheduled' && (
              <TouchableOpacity 
                style={styles.playButton}
                onPress={() => router.push(`/start-workout/${workout.id}`)}
              >
                <Play size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {isRearrangeMode && (
              <View style={styles.dragHandle}>
                <Menu size={20} color={colors.textTertiary} />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading training schedule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {isRearrangeMode ? 'Rearrange' : 'Training Calendar'}
        </Text>
        
        <TouchableOpacity onPress={handleRearrangeToggle} style={styles.rearrangeButton}>
          {isRearrangeMode ? (
            <Text style={styles.rearrangeButtonText}>Done</Text>
          ) : (
            <Undo2 size={20} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Calendar Header */}
        {!isRearrangeMode && renderCalendarHeader()}

        {/* Weekly Stats */}
        {!isRearrangeMode && renderWeeklyStats()}

        {/* Workout List */}
        <View style={styles.workoutsList}>
          <Text style={styles.sectionTitle}>This Week's Schedule</Text>
          {weeklyWorkouts.map((workout, index) => renderWorkoutItem(workout, index))}
        </View>

        {/* Instructions for rearrange mode */}
        {isRearrangeMode && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>How to rearrange</Text>
            <Text style={styles.instructionsText}>
              Tap on a workout to select it, then tap on another day to swap their positions. Tap "Done" to save your changes.
            </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  rearrangeButton: {
    padding: 4,
    minWidth: 50,
    alignItems: 'flex-end',
  },
  rearrangeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  calendarHeader: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekInfo: {
    alignItems: 'center',
  },
  weekRange: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  weekYear: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayHeaderContainer: {
    alignItems: 'center',
  },
  dayHeaderText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayHeaderCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDayHeaderCircle: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  completedDayHeaderCircle: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  missedDayHeaderCircle: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  dayHeaderNumber: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  activeDayHeaderNumber: {
    color: '#FFFFFF',
  },
  statusDayHeaderNumber: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
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
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
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
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  workoutsList: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  workoutItemContainer: {
    marginBottom: 12,
  },
  workoutItem: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedWorkoutItem: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
    transform: [{ scale: 1.02 }],
  },
  restDayItem: {
    opacity: 0.6,
    backgroundColor: colors.surfaceSecondary,
  },
  missedWorkoutItem: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  workoutItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workoutItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workoutDateContainer: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 50,
  },
  workoutDayShort: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workoutDayNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  workoutInfoContainer: {
    flex: 1,
  },
  workoutName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 6,
  },
  missedWorkoutName: {
    color: colors.textSecondary,
  },
  workoutStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  workoutStatus: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  missedWorkoutStatus: {
    color: colors.error,
  },
  completedWorkoutStatus: {
    color: colors.success,
  },
  workoutNotes: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragHandle: {
    padding: 8,
    marginLeft: 12,
  },
  instructionsContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  instructionsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  instructionsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});