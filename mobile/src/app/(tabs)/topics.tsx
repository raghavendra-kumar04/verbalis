import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { INITIAL_TOPICS, TopicItem } from '../../constants/topics';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';

export default function TopicSelectionScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [completedTopicIds, setCompletedTopicIds] = useState<string[]>([]);
  const [revisionMap, setRevisionMap] = useState<Record<string, string>>({});

  const categories = ['All', 'Core CS', 'Systems', 'Languages', 'Behavioral'];

  useEffect(() => {
    // Fetch real revision metrics from database
    const fetchTopicStatus = async () => {
      try {
        const [progRes, revRes] = await Promise.all([
          api.get('/progress'),
          api.get('/topics/revision'),
        ]);

        if (progRes.data?.completedTopicIds) {
          setCompletedTopicIds(progRes.data.completedTopicIds);
        }

        if (Array.isArray(revRes.data)) {
          const map: Record<string, string> = {};
          for (const item of revRes.data) {
            map[item.topicId] = item.reason;
          }
          setRevisionMap(map);
        }
      } catch (err) {
        console.warn('Could not load topic revision statuses from database:', err);
      }
    };

    fetchTopicStatus();
  }, []);

  const filterTopic = (topic: TopicItem) => {
    const matchesSearch =
      topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.subtopics.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Core CS' && (topic.id === 'dsa' || topic.id === 'databases')) return true;
    if (selectedCategory === 'Systems' && (topic.id === 'os' || topic.id === 'networks' || topic.id === 'c')) return true;
    if (selectedCategory === 'Languages' && (topic.id === 'java' || topic.id === 'c')) return true;
    if (selectedCategory === 'Behavioral' && topic.id === 'hr') return true;

    return true;
  };

  const handleSelectTopic = (topicId: string, customPrompt?: string) => {
    router.push({
      pathname: '/session/setup',
      params: {
        topicId,
        customPrompt: customPrompt || '',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Practice Topics</Text>
          <Text style={styles.subtitle}>
            Select a topic to test verbal clarity and technical correctness
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <MaterialIcons name="search" size={20} color={Colors.light.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search topics, algorithms, concepts..."
            placeholderTextColor={Colors.light.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search Topics"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityRole="button">
              <MaterialIcons name="close" size={18} color={Colors.light.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.8}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${cat}`}>
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Custom Topic Generator Box */}
        <Card style={styles.customCard}>
          <View style={styles.customHeader}>
            <View style={styles.customIconBadge}>
              <MaterialIcons name="auto-awesome" size={18} color={Colors.light.primary} />
            </View>
            <View style={styles.customTextGroup}>
              <Text style={styles.customTitle}>Custom Topic Practice</Text>
              <Text style={styles.customSub}>Type any subject or interview question</Text>
            </View>
          </View>
          <TextInput
            style={styles.customInput}
            placeholder="e.g., Explain Redis caching strategies, or Microservices vs Monoliths"
            placeholderTextColor={Colors.light.outline}
            value={customTopicInput}
            onChangeText={setCustomTopicInput}
            multiline
            accessibilityLabel="Custom Topic Description"
          />
          <Button
            title="Start Custom Topic"
            onPress={() => {
              if (customTopicInput.trim()) {
                handleSelectTopic('custom', customTopicInput.trim());
              }
            }}
            disabled={!customTopicInput.trim()}
            size="md"
            icon={<MaterialIcons name="arrow-forward" size={16} color="#fff" />}
            iconPosition="right"
            style={styles.customBtn}
          />
        </Card>

        {/* Predefined Topics List */}
        <View style={styles.topicsGrid}>
          {INITIAL_TOPICS.filter((t) => !t.isCustom && filterTopic(t)).map((topic) => {
            const isPracticed = completedTopicIds.includes(topic.id);
            const revisionReason = revisionMap[topic.id];

            return (
              <TouchableOpacity
                key={topic.id}
                activeOpacity={0.88}
                onPress={() => handleSelectTopic(topic.id)}
                accessibilityRole="button"
                accessibilityLabel={`Select topic ${topic.name}`}>
                <Card style={styles.topicCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.badgesGroup}>
                      <Badge
                        label={topic.difficulty}
                        variant={
                          topic.difficulty === 'Advanced'
                            ? 'critical'
                            : topic.difficulty === 'Intermediate'
                            ? 'primary'
                            : 'success'
                        }
                      />
                      {/* Milestone 6 Topic highlight: "Not practiced yet" / "Practice again" */}
                      <Badge
                        label={isPracticed ? 'Practice again' : 'Not practiced yet'}
                        variant={isPracticed ? 'caution' : 'neutral'}
                      />
                    </View>
                    <Text style={styles.cardCategory}>{topic.category}</Text>
                  </View>

                  <Text style={styles.topicName}>{topic.name}</Text>

                  <Text style={styles.sampleQuestion} numberOfLines={2}>
                    "{topic.sampleQuestion}"
                  </Text>

                  {/* Revision notice if available */}
                  {revisionReason && (
                    <View style={styles.revisionRow}>
                      <MaterialIcons name="history" size={14} color={Colors.light.primary} />
                      <Text style={styles.revisionReasonText} numberOfLines={1}>
                        {revisionReason}
                      </Text>
                    </View>
                  )}

                  <View style={styles.subtopicsRow}>
                    {topic.subtopics.slice(0, 3).map((sub, idx) => (
                      <View key={idx} style={styles.subtopicPill}>
                        <Text style={styles.subtopicText}>{sub}</Text>
                      </View>
                    ))}
                    {topic.subtopics.length > 3 && (
                      <Text style={styles.moreSubtopics}>+{topic.subtopics.length - 3}</Text>
                    )}
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.startText}>Configure Session</Text>
                    <MaterialIcons name="arrow-forward" size={16} color={Colors.light.primary} />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.margin,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    ...Typography.sizes.headlineLg,
    color: Colors.light.onSurface,
  },
  subtitle: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.4)',
    height: 48,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    ...Typography.sizes.bodyMd,
    color: Colors.light.onSurface,
  },
  filterScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.4)',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: Colors.light.primaryContainer,
    borderColor: Colors.light.primaryContainer,
  },
  filterChipText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textSecondary,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  customCard: {
    padding: 16,
    gap: 12,
    backgroundColor: '#EEF0FD',
    borderColor: 'rgba(91, 80, 229, 0.3)',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.light.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTextGroup: {
    flex: 1,
  },
  customTitle: {
    ...Typography.sizes.labelLg,
    color: Colors.light.onSurface,
    fontWeight: '600',
  },
  customSub: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textTertiary,
  },
  customInput: {
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    padding: 12,
    minHeight: 56,
    borderWidth: 1,
    borderColor: 'rgba(91, 80, 229, 0.2)',
    ...Typography.sizes.bodyMd,
    color: Colors.light.onSurface,
  },
  customBtn: {
    alignSelf: 'flex-end',
    height: 44,
    paddingHorizontal: 18,
  },
  topicsGrid: {
    gap: 12,
  },
  topicCard: {
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgesGroup: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  cardCategory: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  topicName: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
    letterSpacing: -0.2,
  },
  sampleQuestion: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  revisionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs + 2,
  },
  revisionReasonText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  subtopicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  subtopicPill: {
    backgroundColor: Colors.light.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs + 2,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.3)',
  },
  subtopicText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textSecondary,
    fontSize: 10,
  },
  moreSubtopics: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
    alignSelf: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200, 196, 215, 0.25)',
  },
  startText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.primary,
    fontWeight: '600',
  },
});
