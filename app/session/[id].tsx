import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  MessageSquare,
  Phone,
  Video,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  X,
  Save,
  Copy,
  Share
} from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';

// Mock session data - in a real app, this would come from your database
const getSessionData = (id: string) => {
  const sessions = {
    '1': {
      id: '1',
      clientId: '1',
      clientName: 'Sarah Johnson',
      clientAvatar: '👩‍💼',
      clientEmail: 'sarah.johnson@email.com',
      clientPhone: '+1 (555) 123-4567',
      type: 'Strength Training',
      date: '2024-01-22',
      time: '10:00 AM',
      duration: 60,
      location: 'Gym A - Main Floor',
      status: 'scheduled',
      notes: 'Focus on upper body strength. Client mentioned shoulder discomfort last session, so avoid overhead movements.',
      goals: ['Increase bench press', 'Improve form', 'Build confidence'],
      exercises: [
        { name: 'Bench Press', sets: '3x8', weight: '45kg' },
        { name: 'Incline Dumbbell Press', sets: '3x10', weight: '15kg each' },
        { name: 'Seated Row', sets: '3x12', weight: '40kg' },
        { name: 'Lat Pulldown', sets: '3x10', weight: '35kg' },
        { name: 'Push-ups', sets: '2x15', weight: 'Bodyweight' },
      ],
      previousSessions: [
        { date: '2024-01-20', type: 'Upper Body', completed: true, rating: 4 },
        { date: '2024-01-18', type: 'HIIT Cardio', completed: true, rating: 5 },
        { date: '2024-01-16', type: 'Lower Body', completed: true, rating: 4 },
      ],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T15:30:00Z',
    },
    '2': {
      id: '2',
      clientId: '2',
      clientName: 'Mike Chen',
      clientAvatar: '👨‍💻',
      clientEmail: 'mike.chen@email.com',
      clientPhone: '+1 (555) 234-5678',
      type: 'HIIT Session',
      date: '2024-01-23',
      time: '2:00 PM',
      duration: 45,
      location: 'Studio B - HIIT Room',
      status: 'completed',
      notes: 'Excellent session! Client pushed through all intervals with great intensity.',
      goals: ['Improve cardiovascular endurance', 'Burn calories', 'Increase power'],
      exercises: [
        { name: 'Burpees', sets: '4x30s', weight: 'Bodyweight' },
        { name: 'Mountain Climbers', sets: '4x30s', weight: 'Bodyweight' },
        { name: 'Jump Squats', sets: '4x30s', weight: 'Bodyweight' },
        { name: 'High Knees', sets: '4x30s', weight: 'Bodyweight' },
        { name: 'Plank Hold', sets: '3x45s', weight: 'Bodyweight' },
      ],
      previousSessions: [
        { date: '2024-01-21', type: 'Strength', completed: true, rating: 5 },
        { date: '2024-01-19', type: 'HIIT', completed: true, rating: 4 },
        { date: '2024-01-17', type: 'Cardio', completed: true, rating: 4 },
      ],
      createdAt: '2024-01-16T14:00:00Z',
      updatedAt: '2024-01-23T15:00:00Z',
    }
  };
  
  return sessions[id as keyof typeof sessions] || null;
};

