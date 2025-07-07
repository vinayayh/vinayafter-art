import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { useUserRole } from '@/contexts/UserContext';

// Import coaching views
import CoachingClientView from '@/components/coaching /CoachingClientVew';
import CoachingTrainerView from '@/components/coaching /CoachingTrainerView';

export default function CoachingScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const { userRole } = useUserRole();

  // Loading state while determining user role
  if (!userRole) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading coaching dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render appropriate view based on user role
  switch (userRole) {
    case 'client':
      return <CoachingClientView />;
    case 'trainer':
      return <CoachingTrainerView />;
    case 'nutritionist':
      // You can create a CoachingNutritionistView component later
      return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.defaultView}>
            <Text style={[styles.defaultText, { color: colors.text }]}>
              Nutritionist coaching view coming soon!
            </Text>
          </View>
        </SafeAreaView>
      );
    case 'admin':
    case 'hr':
      // You can create admin/hr coaching views later
      return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.defaultView}>
            <Text style={[styles.defaultText, { color: colors.text }]}>
              Admin coaching dashboard coming soon!
            </Text>
          </View>
        </SafeAreaView>
      );
    default:
      return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.defaultView}>
            <Text style={[styles.defaultText, { color: colors.text }]}>
              Coaching access not configured for role: {userRole}
            </Text>
          </View>
        </SafeAreaView>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  defaultView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  defaultText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
});