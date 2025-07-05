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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Plus, 
  Camera, 
  Clock,
  UtensilsCrossed,
  Calendar,
  X
} from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

interface FoodEntry {
  id: string;
  description: string;
  time: string;
  date: string;
  photo?: string;
}

interface DayEntry {
  date: string;
  displayDate: string;
  entries: FoodEntry[];
}

export default function FoodJournalScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [showAddMeal, setShowAddMeal] = useState(false);
  const [mealDescription, setMealDescription] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [foodEntries, setFoodEntries] = useState<DayEntry[]>([]);

  useEffect(() => {
    loadFoodEntries();
    setCurrentTime();
  }, []);

  const loadFoodEntries = () => {
    // Generate sample data for the past few days
    const today = new Date();
    const entries: DayEntry[] = [];

    for (let i = 0; i < 12; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const dayEntry: DayEntry = {
        date: date.toISOString().split('T')[0],
        displayDate: i === 0 ? 'TODAY' : date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }).toUpperCase(),
        entries: []
      };

      // Add some sample entries for recent days
      if (i > 0 && i < 4 && Math.random() > 0.5) {
        dayEntry.entries.push({
          id: `entry-${i}-1`,
          description: i === 1 ? 'Grilled chicken salad with quinoa' : 
                      i === 2 ? 'Oatmeal with berries and almonds' :
                      'Salmon with roasted vegetables',
          time: '12:30 PM',
          date: dayEntry.date
        });
      }

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
    setSelectedTime(`Today, ${timeString}`);
  };

  const handleAddMeal = () => {
    if (!mealDescription.trim()) {
      Alert.alert('Error', 'Please describe what you ate');
      return;
    }

    const newEntry: FoodEntry = {
      id: Date.now().toString(),
      description: mealDescription.trim(),
      time: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      date: new Date().toISOString().split('T')[0]
    };

    // Add to today's entries
    setFoodEntries(prev => {
      const updated = [...prev];
      const todayIndex = updated.findIndex(day => day.displayDate === 'TODAY');
      if (todayIndex >= 0) {
        updated[todayIndex].entries.unshift(newEntry);
      }
      return updated;
    });

    // Reset form
    setMealDescription('');
    setShowAddMeal(false);
    setCurrentTime();
  };

  const handleAddPhoto = () => {
    if (Platform.OS === 'web') {
      Alert.alert('Photo Upload', 'Photo upload would be available on mobile devices');
    } else {
      // Handle camera/photo picker
      Alert.alert('Add Photo', 'Camera functionality would open here');
    }
  };

  const renderDayEntry = (dayEntry: DayEntry) => (
    <View key={dayEntry.date} style={styles.daySection}>
      <View style={styles.dayHeader}>
        <View style={styles.dayIndicator} />
        <Text style={styles.dayLabel}>{dayEntry.displayDate}</Text>
      </View>
      
      {dayEntry.entries.length === 0 ? (
        <View style={styles.emptyDay} />
      ) : (
        dayEntry.entries.map((entry) => (
          <View key={entry.id} style={styles.mealEntry}>
            <View style={styles.mealContent}>
              <Text style={styles.mealDescription}>{entry.description}</Text>
              <Text style={styles.mealTime}>{entry.time}</Text>
            </View>
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
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
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
                Post
              </Text>
            </TouchableOpacity>
          </View>

          {/* Modal Content */}
          <View style={styles.modalContent}>
            <TextInput
              style={styles.mealInput}
              value={mealDescription}
              onChangeText={setMealDescription}
              placeholder="What did you eat?..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />

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
    padding: 4,
  },
  addButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.primary,
  },
  timeline: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
    backgroundColor: colors.textTertiary,
    marginRight: 12,
  },
  dayLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  emptyDay: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 20,
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
  mealContent: {
    flex: 1,
  },
  mealDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  mealTime: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
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
  mealInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 32,
    minHeight: 120,
  },
  mealActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});