export default function SessionDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { id } = useLocalSearchParams();
  
  const [session, setSession] = useState(getSessionData(id as string));
  const [refreshing, setRefreshing] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    if (session) {
      setSessionNotes(session.notes);
      setSelectedStatus(session.status);
    }
  }, [session]);

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Session Not Found</Text>
          <Text style={styles.errorText}>The requested session could not be found.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleEditSession = () => {
    router.push(`/trainer/new-session?editSessionId=${session.id}`);
  };

  const handleDeleteSession = () => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Session deleted successfully');
            router.back();
          },
        },
      ]
    );
  };

  const handleDuplicateSession = () => {
    Alert.alert(
      'Duplicate Session',
      'Create a new session with the same details?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Duplicate',
          onPress: () => {
            router.push(`/trainer/new-session?duplicateSessionId=${session.id}`);
          },
        },
      ]
    );
  };

  const handleContactClient = (method: 'message' | 'call' | 'video') => {
    switch (method) {
      case 'message':
        router.push(`/chat/${session.clientId}`);
        break;
      case 'call':
        Alert.alert('Call Client', `Calling ${session.clientName}...`);
        break;
      case 'video':
        Alert.alert('Video Call', `Starting video call with ${session.clientName}...`);
        break;
    }
  };

  const handleUpdateStatus = () => {
    setSession(prev => prev ? { ...prev, status: selectedStatus } : null);
    setShowStatusModal(false);
    Alert.alert('Success', 'Session status updated successfully');
  };

  const handleSaveNotes = () => {
    setSession(prev => prev ? { ...prev, notes: sessionNotes } : null);
    setShowNotesModal(false);
    Alert.alert('Success', 'Session notes updated successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return colors.primary;
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      case 'no_show': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock size={16} color="#FFFFFF" />;
      case 'completed': return <CheckCircle size={16} color="#FFFFFF" />;
      case 'cancelled': return <XCircle size={16} color="#FFFFFF" />;
      case 'no_show': return <AlertCircle size={16} color="#FFFFFF" />;
      default: return <Clock size={16} color="#FFFFFF" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Details</Text>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            'Session Options',
            'Choose an action',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Edit Session', onPress: handleEditSession },
              { text: 'Duplicate Session', onPress: handleDuplicateSession },
              { text: 'Delete Session', style: 'destructive', onPress: handleDeleteSession },
            ]
          );
        }}>
          <MoreHorizontal size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Session Overview Card */}
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#1E293B', '#334155'] : ['#F8FAFC', '#E2E8F0']}
          style={styles.sessionCard}
        >
          <View style={styles.sessionHeader}>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionType}>{session.type}</Text>
              <Text style={styles.sessionDateTime}>
                {formatDate(session.date)} at {session.time}
              </Text>
              <View style={styles.sessionMeta}>
                <View style={styles.metaItem}>
                  <Clock size={16} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{session.duration} minutes</Text>
                </View>
                <View style={styles.metaItem}>
                  <MapPin size={16} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{session.location}</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.statusBadge, { backgroundColor: getStatusColor(session.status) }]}
              onPress={() => setShowStatusModal(true)}
            >
              {getStatusIcon(session.status)}
              <Text style={styles.statusText}>
                {session.status.charAt(0).toUpperCase() + session.status.slice(1).replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Client Information */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.clientCard}>
            <View style={styles.clientHeader}>
              <Text style={styles.clientAvatar}>{session.clientAvatar}</Text>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{session.clientName}</Text>
                <Text style={styles.clientEmail}>{session.clientEmail}</Text>
                <Text style={styles.clientPhone}>{session.clientPhone}</Text>
              </View>
            </View>
            
            <View style={styles.clientActions}>
              <TouchableOpacity 
                style={styles.clientActionButton}
                onPress={() => handleContactClient('message')}
              >
                <MessageSquare size={16} color={colors.primary} />
                <Text style={styles.clientActionText}>Message</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.clientActionButton}
                onPress={() => handleContactClient('call')}
              >
                <Phone size={16} color={colors.success} />
                <Text style={styles.clientActionText}>Call</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.clientActionButton}
                onPress={() => handleContactClient('video')}
              >
                <Video size={16} color={colors.warning} />
                <Text style={styles.clientActionText}>Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Session Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Goals</Text>
          <View style={styles.goalsList}>
            {session.goals.map((goal, index) => (
              <View key={index} style={styles.goalItem}>
                <View style={styles.goalBullet} />
                <Text style={styles.goalText}>{goal}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Planned Exercises */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Planned Exercises</Text>
          <View style={styles.exercisesList}>
            {session.exercises.map((exercise, index) => (
              <View key={index} style={styles.exerciseItem}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDetails}>
                    {exercise.sets} • {exercise.weight}
                  </Text>
                </View>
                <View style={styles.exerciseStatus}>
                  {session.status === 'completed' ? (
                    <CheckCircle size={20} color={colors.success} />
                  ) : (
                    <View style={styles.exerciseCheckbox} />
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Session Notes */}
        <View style={styles.section}>
          <View style={styles.notesHeader}>
            <Text style={styles.sectionTitle}>Session Notes</Text>
            <TouchableOpacity 
              style={styles.editNotesButton}
              onPress={() => setShowNotesModal(true)}
            >
              <Edit3 size={16} color={colors.primary} />
              <Text style={styles.editNotesText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.notesCard}>
            <Text style={styles.notesText}>
              {session.notes || 'No notes added for this session.'}
            </Text>
          </View>
        </View>

        {/* Previous Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Sessions with {session.clientName}</Text>
          <View style={styles.previousSessionsList}>
            {session.previousSessions.map((prevSession, index) => (
              <View key={index} style={styles.previousSessionItem}>
                <View style={styles.previousSessionInfo}>
                  <Text style={styles.previousSessionDate}>
                    {new Date(prevSession.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Text>
                  <Text style={styles.previousSessionType}>{prevSession.type}</Text>
                </View>
                
                <View style={styles.previousSessionStatus}>
                  {prevSession.completed ? (
                    <CheckCircle size={16} color={colors.success} />
                  ) : (
                    <XCircle size={16} color={colors.error} />
                  )}
                  <Text style={styles.previousSessionRating}>
                    {'★'.repeat(prevSession.rating)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowStatusModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Update Session Status</Text>
            <TouchableOpacity onPress={handleUpdateStatus}>
              <Save size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            {['scheduled', 'completed', 'cancelled', 'no_show'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  selectedStatus === status && styles.selectedStatusOption
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <View style={styles.statusOptionContent}>
                  {getStatusIcon(status)}
                  <Text style={[
                    styles.statusOptionText,
                    selectedStatus === status && styles.selectedStatusOptionText
                  ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </Text>
                </View>
                {selectedStatus === status && (
                  <CheckCircle size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Notes Edit Modal */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotesModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Session Notes</Text>
            <TouchableOpacity onPress={handleSaveNotes}>
              <Save size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.fieldLabel}>Session Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={sessionNotes}
              onChangeText={setSessionNotes}
              placeholder="Add notes about the session, client progress, observations, or any important details..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
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
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  sessionCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionInfo: {
    flex: 1,
    marginRight: 16,
  },
  sessionType: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 8,
  },
  sessionDateTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  sessionMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  clientSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  clientCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientAvatar: {
    fontSize: 32,
    marginRight: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  clientEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  clientPhone: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  clientActions: {
    flexDirection: 'row',
    gap: 12,
  },
  clientActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingVertical: 8,
    gap: 6,
  },
  clientActionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.text,
  },
  goalsList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  goalBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  goalText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  exercisesList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  exerciseDetails: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  exerciseStatus: {
    marginLeft: 12,
  },
  exerciseCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editNotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  editNotesText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  notesCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  notesText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  previousSessionsList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  previousSessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  previousSessionInfo: {
    flex: 1,
  },
  previousSessionDate: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  previousSessionType: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  previousSessionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previousSessionRating: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.warning,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedStatusOption: {
    backgroundColor: `${colors.primary}20`,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  statusOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusOptionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.text,
  },
  selectedStatusOptionText: {
    color: colors.primary,
    fontFamily: 'Inter-SemiBold',
  },
  fieldLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
});