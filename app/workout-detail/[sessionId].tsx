import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Settings, 
  Calendar,
  Play,
  X,
  Clock,
  Dumbbell,
  RotateCcw,
  Star,
  User,
  MapPin
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';
import { getWorkoutTemplate } from '@/lib/workoutTemplates';
import { getTrainingSession } from '@/lib/trainingSessionQueries';
import { TrainingSession, WorkoutTemplate } from '@/types/workout';

const { width, height } = Dimensions.get('window');

interface ExerciseWithDetails {
  id: string;
  name: string;
  sets: number;
  reps: string;
  image: string;
}

export default function WorkoutDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { sessionId } = useLocalSearchParams();

  const [trainingSession, setTrainingSession] = useState<TrainingSession | null>(null);
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [exercises, setExercises] = useState<ExerciseWithDetails[]>([]);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionDetails();
  }, []);

  const loadSessionDetails = async () => {
    try {
      setLoading(true);
      
      // Load training session
      const session = await getTrainingSession(sessionId as string);
      if (!session) {
        Alert.alert('Error', 'Training session not found', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }

      setTrainingSession(session);

      // Load template if session has one
      if (session.template_id) {
        const workoutTemplate = await getWorkoutTemplate(session.template_id);
        if (workoutTemplate) {
          setTemplate(workoutTemplate);
          
          // Transform exercises with additional details
          const exercisesWithDetails: ExerciseWithDetails[] = workoutTemplate.exercises.map((exercise, index) => ({
            id: exercise.exercise.id,
            name: exercise.exercise.name,
            sets: exercise.sets_config?.length || 0,
            reps: exercise.sets_config?.map(set => set.reps).join(', ') || '',
            image: getExerciseImage(exercise.exercise.name, index),
          }));
          
          setExercises(exercisesWithDetails);
        }
      } else {
        // Handle sessions without templates
        const basicExercises: ExerciseWithDetails[] = [{
          id: 'custom-1',
          name: session.type || 'Training Session',
          sets: 0,
          reps: 'Custom',
          image: getExerciseImage('training', 0),
        }];
        setExercises(basicExercises);
      }
    } catch (error) {
      console.error('Error loading session details:', error);
      Alert.alert('Error', 'Failed to load session details', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getExerciseImage = (exerciseName: string, index: number): string => {
    // Use different Pexels images for different exercises
    const images = [
      'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/3822356/pexels-photo-3822356.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&w=400',
    ];
    return images[index % images.length];
  };

  const handleStartWorkout = () => {
    if (trainingSession) {
      router.push(`/start-workout/${trainingSession.id}`);
    }
  };

  const handleReschedule = () => {
    setShowRescheduleModal(true);
  };

  const handleMoveToToday = () => {
    setShowRescheduleModal(false);
    Alert.alert('Success', 'Session moved to today!');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      case 'no_show': return colors.warning;
      default: return colors.primary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Scheduled';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'no_show': return 'No Show';
      default: return 'Unknown';
    }
  };

  const renderExerciseItem = (exercise: ExerciseWithDetails, index: number) => (
    <TouchableOpacity key={exercise.id} style={styles.exerciseItem}>
      <View style={styles.exerciseImageContainer}>
        <Image source={{ uri: exercise.image }} style={styles.exerciseImage} />
        <View style={styles.exercisePlayButton}>
          <Play size={16} color="#FFFFFF" />
        </View>
      </View>
      
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseDetails}>
          {exercise.reps ? `${exercise.reps} reps` : 'Custom reps'} • {exercise.sets} sets
        </Text>
      </View>
      
      <View style={styles.exerciseSets}>
        <Text style={styles.exerciseSetCount}>x{exercise.sets}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!trainingSession) {
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

  return (
    <View style={styles.container}>
      {/* Hero Section with Background Image */}
      <View style={styles.heroSection}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800' }}
          style={styles.heroImage}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.heroOverlay}
        >
          <SafeAreaView style={styles.heroContent}>
            {/* Header */}
            <View style={styles.heroHeader}>
              <TouchableOpacity onPress={() => router.back()} style={styles.heroBackButton}>
                <ArrowLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.heroActionButton}>
                  <RotateCcw size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroActionButton}>
                  <Settings size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Session Info */}
            <View style={styles.heroInfo}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trainingSession.status) }]}>
                <Text style={styles.statusText}>{getStatusText(trainingSession.status)}</Text>
              </View>
              <Text style={styles.heroTitle}>
                {template?.name || trainingSession.type || 'Training Session'}
              </Text>
              <Text style={styles.heroDescription}>
                {template?.description || 'Personal training session'}
              </Text>
              <View style={styles.sessionMeta}>
                <View style={styles.metaItem}>
                  <Calendar size={16} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.metaText}>{formatDate(trainingSession.scheduled_date)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Clock size={16} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.metaText}>{formatTime(trainingSession.scheduled_time)}</Text>
                </View>
                {trainingSession.location && (
                  <View style={styles.metaItem}>
                    <MapPin size={16} color="rgba(255, 255, 255, 0.8)" />
                    <Text style={styles.metaText}>{trainingSession.location}</Text>
                  </View>
                )}
              </View>
              {trainingSession.status === 'scheduled' && (
                <TouchableOpacity style={styles.startWorkoutButton} onPress={handleStartWorkout}>
                  <Play size={16} color="#FFFFFF" />
                  <Text style={styles.startWorkoutText}>Start Session</Text>
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Session Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Details</Text>
          <View style={styles.sessionInfoGrid}>
            <View style={styles.sessionInfoItem}>
              <Clock size={20} color={colors.primary} />
              <Text style={styles.sessionInfoLabel}>Duration</Text>
              <Text style={styles.sessionInfoValue}>
                {trainingSession.duration_minutes || template?.estimated_duration_minutes || 60} min
              </Text>
            </View>
            <View style={styles.sessionInfoItem}>
              <Dumbbell size={20} color={colors.success} />
              <Text style={styles.sessionInfoLabel}>Exercises</Text>
              <Text style={styles.sessionInfoValue}>{exercises.length}</Text>
            </View>
            <View style={styles.sessionInfoItem}>
              <User size={20} color={colors.warning} />
              <Text style={styles.sessionInfoLabel}>Type</Text>
              <Text style={styles.sessionInfoValue}>{trainingSession.type}</Text>
            </View>
          </View>
        </View>

        {/* Session Rating (if completed) */}
        {trainingSession.status === 'completed' && trainingSession.session_rating && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Rating</Text>
            <View style={styles.ratingContainer}>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={24}
                    color={star <= trainingSession.session_rating! ? colors.warning : colors.border}
                    fill={star <= trainingSession.session_rating! ? colors.warning : 'transparent'}
                  />
                ))}
              </View>
              <Text style={styles.ratingText}>
                {trainingSession.session_rating}/5 stars
              </Text>
            </View>
          </View>
        )}

        {/* Exercises Section */}
        {exercises.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exercises</Text>
            {exercises.map(renderExerciseItem)}
          </View>
        )}

        {/* Session Notes */}
        {(trainingSession.notes || trainingSession.trainer_notes) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            {trainingSession.notes && (
              <View style={styles.noteCard}>
                <Text style={styles.noteTitle}>Session Notes</Text>
                <Text style={styles.noteText}>{trainingSession.notes}</Text>
              </View>
            )}
            {trainingSession.trainer_notes && (
              <View style={styles.noteCard}>
                <Text style={styles.noteTitle}>Trainer Notes</Text>
                <Text style={styles.noteText}>{trainingSession.trainer_notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Client Feedback */}
        {trainingSession.client_feedback && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client Feedback</Text>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>{trainingSession.client_feedback}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Reschedule Modal */}
      <Modal
        visible={showRescheduleModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Calendar size={32} color={colors.primary} />
            </View>
            
            <Text style={styles.modalTitle}>Reschedule Session</Text>
            <Text style={styles.modalMessage}>
              Do you want to move this session to today?
            </Text>
            
            <TouchableOpacity style={styles.modalButton} onPress={handleMoveToToday}>
              <Text style={styles.modalButtonText}>Move to today</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowRescheduleModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowRescheduleModal(false)}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  heroSection: {
    height: height * 0.5,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  heroBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  heroActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  heroTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 38,
  },
  heroDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
    lineHeight: 22,
  },
  sessionMeta: {
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignSelf: 'flex-start',
  },
  startWorkoutText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  sessionInfoGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  sessionInfoItem: {
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
  sessionInfoLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  sessionInfoValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.text,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  ratingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  exerciseImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  exerciseImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  exercisePlayButton: {
    position: 'absolute',
    top: 22,
    left: 22,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  exerciseDetails: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  exerciseSets: {
    alignItems: 'center',
  },
  exerciseSetCount: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.text,
  },
  noteCard: {
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
  noteTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  noteText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  modalButton: {
    backgroundColor: colors.textSecondary,
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    marginBottom: 16,
  },
  modalButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalCancelText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});