import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Users, 
  Calendar, 
  TrendingUp,
  Clock,
  MessageSquare,
  Plus,
  Star,
  Activity,
  Phone,
  Video,
  MapPin,
  Edit3,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  Bell,
  Target,
  Award,
  Zap,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { useTodayDataNew } from '../../hooks/useTodayDataNew';
import { TodayTrainerData } from '../../lib/todayQueries';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

// Enhanced mock data for better demonstration
const enhancedTrainerData = {
  profile: {
    id: 'trainer-1',
    full_name: 'Mike Johnson',
    email: 'mike@vinayfit.com',
    role: 'trainer',
  },
  trainingSessions: [
    {
      id: '1',
      client_id: '1',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '10:00',
      duration_minutes: 60,
      type: 'Strength Training',
      status: 'scheduled',
      location: 'Gym A',
      notes: 'Focus on upper body',
      client: {
        id: '1',
        full_name: 'Sarah Johnson',
        email: 'sarah@example.com',
        avatar: '👩‍💼'
      }
    },
    {
      id: '2',
      client_id: '2',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '14:00',
      duration_minutes: 45,
      type: 'HIIT Session',
      status: 'completed',
      location: 'Studio B',
      notes: 'Great energy today',
      client: {
        id: '2',
        full_name: 'Mike Chen',
        email: 'mike@example.com',
        avatar: '👨‍💻'
      }
    },
    {
      id: '3',
      client_id: '3',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '16:30',
      duration_minutes: 60,
      type: 'Personal Training',
      status: 'scheduled',
      location: 'Gym A',
      notes: 'New client assessment',
      client: {
        id: '3',
        full_name: 'Emma Wilson',
        email: 'emma@example.com',
        avatar: '👩‍🎨'
      }
    }
  ],
  clients: [
    {
      id: '1',
      full_name: 'Sarah Johnson',
      email: 'sarah@example.com',
      avatar: '👩‍💼',
      lastWorkout: '2 days ago',
      streak: 7,
      compliance: 92
    },
    {
      id: '2',
      full_name: 'Mike Chen',
      email: 'mike@example.com',
      avatar: '👨‍💻',
      lastWorkout: 'Today',
      streak: 12,
      compliance: 97
    },
    {
      id: '3',
      full_name: 'Emma Wilson',
      email: 'emma@example.com',
      avatar: '👩‍🎨',
      lastWorkout: '1 week ago',
      streak: 0,
      compliance: 45
    },
    {
      id: '4',
      full_name: 'Alex Rodriguez',
      email: 'alex@example.com',
      avatar: '👨‍🎯',
      lastWorkout: 'Yesterday',
      streak: 5,
      compliance: 82
    }
  ]
};

