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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Menu, RotateCcw, Clock, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Undo2 } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { WorkoutPlan, WorkoutTemplate, DayOfWeek } from '@/types/workout';
import { getClientPlans, getTemplate, savePlan } from '@/utils/storage';
import { getWeekDates } from '@/utils/workoutUtils';

interface WeeklyWorkout {
  date: string;
  dayName: string;
  dayNumber: number;
  dayShort: string;
  template: WorkoutTemplate | null;
  templateId: string | null;
  status: 'completed' | 'missed' | 'scheduled' | 'rest';
}

export default function TrainingCalendarScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [weeklyWorkouts, setWeeklyWorkouts] = useState<WeeklyWorkout[]>([]);
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [isRearrangeMode, setIsRearrangeMode] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    loadWeeklySchedule();
  }, []);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isRearrangeMode ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isRearrangeMode]);

  const loadWeeklySchedule = async () => {
    try {
      const clientId = 'client-1'; // TODO: Get from user context
      const plans = await getClientPlans(clientId);
      
      // Find active plan for this week
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      const activePlan = plans.find(plan => 
        plan.startDate <= todayString && plan.endDate >= todayString
      );

      if (activePlan) {
        setCurrentPlan(activePlan);
        
        // Generate this week's schedule
        const weekDates = getWeekDates(today);
        const weeklySchedule: WeeklyWorkout[] = [];
        
        const dayNames: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const shortDayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        
        for (let i = 0; i < 7; i++) {
          const dayName = dayNames[i];
          const date = weekDates[dayName];
          const dayNumber = new Date(date).getDate();
          const templateId = activePlan.schedule[dayName];
          
          let template = null;
          if (templateId) {
            template = await getTemplate(templateId);
          }
          
          // Determine status
          const isToday = date === todayString;
          const isPast = new Date(date) < new Date(todayString);
          let status: 'completed' | 'missed' | 'scheduled' | 'rest' = 'rest';
          
          if (templateId) {
            if (isPast) {
              // For demo purposes, randomly assign completed/missed
              status = Math.random() > 0.3 ? 'completed' : 'missed';
            } else if (isToday) {
              status = 'scheduled';
            } else {
              status = 'scheduled';
            }
          }
          
          weeklySchedule.push({
            date,
            dayName: shortDayNames[i],
            dayNumber,
            dayShort: dayName.substring(0, 3).toUpperCase(),
            template,
            templateId,
            status
          });
        }
        
        setWeeklyWorkouts(weeklySchedule);
      }
    } catch (error) {
      console.error('Error loading weekly schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRearrangeToggle = () => {
    if (isRearrangeMode) {
      // Save changes when exiting rearrange mode
      saveScheduleChanges();
    }
    setIsRearrangeMode(!isRearrangeMode);
    setSelectedItem(null);
  };

  const saveScheduleChanges = async () => {
    if (!currentPlan) return;

    try {
      const updatedSchedule: { [key: string]: string | null } = {};
      const dayNames: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      weeklyWorkouts.forEach((workout, index) => {
        const dayName = dayNames[index];
        updatedSchedule[dayName] = workout.templateId;
      });

      const updatedPlan: WorkoutPlan = {
        ...currentPlan,
        schedule: updatedSchedule,
        updatedAt: new Date().toISOString(),
      };

      await savePlan(updatedPlan);
      setCurrentPlan(updatedPlan);
      
      if (Platform.OS !== 'web') {
        // Add haptic feedback on mobile
        // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert('Success', 'Schedule updated successfully!');
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'Failed to save schedule changes');
    }
  };

  const handleWorkoutPress = (workout: WeeklyWorkout, index: number) => {
    if (isRearrangeMode) {
      if (selectedItem === null) {
        setSelectedItem(index);
      } else if (selectedItem === index) {
        setSelectedItem(null);
      } else {
        // Swap workouts
        const newWorkouts = [...weeklyWorkouts];
        const selectedWorkout = newWorkouts[selectedItem];
        const targetWorkout = newWorkouts[index];
        
        // Swap the template IDs and templates
        newWorkouts[selectedItem] = {
          ...selectedWorkout,
          template: targetWorkout.template,
          templateId: targetWorkout.templateId,
          status: targetWorkout.templateId ? selectedWorkout.status : 'rest'
        };
        
        newWorkouts[index] = {
          ...targetWorkout,
          template: selectedWorkout.template,
          templateId: selectedWorkout.templateId,
          status: selectedWorkout.templateId ? targetWorkout.status : 'rest'
        };
        
        setWeeklyWorkouts(newWorkouts);
        setSelectedItem(null);
      }
    } else {
      // Navigate to workout details
      if (workout.template) {
        router.push(`/training-day/${workout.date}?templateId=${workout.template.id}`);
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

  const getWorkoutStatusText = (workout: WeeklyWorkout) => {
    if (!workout.template) return '';
    
    switch (workout.status) {
      case 'completed':
        return `${workout.template.exercises.length} exercises`;
      case 'missed':
        return `Missed • ${workout.template.exercises.length} exercises`;
      case 'scheduled':
        return `${workout.template.exercises.length} exercises`;
      default:
        return '';
    }
  };

  const renderCalendarHeader = () => (
    <View style={styles.calendarHeader}>
      <View style={styles.weekContainer}>
        {weeklyWorkouts.map((workout, index) => (
          <View key={index} style={styles.dayHeaderContainer}>
            <Text style={styles.dayHeaderText}>{workout.dayName}</Text>
            <TouchableOpacity
              style={[
                styles.dayHeaderCircle,
                workout.template && styles.activeDayHeaderCircle,
                workout.status === 'completed' && styles.completedDayHeaderCircle,
                workout.status === 'missed' && styles.missedDayHeaderCircle
              ]}
              onPress={() => handleWorkoutPress(workout, index)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dayHeaderNumber,
                workout.template && styles.activeDayHeaderNumber,
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

  const renderWorkoutItem = (workout: WeeklyWorkout, index: number) => {
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
            !workout.template && styles.restDayItem,
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
                {workout.template?.name || 'Rest Day'}
              </Text>
              {workout.template && (
                <View style={styles.workoutStatusContainer}>
                  {getStatusIcon(workout.status)}
                  <Text style={[
                    styles.workoutStatus,
                    workout.status === 'missed' && styles.missedWorkoutStatus,
                    workout.status === 'completed' && styles.completedWorkoutStatus
                  ]}>
                    {getWorkoutStatusText(workout)}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {isRearrangeMode && (
            <View style={styles.dragHandle}>
              <Menu size={20} color={colors.textTertiary} />
            </View>
          )}
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
          {isRearrangeMode ? 'Rearrange' : 'Training'}
        </Text>
        
        <TouchableOpacity onPress={handleRearrangeToggle} style={styles.rearrangeButton}>
          {isRearrangeMode ? (
            <Text style={styles.rearrangeButtonText}>Done</Text>
          ) : (
            <Undo2 size={20} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar Header */}
        {!isRearrangeMode && renderCalendarHeader()}

        {/* Workout List */}
        <View style={styles.workoutsList}>
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
    fontSize: 18,
    color: colors.text,
    marginBottom: 6,
  },
  missedWorkoutName: {
    color: colors.textSecondary,
  },
  workoutStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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