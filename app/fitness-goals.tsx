import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Target, Calendar, TrendingUp, Clock, CircleCheck as CheckCircle, Circle, Filter, Search } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

interface FitnessGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  emoji: string;
  completed: boolean;
  createdAt: string;
}

// Sample goals data
const sampleGoals: FitnessGoal[] = [
  {
    id: '1',
    title: 'Lose 10kg for Summer',
    description: 'Get ready for beach season',
    category: 'weight',
    targetDate: '2025-08-15T00:00:00.000Z',
    targetValue: 70,
    currentValue: 75,
    unit: 'kg',
    emoji: '🏖️',
    completed: false,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'Run a Half Marathon',
    description: 'Complete my first 21km race',
    category: 'endurance',
    targetDate: '2025-09-20T00:00:00.000Z',
    targetValue: 21,
    currentValue: 8,
    unit: 'km',
    emoji: '🏃‍♂️',
    completed: false,
    createdAt: '2025-01-15T00:00:00.000Z',
  },
  {
    id: '3',
    title: 'Bench Press 100kg',
    description: 'Reach my strength goal',
    category: 'strength',
    targetDate: '2025-07-01T00:00:00.000Z',
    targetValue: 100,
    currentValue: 85,
    unit: 'kg',
    emoji: '💪',
    completed: true,
    createdAt: '2024-12-01T00:00:00.000Z',
  },
];

export default function FitnessGoalsScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [goals, setGoals] = useState<FitnessGoal[]>(sampleGoals);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredGoals = goals.filter(goal => {
    if (filter === 'active') return !goal.completed;
    if (filter === 'completed') return goal.completed;
    return true;
  });

  const getDaysRemaining = (targetDate: string) => {
    const now = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgressPercentage = (goal: FitnessGoal) => {
    if (!goal.targetValue || !goal.currentValue) return 0;
    
    if (goal.category === 'weight') {
      // For weight loss goals, calculate differently
      const startWeight = 80; // This should come from goal creation
      const totalToLose = startWeight - goal.targetValue;
      const currentLoss = startWeight - goal.currentValue;
      return Math.min((currentLoss / totalToLose) * 100, 100);
    }
    
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  };

  const handleGoalPress = (goalId: string) => {
    router.push(`/goal-countdown?goalId=${goalId}`);
  };

  const renderGoalCard = (goal: FitnessGoal) => {
    const daysRemaining = getDaysRemaining(goal.targetDate);
    const progress = getProgressPercentage(goal);
    const isOverdue = daysRemaining < 0 && !goal.completed;

    return (
      <TouchableOpacity
        key={goal.id}
        style={[
          styles.goalCard,
          goal.completed && styles.completedGoalCard,
          isOverdue && styles.overdueGoalCard
        ]}
        onPress={() => handleGoalPress(goal.id)}
      >
        <View style={styles.goalHeader}>
          <View style={styles.goalTitleContainer}>
            <Text style={styles.goalEmoji}>{goal.emoji}</Text>
            <View style={styles.goalTitleText}>
              <Text style={[styles.goalTitle, goal.completed && styles.completedText]}>
                {goal.title}
              </Text>
              <Text style={styles.goalDescription}>{goal.description}</Text>
            </View>
          </View>
          
          <View style={styles.goalStatus}>
            {goal.completed ? (
              <CheckCircle size={24} color={colors.success} />
            ) : (
              <Circle size={24} color={colors.textTertiary} />
            )}
          </View>
        </View>

        <View style={styles.goalMeta}>
          <View style={styles.metaItem}>
            <Calendar size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              {isOverdue 
                ? `${Math.abs(daysRemaining)} days overdue`
                : goal.completed 
                  ? 'Completed'
                  : `${daysRemaining} days left`
              }
            </Text>
          </View>
          
          {goal.targetValue && goal.currentValue && (
            <View style={styles.metaItem}>
              <TrendingUp size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>
                {goal.currentValue}/{goal.targetValue} {goal.unit}
              </Text>
            </View>
          )}
        </View>

        {goal.targetValue && goal.currentValue && !goal.completed && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progress}%`,
                    backgroundColor: isOverdue ? colors.error : colors.success
                  }
                ]} 
              />
            </View>
            <Text style={[
              styles.progressText,
              { color: isOverdue ? colors.error : colors.success }
            ]}>
              {progress.toFixed(0)}%
            </Text>
          </View>
        )}

        {goal.completed && (
          <View style={styles.completedBadge}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={styles.completedBadgeText}>Goal Achieved!</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Fitness Goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/set-fitness-goal')}
        >
          <Plus size={20} color={colors.primary} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All ({goals.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'active' && styles.activeFilterTab]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.activeFilterText]}>
            Active ({goals.filter(g => !g.completed).length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'completed' && styles.activeFilterTab]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.activeFilterText]}>
            Completed ({goals.filter(g => g.completed).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Goals List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredGoals.length === 0 ? (
          <View style={styles.emptyState}>
            <Target size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No goals found</Text>
            <Text style={styles.emptyText}>
              {filter === 'all' 
                ? 'Create your first fitness goal to get started!'
                : filter === 'active'
                  ? 'No active goals. Create a new goal or check completed ones.'
                  : 'No completed goals yet. Keep working towards your active goals!'
              }
            </Text>
            {filter === 'all' && (
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={() => router.push('/set-fitness-goal')}
              >
                <Text style={styles.createFirstButtonText}>Create Your First Goal</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredGoals.map(renderGoalCard)
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  addButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    margin: 20,
    borderRadius: 8,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeFilterTab: {
    backgroundColor: colors.surface,
  },
  filterText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeFilterText: {
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  completedGoalCard: {
    opacity: 0.8,
    borderWidth: 1,
    borderColor: colors.success,
  },
  overdueGoalCard: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  goalEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  goalTitleText: {
    flex: 1,
  },
  goalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  goalDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  goalStatus: {
    marginLeft: 12,
  },
  goalMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    minWidth: 40,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}15`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    gap: 6,
  },
  completedBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.success,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createFirstButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});