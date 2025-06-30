import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';
import { Metric, MetricEntry, TimeRange } from '@/types/metrics';
import { getMetric } from '@/utils/metricsStorage';

const { width } = Dimensions.get('window');

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  date: string;
}

export default function MetricTrackingScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { metricType } = useLocalSearchParams();

  const [metric, setMetric] = useState<Metric | null>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');
  const [selectedPeriod, setSelectedPeriod] = useState('By Week');
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [currentDateRange, setCurrentDateRange] = useState('');
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const [loading, setLoading] = useState(true);

  const timeRanges: TimeRange[] = ['1W', '1M', '2M', '1Y'];
  const periodOptions = ['By Week', 'By Month', 'By Year'];

  useEffect(() => {
    loadMetric();
  }, [metricType]);

  useEffect(() => {
    if (metric) {
      updateChartData();
      updateDateRange();
    }
  }, [metric, selectedRange]);

  const loadMetric = async () => {
    try {
      const loadedMetric = await getMetric(metricType as any);
      setMetric(loadedMetric);
    } catch (error) {
      console.error('Error loading metric:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEntries = (): MetricEntry[] => {
    if (!metric) return [];
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (selectedRange) {
      case '1W':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '2M':
        cutoffDate.setMonth(now.getMonth() - 2);
        break;
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return metric.entries.filter(entry => new Date(entry.date) >= cutoffDate);
  };

  const updateChartData = () => {
    const entries = getFilteredEntries();
    if (entries.length === 0) {
      setChartData([]);
      return;
    }

    const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const values = sortedEntries.map(e => e.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;

    const chartWidth = width - 80;
    const chartHeight = 200;

    const points: ChartPoint[] = sortedEntries.map((entry, index) => {
      const x = (index / Math.max(sortedEntries.length - 1, 1)) * chartWidth;
      const y = chartHeight - ((entry.value - minValue) / range) * (chartHeight - 40) - 20;
      
      return {
        x,
        y,
        value: entry.value,
        date: entry.date
      };
    });

    setChartData(points);
  };

  const updateDateRange = () => {
    const entries = getFilteredEntries();
    if (entries.length === 0) {
      setCurrentDateRange('');
      return;
    }

    const dates = entries.map(e => new Date(e.date)).sort((a, b) => a.getTime() - b.getTime());
    const start = dates[0];
    const end = dates[dates.length - 1];
    
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    setCurrentDateRange(`${formatDate(start)} - ${formatDate(end)}`);
  };

  const groupEntriesByPeriod = () => {
    const entries = getFilteredEntries();
    const grouped: { [key: string]: MetricEntry[] } = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.date);
      let periodKey = '';
      
      switch (selectedPeriod) {
        case 'By Week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay() + 1);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          periodKey = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          break;
        case 'By Month':
          periodKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          break;
        case 'By Year':
          periodKey = date.getFullYear().toString();
          break;
      }
      
      if (!grouped[periodKey]) {
        grouped[periodKey] = [];
      }
      grouped[periodKey].push(entry);
    });
    
    return grouped;
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>No data available</Text>
        </View>
      );
    }

    const chartWidth = width - 80;
    const chartHeight = 200;

    return (
      <View style={styles.chartContainer}>
        <View style={[styles.chartArea, { width: chartWidth, height: chartHeight }]}>
          {/* Y-axis labels */}
          <View style={styles.yAxisLabels}>
            <Text style={styles.yAxisLabel}>100</Text>
            <Text style={styles.yAxisLabel}>80</Text>
            <Text style={styles.yAxisLabel}>60</Text>
          </View>
          
          {/* Chart line */}
          <View style={styles.chartLine}>
            {chartData.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = chartData[index - 1];
              
              const lineWidth = Math.sqrt(
                Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
              );
              const angle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) * 180 / Math.PI;
              
              return (
                <View
                  key={`line-${index}`}
                  style={[
                    styles.chartSegment,
                    {
                      left: prevPoint.x,
                      top: prevPoint.y,
                      width: lineWidth,
                      transform: [{ rotate: `${angle}deg` }],
                    }
                  ]}
                />
              );
            })}
          </View>
          
          {/* Chart points */}
          {chartData.map((point, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.chartPoint,
                {
                  left: point.x - 6,
                  top: point.y - 6,
                }
              ]}
              onPress={() => setHoveredPoint(hoveredPoint?.date === point.date ? null : point)}
            />
          ))}
          
          {/* Hover tooltip */}
          {hoveredPoint && (
            <View
              style={[
                styles.tooltip,
                {
                  left: Math.min(Math.max(hoveredPoint.x - 40, 0), chartWidth - 80),
                  top: Math.max(hoveredPoint.y - 70, 10),
                }
              ]}
            >
              <Text style={styles.tooltipDate}>
                {new Date(hoveredPoint.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              <Text style={styles.tooltipValue}>
                {hoveredPoint.value} {metric?.unit}
              </Text>
            </View>
          )}
        </View>
        
        {/* X-axis labels */}
        <View style={styles.chartLabels}>
          {chartData.map((point, index) => {
            if (index % Math.ceil(chartData.length / 5) !== 0) return null;
            return (
              <Text key={index} style={[styles.chartLabel, { left: point.x - 15 }]}>
                {new Date(point.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
              </Text>
            );
          })}
        </View>
      </View>
    );
  };

  const renderHistoryList = () => {
    const groupedEntries = groupEntriesByPeriod();
    const sortedPeriods = Object.keys(groupedEntries).sort((a, b) => {
      const aDate = new Date(groupedEntries[a][0].date);
      const bDate = new Date(groupedEntries[b][0].date);
      return bDate.getTime() - aDate.getTime();
    });

    return (
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <View style={styles.historyTitle}>
            <Text style={styles.historyTitleText}>{metric?.name}</Text>
            <TouchableOpacity onPress={() => router.push(`/add-metric/${metricType}`)}>
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.periodSelector}
            onPress={() => setShowPeriodPicker(true)}
          >
            <Text style={styles.periodText}>{selectedPeriod}</Text>
            <ChevronDown size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {sortedPeriods.map((period) => {
          const periodEntries = groupedEntries[period];
          const latestEntry = periodEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          
          return (
            <TouchableOpacity key={period} style={styles.historyItem}>
              <Text style={styles.historyPeriod}>{period}</Text>
              <View style={styles.historyValue}>
                <Text style={styles.historyValueText}>
                  {latestEntry.value} {metric?.unit}
                </Text>
                <ChevronDown size={16} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!metric) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Metric not found</Text>
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
        <Text style={styles.title}>{metric.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Time Range Selector */}
        <View style={styles.rangeSelector}>
          {timeRanges.map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.rangeButton,
                selectedRange === range && styles.activeRangeButton
              ]}
              onPress={() => setSelectedRange(range)}
            >
              <Text style={[
                styles.rangeButtonText,
                selectedRange === range && styles.activeRangeButtonText
              ]}>
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Current Value Section */}
        <View style={styles.currentSection}>
          <Text style={styles.currentLabel}>CURRENT</Text>
          <Text style={styles.currentValue}>
            {metric.currentValue || 0} {metric.unit}
          </Text>
          <View style={styles.dateNavigation}>
            <TouchableOpacity style={styles.navButton}>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.dateRange}>{currentDateRange}</Text>
            <TouchableOpacity style={styles.navButton}>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart */}
        {renderChart()}

        {/* History List */}
        {renderHistoryList()}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push(`/add-metric/${metricType}`)}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Period Picker Modal */}
      <Modal
        visible={showPeriodPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPeriodPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Select Period</Text>
          
          <View style={styles.periodOptions}>
            {periodOptions.map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodOption,
                  selectedPeriod === period && styles.selectedPeriodOption
                ]}
                onPress={() => {
                  setSelectedPeriod(period);
                  setShowPeriodPicker(false);
                }}
              >
                <Text style={[
                  styles.periodOptionText,
                  selectedPeriod === period && styles.selectedPeriodOptionText
                ]}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.error,
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
  content: {
    flex: 1,
  },
  rangeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 8,
  },
  rangeButton: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeRangeButton: {
    backgroundColor: colors.textSecondary,
    borderColor: colors.textSecondary,
  },
  rangeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  activeRangeButtonText: {
    color: '#FFFFFF',
  },
  currentSection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  currentLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  currentValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 48,
    color: colors.text,
    marginBottom: 16,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navButton: {
    padding: 4,
  },
  dateRange: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    minWidth: 120,
    textAlign: 'center',
  },
  chartContainer: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    marginBottom: 20,
  },
  chartArea: {
    position: 'relative',
    marginBottom: 20,
  },
  yAxisLabels: {
    position: 'absolute',
    left: -30,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  yAxisLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  chartLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  chartSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: colors.text,
  },
  chartPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.text,
    borderWidth: 3,
    borderColor: colors.background,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: colors.text,
    borderRadius: 8,
    padding: 8,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  tooltipDate: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: colors.background,
    marginBottom: 2,
  },
  tooltipValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: colors.background,
  },
  chartLabels: {
    position: 'relative',
    height: 20,
  },
  chartLabel: {
    position: 'absolute',
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: colors.textTertiary,
    width: 30,
    textAlign: 'center',
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: 40,
  },
  emptyChartText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textTertiary,
  },
  historySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTitleText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginRight: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 4,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  historyPeriod: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  historyValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyValueText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginRight: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 32,
  },
  periodOptions: {
    gap: 12,
  },
  periodOption: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  selectedPeriodOption: {
    backgroundColor: colors.primary,
  },
  periodOptionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  selectedPeriodOptionText: {
    color: '#FFFFFF',
  },
});