export default function TodayTrainerViewNew() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { data, loading, error, refreshData } = useTodayDataNew();

  // Use enhanced mock data for better demonstration
  const trainerData = data as TodayTrainerData || enhancedTrainerData;

  const [showQuickNotes, setShowQuickNotes] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [quickNotes, setQuickNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    }).toUpperCase();
  };

  const userName = trainerData?.profile?.full_name?.split(' ')[0] || 'Trainer';
  const todaysSessions = trainerData?.trainingSessions?.length || 0;
  const completedSessions = trainerData?.trainingSessions?.filter(s => s.status === 'completed').length || 0;
  const activeClients = trainerData?.clients?.length || 0;

  const upcomingSessions = trainerData?.trainingSessions?.filter(s => s.status === 'scheduled') || [];
  const recentlyCompleted = trainerData?.trainingSessions?.filter(s => s.status === 'completed') || [];

  // Enhanced navigation handlers
  const handleViewAllSessions = () => {
    router.push('/trainer/sessions');
  };

  const handleNewSession = () => {
    router.push('/trainer/new-session');
  };

  const handleViewClients = () => {
    router.push('/trainer/clients');
  };

  const handleMessages = () => {
    router.push('/trainer/messages');
  };

  const handleSessionPress = (session: any) => {
    router.push(`/session/${session.id}`);
  };

  const handleClientPress = (client: any) => {
    router.push(`/client-detail/${client.id}`);
  };

  const handleQuickSchedule = (clientId: string) => {
    router.push(`/trainer/new-session?clientId=${clientId}`);
  };

  const handleContactClient = (client: any, method: 'message' | 'call' | 'video') => {
    switch (method) {
      case 'message':
        router.push(`/chat/${client.id}`);
        break;
      case 'call':
        Alert.alert('Call Client', `Calling ${client.full_name}...`);
        break;
      case 'video':
        Alert.alert('Video Call', `Starting video call with ${client.full_name}...`);
        break;
    }
  };

  const handleQuickNotes = (session: any) => {
    setSelectedSession(session);
    setQuickNotes('');
    setShowQuickNotes(true);
  };

  const handleSaveQuickNotes = () => {
    if (quickNotes.trim()) {
      Alert.alert('Success', 'Session notes saved successfully');
      setShowQuickNotes(false);
      setQuickNotes('');
      setSelectedSession(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return colors.primary;
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      case 'no_show': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load data</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: colors.background }]} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.dateText}>{getCurrentDate()}</Text>
            <Text style={styles.greetingText}>
              Good Morning, {userName}! 💪
            </Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={20} color={colors.textSecondary} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Today's Overview */}
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#BE185D', '#BE123C'] : ['#F093FB', '#F5576C']}
          style={styles.overviewCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.overviewContent}>
            <Text style={styles.overviewLabel}>TODAY'S SESSIONS</Text>
            <Text style={styles.overviewNumber}>
              {completedSessions}/{todaysSessions}
            </Text>
            <Text style={styles.overviewMessage}>
              {todaysSessions - completedSessions} sessions remaining
            </Text>
            <TouchableOpacity style={styles.overviewButton} onPress={handleNewSession}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.overviewButtonText}>Schedule New</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statCard} onPress={handleViewClients}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Users size={24} color={colors.primary} />
            </View>
            <Text style={styles.statNumber}>{activeClients}</Text>
            <Text style={styles.statLabel}>Active Clients</Text>
            <ChevronRight size={16} color={colors.textTertiary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statCard} onPress={handleViewAllSessions}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
              <TrendingUp size={24} color={colors.success} />
            </View>
            <Text style={styles.statNumber}>92%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
            <ChevronRight size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Upcoming Sessions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Upcoming Sessions</Text>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.cardActionButton} onPress={handleNewSession}>
                <Plus size={16} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.cardActionButton} onPress={handleViewAllSessions}>
                <Calendar size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {upcomingSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={32} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No upcoming sessions today</Text>
              <TouchableOpacity style={styles.emptyActionButton} onPress={handleNewSession}>
                <Text style={styles.emptyActionText}>Schedule First Session</Text>
              </TouchableOpacity>
            </View>
          ) : (
            upcomingSessions.map((session) => (
              <TouchableOpacity 
                key={session.id} 
                style={styles.sessionItem}
                onPress={() => handleSessionPress(session)}
              >
                <View style={styles.sessionTime}>
                  <Clock size={16} color={colors.textSecondary} />
                  <Text style={styles.sessionTimeText}>{formatTime(session.scheduled_time)}</Text>
                </View>
                
                <View style={styles.sessionInfo}>
                  <View style={styles.sessionHeader}>
                    <Text style={styles.sessionClient}>
                      {session.client?.full_name || 'Unknown Client'}
                    </Text>
                    <View style={[
                      styles.sessionStatusBadge,
                      { backgroundColor: getSessionStatusColor(session.status) }
                    ]}>
                      <Text style={styles.sessionStatusText}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.sessionType}>{session.type}</Text>
                  
                  <View style={styles.sessionMeta}>
                    {session.location && (
                      <View style={styles.sessionMetaItem}>
                        <MapPin size={12} color={colors.textTertiary} />
                        <Text style={styles.sessionMetaText}>{session.location}</Text>
                      </View>
                    )}
                    <View style={styles.sessionMetaItem}>
                      <Clock size={12} color={colors.textTertiary} />
                      <Text style={styles.sessionMetaText}>{session.duration_minutes} min</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.sessionActions}>
                  <TouchableOpacity 
                    style={styles.sessionActionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleContactClient(session.client, 'message');
                    }}
                  >
                    <MessageSquare size={16} color={colors.primary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.sessionActionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleQuickNotes(session);
                    }}
                  >
                    <Edit3 size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recently Completed Sessions */}
        {recentlyCompleted.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recently Completed</Text>
              <CheckCircle size={20} color={colors.success} />
            </View>
            
            {recentlyCompleted.map((session) => (
              <TouchableOpacity 
                key={session.id} 
                style={styles.completedSessionItem}
                onPress={() => handleSessionPress(session)}
              >
                <View style={styles.completedSessionInfo}>
                  <Text style={styles.completedSessionClient}>
                    {session.client?.full_name || 'Unknown Client'}
                  </Text>
                  <Text style={styles.completedSessionType}>{session.type}</Text>
                  <Text style={styles.completedSessionTime}>
                    Completed at {formatTime(session.scheduled_time)}
                  </Text>
                </View>
                
                <View style={styles.completedSessionBadge}>
                  <CheckCircle size={16} color={colors.success} />
                  <Text style={styles.completedSessionText}>Done</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Client Activity */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Your Clients</Text>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.cardActionButton} onPress={handleViewClients}>
                <Users size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {trainerData?.clients?.length === 0 ? (
            <Text style={styles.emptyText}>No clients assigned yet</Text>
          ) : (
            trainerData?.clients?.slice(0, 4).map((client) => (
              <TouchableOpacity 
                key={client.id} 
                style={styles.clientItem}
                onPress={() => handleClientPress(client)}
              >
                <View style={styles.clientLeft}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>
                      {client.avatar || client.full_name?.charAt(0) || '?'}
                    </Text>
                  </View>
                  
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{client.full_name || 'Unknown'}</Text>
                    <Text style={styles.clientEmail}>{client.email}</Text>
                    <View style={styles.clientStats}>
                      <Text style={styles.clientStat}>
                        Last: {client.lastWorkout || 'Never'}
                      </Text>
                      {client.streak > 0 && (
                        <View style={styles.streakBadge}>
                          <Zap size={10} color="#FFFFFF" />
                          <Text style={styles.streakText}>{client.streak}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                
                <View style={styles.clientActions}>
                  <TouchableOpacity 
                    style={styles.clientActionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleQuickSchedule(client.id);
                    }}
                  >
                    <Plus size={14} color={colors.primary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.clientActionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleContactClient(client, 'message');
                    }}
                  >
                    <MessageSquare size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
          
          {(trainerData?.clients?.length || 0) > 4 && (
            <TouchableOpacity style={styles.viewAllButton} onPress={handleViewClients}>
              <Text style={styles.viewAllText}>
                View All Clients ({trainerData?.clients?.length})
              </Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={handleNewSession}>
              <Plus size={20} color={colors.primary} />
              <Text style={styles.actionText}>New Session</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleViewClients}>
              <Users size={20} color={colors.success} />
              <Text style={styles.actionText}>View Clients</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleMessages}>
              <MessageSquare size={20} color={colors.warning} />
              <Text style={styles.actionText}>Messages</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/templates')}>
              <Target size={20} color={colors.error} />
              <Text style={styles.actionText}>Templates</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Quick Notes Modal */}
      <Modal
        visible={showQuickNotes}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQuickNotes(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowQuickNotes(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Quick Notes</Text>
            <TouchableOpacity onPress={handleSaveQuickNotes}>
              <Save size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            {selectedSession && (
              <View style={styles.sessionSummary}>
                <Text style={styles.sessionSummaryTitle}>
                  {selectedSession.client?.full_name} - {selectedSession.type}
                </Text>
                <Text style={styles.sessionSummaryTime}>
                  {formatTime(selectedSession.scheduled_time)} • {selectedSession.duration_minutes} min
                </Text>
              </View>
            )}
            
            <Text style={styles.fieldLabel}>Session Notes</Text>
            <TextInput
              style={styles.textArea}
              value={quickNotes}
              onChangeText={setQuickNotes}
              placeholder="Add notes about the session, client progress, or observations..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={6}
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
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerContent: {
    flex: 1,
  },
  dateText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  greetingText: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: colors.text,
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  overviewCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 24,
  },
  overviewContent: {
    alignItems: 'flex-start',
  },
  overviewLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  overviewNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  overviewMessage: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  overviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  overviewButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 16,
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
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cardActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyActionButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyActionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sessionTime: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  sessionTimeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  sessionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionClient: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  sessionStatusBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sessionStatusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  sessionType: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionMetaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.textTertiary,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  sessionActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedSessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  completedSessionInfo: {
    flex: 1,
  },
  completedSessionClient: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  completedSessionType: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  completedSessionTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.textTertiary,
  },
  completedSessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}15`,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completedSessionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: colors.success,
    marginLeft: 4,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  clientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientAvatarText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  clientEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  clientStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientStat: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.textTertiary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  streakText: {
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    color: '#FFFFFF',
    marginLeft: 2,
  },
  clientActions: {
    flexDirection: 'row',
    gap: 8,
  },
  clientActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  viewAllText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
    marginRight: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
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
  sessionSummary: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  sessionSummaryTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  sessionSummaryTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  fieldLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
});