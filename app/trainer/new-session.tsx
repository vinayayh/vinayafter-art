import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, MapPin, User, Plus } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

const clients = [
  { id: 1, name: 'Sarah Johnson', avatar: '👩‍💼' },
  { id: 2, name: 'Mike Chen', avatar: '👨‍💻' },
  { id: 3, name: 'Emma Wilson', avatar: '👩‍🎨' },
  { id: 4, name: 'David Lee', avatar: '👨‍🎯' },
];

const sessionTypes = [
  'Personal Training',
  'Strength Training',
  'HIIT Session',
  'Cardio Training',
  'Athletic Performance',
  'Flexibility Training',
];

export default function NewSessionScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [sessionType, setSessionType] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const handleSaveSession = () => {
    if (!selectedClient || !sessionType || !date || !time) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    Alert.alert(
      'Session Scheduled',
      `Session with ${selectedClient.name} has been scheduled for ${date} at ${time}`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const renderClientSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Client *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.clientList}>
          {clients.map((client) => (
            <TouchableOpacity
              key={client.id}
              style={[
                styles.clientItem,
                selectedClient?.id === client.id && styles.selectedClientItem
              ]}
              onPress={() => setSelectedClient(client)}
            >
              <Text style={styles.clientAvatar}>{client.avatar}</Text>
              <Text style={[
                styles.clientName,
                selectedClient?.id === client.id && styles.selectedClientName
              ]}>
                {client.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderSessionTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Session Type *</Text>
      <View style={styles.typeGrid}>
        {sessionTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeItem,
              sessionType === type && styles.selectedTypeItem
            ]}
            onPress={() => setSessionType(type)}
          >
            <Text style={[
              styles.typeText,
              sessionType === type && styles.selectedTypeText
            ]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>New Training Session</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Client Selection */}
        {renderClientSelector()}

        {/* Session Type */}
        {renderSessionTypeSelector()}

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date & Time *</Text>
          <View style={styles.dateTimeRow}>
            <View style={styles.dateInput}>
              <Calendar size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Select date"
                placeholderTextColor={colors.textTertiary}
                value={date}
                onChangeText={setDate}
              />
            </View>
            <View style={styles.timeInput}>
              <Clock size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Time"
                placeholderTextColor={colors.textTertiary}
                value={time}
                onChangeText={setTime}
              />
            </View>
          </View>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration (minutes)</Text>
          <View style={styles.inputContainer}>
            <Clock size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="60"
              placeholderTextColor={colors.textTertiary}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.inputContainer}>
            <MapPin size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Gym A, Studio B, etc."
              placeholderTextColor={colors.textTertiary}
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Add any special notes or instructions..."
            placeholderTextColor={colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveSession}>
          <Text style={styles.saveButtonText}>Schedule Session</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  clientList: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  clientItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedClientItem: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  clientAvatar: {
    fontSize: 24,
    marginBottom: 8,
  },
  clientName: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  selectedClientName: {
    color: colors.primary,
    fontFamily: 'Inter-SemiBold',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeItem: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedTypeItem: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  selectedTypeText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  timeInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});