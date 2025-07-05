import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Plus, 
  Camera, 
  Clock,
  UtensilsCrossed,
  Calendar,
  X,
  Search,
  Zap,
  Droplets,
  Target,
  TrendingUp
} from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FoodEntry {
  id: string;
  description: string;
  time: string;
  date: string;
  photo?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

interface DayEntry {
  date: string;
  displayDate: string;
  entries: FoodEntry[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const STORAGE_KEY = '@food_journal';
const GOALS_KEY = '@nutrition_goals';

const mealTypes = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🌅', color: '#F59E0B' },
  { id: 'lunch', label: 'Lunch', emoji: '☀️', color: '#10B981' },
  { id: 'dinner', label: 'Dinner', emoji: '🌙', color: '#8B5CF6' },
  { id: 'snack', label: 'Snack', emoji: '🍎', color: '#EF4444' },
];

export default function FoodJournalScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showNutritionGoals, setShowNutritionGoals] = useState(false);
  const [mealDescription, setMealDescription] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [foodEntries, setFoodEntries] = useState<DayEntry[]>([]);
  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoals>({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
  });
  const [goalCalories, setGoalCalories] = useState('2000');
  const [goalProtein, setGoalProtein] = useState('150');
  const [goalCarbs, setGoalCarbs] = useState('250');
  const [goalFat, setGoalFat] = useState('65');

  useEffect(() => {
    loadFoodEntries();
    loadNutritionGoals();
    setCurrentTime();
  }, []);

  const loadFoodEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFoodEntries(JSON.parse(stored));
      } else {
        generateSampleData();
      }
    } catch (error) {
      console.error('Error loading food entries:', error);
      generateSampleData();
    }
  };

  const loadNutritionGoals = async () => {
    try {
      const stored = await AsyncStorage.getItem(GOALS_KEY);
      if (stored) {
        const goals = JSON.parse(stored);
        setNutritionGoals(goals);
        setGoalCalories(goals.calories.toString());
        setGoalProtein(goals.protein.toString());
        setGoalCarbs(goals.carbs.toString());
        setGoalFat(goals.fat.toString());
      }
    } catch (error) {
      console.error('Error loading nutrition goals:', error);
    }
  };

  const saveNutritionGoals = async () => {
    try {
      const goals = {
        calories: parseInt(goalCalories) || 2000,
        protein: parseInt(goalProtein) || 150,
        carbs: parseInt(goalCarbs) || 250,
        fat: parseInt(goalFat) || 65,
      };
      setNutritionGoals(goals);
      await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
      setShowNutritionGoals(false);
    } catch (error) {
      console.error('Error saving nutrition goals:', error);
    }
  };

  const generateSampleData = () => {
    const today = new Date();
    const entries: DayEntry[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const dayEntry: DayEntry = {
        date: date.toISOString().split('T')[0],
        displayDate: i === 0 ? 'TODAY' : date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }).toUpperCase(),
        entries: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
      };

      // Add some sample entries for recent days
      if (i === 0) {
        dayEntry.entries = [
          {
            id: `entry-${i}-1`,
            description: 'Greek yogurt with berries and granola',
            time: '8:30 AM',
            date: dayEntry.date,
            mealType: 'breakfast',
            calories: 320,
            protein: 18,
            carbs: 45,
            fat: 8,
          },
          {
            id: `entry-${i}-2`,
            description: 'Grilled chicken salad with quinoa',
            time: '12:45 PM',
            date: dayEntry.date,
            mealType: 'lunch',
            calories: 450,
            protein: 35,
            carbs: 30,
            fat: 15,
          },
        ];
      } else if (i === 1) {
        dayEntry.entries = [
          {
            id: `entry-${i}-1`,
            description: 'Oatmeal with banana and almonds',
            time: '7:45 AM',
            date: dayEntry.date,
            mealType: 'breakfast',
            calories: 280,
            protein: 12,
            carbs: 48,
            fat: 8,
          },
          {
            id: `entry-${i}-2`,
            description: 'Turkey and avocado wrap',
            time: '1:15 PM',
            date: dayEntry.date,
            mealType: 'lunch',
            calories: 380,
            protein: 25,
            carbs: 35,
            fat: 18,
          },
          {
            id: `entry-${i}-3`,
            description: 'Salmon with roasted vegetables',
            time: '7:30 PM',
            date: dayEntry.date,
            mealType: 'dinner',
            calories: 520,
            protein: 40,
            carbs: 25,
            fat: 28,
          },
        ];
      }

      // Calculate totals
      dayEntry.totalCalories = dayEntry.entries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
      dayEntry.totalProtein = dayEntry.entries.reduce((sum, entry) => sum + (entry.protein || 0), 0);
      dayEntry.totalCarbs = dayEntry.entries.reduce((sum, entry) => sum + (entry.carbs || 0), 0);
      dayEntry.totalFat = dayEntry.entries.reduce((sum, entry) => sum + (entry.fat || 0), 0);

      entries.push(dayEntry);
    }

    setFoodEntries(entries);
  };

  const setCurrentTime = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    setSelectedTime(timeString);
  };

  const handleAddMeal = async () => {
    if (!mealDescription.trim()) {
      Alert.alert('Error', 'Please describe what you ate');
      return;
    }

    const newEntry: FoodEntry = {
      id: Date.now().toString(),
      description: mealDescription.trim(),
      time: selectedTime,
      date: new Date().toISOString().split('T')[0],
      mealType: selectedMealType,
      calories: parseInt(calories) || undefined,
      protein: parseInt(protein) || undefined,
      carbs: parseInt(carbs) || undefined,
      fat: parseInt(fat) || undefined,
    };

    try {
      const updatedEntries = [...foodEntries];
      const todayIndex = updatedEntries.findIndex(day => day.displayDate === 'TODAY');
      
      if (todayIndex >= 0) {
        updatedEntries[todayIndex].entries.unshift(newEntry);
        // Recalculate totals
        const todayEntries = updatedEntries[todayIndex].entries;
        updatedEntries[todayIndex].totalCalories = todayEntries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
        updatedEntries[todayIndex].totalProtein = todayEntries.reduce((sum, entry) => sum + (entry.protein || 0), 0);
        updatedEntries[todayIndex].totalCarbs = todayEntries.reduce((sum, entry) => sum + (entry.carbs || 0), 0);
        updatedEntries[todayIndex].totalFat = todayEntries.reduce((sum, entry) => sum + (entry.fat || 0), 0);
      }

      setFoodEntries(updatedEntries);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));

      // Reset form
      setMealDescription('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setShowAddMeal(false);
      setCurrentTime();
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', 'Failed to save meal');
    }
  };

  const handleAddPhoto = () => {
    if (Platform.OS === 'web') {
      Alert.alert('Photo Upload', 'Photo upload would be available on mobile devices');
    } else {
      Alert.alert('Add Photo', 'Camera functionality would open here');
    }
  };

  const getMealTypeColor = (mealType: string) => {
    const meal = mealTypes.find(m => m.id === mealType);
    return meal?.color || colors.primary;
  };

  const getMealTypeEmoji = (mealType: string) => {
    const meal = mealTypes.find(m => m.id === mealType);
    return meal?.emoji || '🍽️';
  };

  const getTodayData = () => {
    const today = foodEntries.find(day => day.displayDate === 'TODAY');
    return today || {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    };
  };

  const todayData = getTodayData();

  const renderNutritionProgress = (current: number, goal: number, label: string, unit: string, color: string) => {
    const percentage = Math.min((current / goal) * 100, 100);
    
    return (
      <View style={styles.nutritionItem}>
        <View style={styles.nutritionHeader}>
          <Text style={styles.nutritionLabel}>{label}</Text>
          <Text style={styles.nutritionValue}>
            {current}{unit} / {goal}{unit}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${percentage}%`, backgroundColor: color }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{Math.round(percentage)}%</Text>
      </View>
    );
  };

  const renderDayEntry = (dayEntry: DayEntry) => (
    <View key={dayEntry.date} style={styles.daySection}>
      <View style={styles.dayHeader}>
        <View style={styles.dayIndicator} />
        <Text style={styles.dayLabel}>{dayEntry.displayDate}</Text>
        {dayEntry.displayDate === 'TODAY' && dayEntry.totalCalories > 0 && (
          <Text style={styles.dayCalories}>{dayEntry.totalCalories} cal</Text>
        )}
      </View>
      
      {dayEntry.entries.length === 0 ? (
        <View style={styles.emptyDay}>
          <Text style={styles.emptyDayText}>No meals logged</Text>
        </View>
      ) : (
        dayEntry.entries.map((entry) => (
          <View key={entry.id} style={styles.mealEntry}>
            <View style={styles.mealHeader}>
              <View style={styles.mealTypeContainer}>
                <Text style={styles.mealEmoji}>{getMealTypeEmoji(entry.mealType)}</Text>
                <View style={[styles.mealTypeBadge, { backgroundColor: getMealTypeColor(entry.mealType) }]}>
                  <Text style={styles.mealTypeText}>
                    {mealTypes.find(m => m.id === entry.mealType)?.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.mealTime}>{entry.time}</Text>
            </View>
            
            <Text style={styles.mealDescription}>{entry.description}</Text>
            
            {(entry.calories || entry.protein || entry.carbs || entry.fat) && (
              <View style={styles.nutritionInfo}>
                {entry.calories && (
                  <View style={styles.nutritionBadge}>
                    <Zap size={12} color={colors.warning} />
                    <Text style={styles.nutritionBadgeText}>{entry.calories} cal</Text>
                  </View>
                )}
                {entry.protein && (
                  <View style={styles.nutritionBadge}>
                    <Text style={styles.nutritionBadgeText}>{entry.protein}g protein</Text>
                  </View>
                )}
                {entry.carbs && (
                  <View style={styles.nutritionBadge}>
                    <Text style={styles.nutritionBadgeText}>{entry.carbs}g carbs</Text>
                  </View>
                )}
                {entry.fat && (
                  <View style={styles.nutritionBadge}>
                    <Text style={styles.nutritionBadgeText}>{entry.fat}g fat</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Food Journal</Text>
        <TouchableOpacity onPress={() => setShowAddMeal(true)} style={styles.addButton}>
          <Plus size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Today's Nutrition Overview */}
      <View style={styles.nutritionOverview}>
        <View style={styles.overviewHeader}>
          <Text style={styles.overviewTitle}>Today's Nutrition</Text>
          <TouchableOpacity onPress={() => setShowNutritionGoals(true)}>
            <Target size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.nutritionGrid}>
          {renderNutritionProgress(todayData.totalCalories, nutritionGoals.calories, 'Calories', '', colors.primary)}
          {renderNutritionProgress(todayData.totalProtein, nutritionGoals.protein, 'Protein', 'g', colors.success)}
          {renderNutritionProgress(todayData.totalCarbs, nutritionGoals.carbs, 'Carbs', 'g', colors.warning)}
          {renderNutritionProgress(todayData.totalFat, nutritionGoals.fat, 'Fat', 'g', colors.error)}
        </View>
      </View>

      {/* Timeline */}
      <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
        {foodEntries.map(renderDayEntry)}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Meal Modal */}
      <Modal
        visible={showAddMeal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddMeal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddMeal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add meal</Text>
            <TouchableOpacity 
              onPress={handleAddMeal}
              style={[
                styles.postButton,
                !mealDescription.trim() && styles.postButtonDisabled
              ]}
              disabled={!mealDescription.trim()}
            >
              <Text style={[
                styles.postButtonText,
                !mealDescription.trim() && styles.postButtonTextDisabled
              ]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Meal Type Selection */}
            <Text style={styles.sectionLabel}>Meal Type</Text>
            <View style={styles.mealTypeGrid}>
              {mealTypes.map((mealType) => (
                <TouchableOpacity
                  key={mealType.id}
                  style={[
                    styles.mealTypeOption,
                    selectedMealType === mealType.id && styles.selectedMealType,
                    { borderColor: mealType.color }
                  ]}
                  onPress={() => setSelectedMealType(mealType.id as any)}
                >
                  <Text style={styles.mealTypeEmoji}>{mealType.emoji}</Text>
                  <Text style={[
                    styles.mealTypeLabel,
                    selectedMealType === mealType.id && { color: mealType.color }
                  ]}>
                    {mealType.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <Text style={styles.sectionLabel}>What did you eat?</Text>
            <TextInput
              style={styles.mealInput}
              value={mealDescription}
              onChangeText={setMealDescription}
              placeholder="Describe your meal..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoFocus
            />

            {/* Nutrition Information */}
            <Text style={styles.sectionLabel}>Nutrition (Optional)</Text>
            <View style={styles.nutritionInputGrid}>
              <View style={styles.nutritionInputItem}>
                <Text style={styles.nutritionInputLabel}>Calories</Text>
                <TextInput
                  style={styles.nutritionInput}
                  value={calories}
                  onChangeText={setCalories}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.nutritionInputItem}>
                <Text style={styles.nutritionInputLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.nutritionInput}
                  value={protein}
                  onChangeText={setProtein}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.nutritionInputItem}>
                <Text style={styles.nutritionInputLabel}>Carbs (g)</Text>
                <TextInput
                  style={styles.nutritionInput}
                  value={carbs}
                  onChangeText={setCarbs}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.nutritionInputItem}>
                <Text style={styles.nutritionInputLabel}>Fat (g)</Text>
                <TextInput
                  style={styles.nutritionInput}
                  value={fat}
                  onChangeText={setFat}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.mealActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleAddPhoto}>
                <Camera size={20} color={colors.textSecondary} />
                <Text style={styles.actionButtonText}>Add photo</Text>
              </TouchableOpacity>

              <View style={styles.timeDisplay}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={styles.timeText}>{selectedTime}</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Nutrition Goals Modal */}
      <Modal
        visible={showNutritionGoals}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNutritionGoals(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNutritionGoals(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nutrition Goals</Text>
            <TouchableOpacity onPress={saveNutritionGoals} style={styles.postButton}>
              <Text style={styles.postButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.goalsDescription}>
              Set your daily nutrition targets to track your progress
            </Text>

            <View style={styles.goalInputGrid}>
              <View style={styles.goalInputItem}>
                <Text style={styles.goalInputLabel}>Daily Calories</Text>
                <TextInput
                  style={styles.goalInput}
                  value={goalCalories}
                  onChangeText={setGoalCalories}
                  placeholder="2000"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.goalInputItem}>
                <Text style={styles.goalInputLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.goalInput}
                  value={goalProtein}
                  onChangeText={setGoalProtein}
                  placeholder="150"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.goalInputItem}>
                <Text style={styles.goalInputLabel}>Carbs (g)</Text>
                <TextInput
                  style={styles.goalInput}
                  value={goalCarbs}
                  onChangeText={setGoalCarbs}
                  placeholder="250"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.goalInputItem}>
                <Text style={styles.goalInputLabel}>Fat (g)</Text>
                <TextInput
                  style={styles.goalInput}
                  value={goalFat}
                  onChangeText={setGoalFat}
                  placeholder="65"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>
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
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutritionOverview: {
    backgroundColor: colors.surface,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  nutritionGrid: {
    gap: 12,
  },
  nutritionItem: {
    marginBottom: 8,
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nutritionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
  },
  nutritionValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  timeline: {
    flex: 1,
    paddingHorizontal: 20,
  },
  daySection: {
    marginBottom: 32,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  dayLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    letterSpacing: 0.5,
    flex: 1,
  },
  dayCalories: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.primary,
  },
  emptyDay: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginLeft: 20,
    alignItems: 'center',
  },
  emptyDayText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  mealEntry: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginLeft: 20,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  mealTypeBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mealTypeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  mealTime: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  mealDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  nutritionInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nutritionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  nutritionBadgeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  postButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  postButtonDisabled: {
    backgroundColor: colors.borderLight,
  },
  postButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  postButtonTextDisabled: {
    color: colors.textTertiary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sectionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    marginTop: 20,
  },
  mealTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  mealTypeOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedMealType: {
    borderWidth: 2,
  },
  mealTypeEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  mealTypeLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
  },
  mealInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  nutritionInputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  nutritionInputItem: {
    flex: 1,
    minWidth: '45%',
  },
  nutritionInputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  nutritionInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    textAlign: 'center',
  },
  mealActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  goalsDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  goalInputGrid: {
    gap: 16,
  },
  goalInputItem: {
    marginBottom: 16,
  },
  goalInputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  goalInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
});