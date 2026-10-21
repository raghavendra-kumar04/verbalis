import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { INITIAL_TOPICS } from '../../constants/topics';
import { Card } from '../../components/ui/Card';
import { WaveformVisualizer } from '../../components/ui/WaveformVisualizer';
import { MicOrb } from '../../components/ui/MicOrb';
import { api } from '../../services/api';

type RoomState = 'QUESTION_PLAYING' | 'LISTENING' | 'PROCESSING' | 'CLARIFY' | 'ERROR';

export default function VoicePracticeRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    topicId?: string;
    customPrompt?: string;
    feedbackMode?: 'per_answer' | 'end_of_session';
    speechSpeed?: string;
    coachingFocus?: string;
  }>();

  const selectedTopic =
    INITIAL_TOPICS.find((t) => t.id === params.topicId) || INITIAL_TOPICS[0];
  const feedbackMode = params.feedbackMode || 'per_answer';

  // Session state
  const [sessionId, setSessionId] = useState<string>('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState<string>(
    params.customPrompt
      ? `Explain the core architectural trade-offs of ${params.customPrompt}.`
      : selectedTopic.sampleQuestion
  );
  const [roomState, setRoomState] = useState<RoomState>('QUESTION_PLAYING');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [clarifyMessage, setClarifyMessage] = useState<string | null>(null);

  // Native expo-audio recorder hook
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Web MediaRecorder references
  const webMediaRecorderRef = useRef<any>(null);
  const webAudioChunksRef = useRef<any[]>([]);
  const webStreamRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // 1. Initialize session with backend
  useEffect(() => {
    let isMounted = true;
    const initBackendSession = async () => {
      try {
        const response = await api.post('/sessions', {
          topicId: selectedTopic.id,
          customTopicText: params.customPrompt || undefined,
          feedbackMode,
          coachingFocus: params.coachingFocus || 'all_round',
        });
        if (isMounted && response.data.sessionId) {
          setSessionId(response.data.sessionId);
          if (response.data.firstQuestion) {
            setCurrentQuestion(response.data.firstQuestion);
          }
        }
      } catch (err) {
        console.warn('Backend session init warning (will use fallback id):', err);
        if (isMounted) {
          setSessionId('session_' + Date.now());
        }
      }
    };

    initBackendSession();
    return () => {
      isMounted = false;
      stopAudioRecording();
      Speech.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 2. Play question audio on question change
  useEffect(() => {
    if (currentQuestion) {
      speakQuestion(currentQuestion);
    }
  }, [currentQuestion]);

  // 3. Duration counter during LISTENING (2 minutes max)
  useEffect(() => {
    if (roomState === 'LISTENING') {
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 120) {
            handleFinishSpeaking();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomState]);

  const speakQuestion = async (text: string) => {
    try {
      setRoomState('QUESTION_PLAYING');
      setClarifyMessage(null);
      Speech.stop();
      if (isSpeakerEnabled) {
        const rate = params.speechSpeed === '1.1x' ? 1.1 : params.speechSpeed === '0.9x' ? 0.9 : 1.0;
        Speech.speak(text, {
          rate,
          pitch: 1.0,
          language: 'en-US',
          onDone: () => {
            setRoomState('LISTENING');
            startAudioRecording();
          },
          onError: () => {
            setRoomState('LISTENING');
            startAudioRecording();
          },
        });
      } else {
        setRoomState('LISTENING');
        startAudioRecording();
      }
    } catch {
      setRoomState('LISTENING');
      startAudioRecording();
    }
  };

  const startAudioRecording = async () => {
    setClarifyMessage(null);
    setRecordingDuration(0);

    if (Platform.OS === 'web') {
      // Real Web browser microphone recording via MediaRecorder API
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          webStreamRef.current = stream;
          webAudioChunksRef.current = [];
          const mediaRecorder = new (window as any).MediaRecorder(stream);
          webMediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (event: any) => {
            if (event.data && event.data.size > 0) {
              webAudioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.start(250);
        }
      } catch (err: any) {
        console.warn('Web microphone access denied or not supported:', err);
        Alert.alert('Microphone Access', 'Please allow microphone access in your browser to speak.');
      }
    } else {
      // Real Native audio recording via expo-audio
      try {
        const { granted } = await requestRecordingPermissionsAsync();
        if (!granted) {
          Alert.alert('Microphone Access', 'Please allow microphone access to practice speaking.');
          return;
        }

        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });

        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
      } catch (e) {
        console.warn('Native recording start error:', e);
      }
    }
  };

  const stopAudioRecording = async (): Promise<{ uri?: string; blob?: Blob } | null> => {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        try {
          if (webMediaRecorderRef.current && webMediaRecorderRef.current.state !== 'inactive') {
            webMediaRecorderRef.current.onstop = () => {
              const audioBlob = new Blob(webAudioChunksRef.current, { type: 'audio/webm' });
              // Stop all audio tracks
              if (webStreamRef.current) {
                webStreamRef.current.getTracks().forEach((track: any) => track.stop());
              }
              resolve({ blob: audioBlob });
            };
            webMediaRecorderRef.current.stop();
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    } else {
      try {
        if (audioRecorder.isRecording) {
          await audioRecorder.stop();
          return { uri: audioRecorder.uri ?? undefined };
        }
      } catch (e) {
        console.warn('Failed to stop native recording', e);
      }
      return null;
    }
  };

  const handleFinishSpeaking = async () => {
    Speech.stop();
    setRoomState('PROCESSING');
    setClarifyMessage(null);

    const recordingResult = await stopAudioRecording();

    // Check if recording was virtually empty (less than 1.5 seconds)
    if (recordingDuration < 2) {
      setRoomState('CLARIFY');
      setClarifyMessage("I didn't hear an answer. Please tap the microphone and speak your explanation.");
      return;
    }

    try {
      const formData = new FormData();
      const currentSessionId = sessionId || 'session_' + Date.now();

      if (Platform.OS === 'web') {
        if (recordingResult?.blob && recordingResult.blob.size > 100) {
          formData.append('audio', recordingResult.blob, 'turn_recording.webm');
        }
      } else {
        if (recordingResult?.uri) {
          formData.append('audio', {
            uri: recordingResult.uri,
            name: 'turn_recording.m4a',
            type: 'audio/m4a',
          } as any);
        }
      }

      const response = await api.post(`/sessions/${currentSessionId}/turns`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;

      // If backend reports no speech or ambiguous audio
      if (data.type === 'clarify') {
        setRoomState('CLARIFY');
        setClarifyMessage(data.message || "I couldn't hear any speech clearly. Could you please repeat your answer?");
        return;
      }

      // If backend reports missing Groq key
      if (data.type === 'config_error') {
        setRoomState('ERROR');
        Alert.alert('Configuration Required', data.message);
        return;
      }

      // Real evaluated feedback from Groq LLaMA
      if (feedbackMode === 'per_answer' && data.feedback) {
        router.push({
          pathname: '/session/feedback',
          params: {
            questionNumber: String(questionNumber),
            questionText: currentQuestion,
            topicName: selectedTopic.name,
            feedbackData: JSON.stringify(data.feedback),
            nextQuestion: data.nextQuestion || 'Could you elaborate on this approach?',
            sessionId: currentSessionId,
            mode: feedbackMode,
          },
        });
      } else {
        // End-of-session mode: advance directly to next question without mid-session evaluation
        setQuestionNumber((n) => n + 1);
        setCurrentQuestion(data.nextQuestion || 'Could you elaborate on the practical trade-offs?');
      }
    } catch (err: any) {
      console.warn('Turn evaluation error:', err);
      const serverMsg = err.response?.data?.message || 'Failed to process audio. Please check that backend is running.';
      setRoomState('ERROR');
      Alert.alert('Evaluation Notice', serverMsg);
    }
  };

  const handleRestartTurn = async () => {
    await stopAudioRecording();
    setRecordingDuration(0);
    setClarifyMessage(null);
    speakQuestion(currentQuestion);
  };

  const handleEndSession = () => {
    Alert.alert('End Session', 'Are you sure you want to end this practice session?', [
      { text: 'Resume Practice', style: 'cancel' },
      {
        text: 'Finish & View Report',
        style: 'destructive',
        onPress: async () => {
          Speech.stop();
          await stopAudioRecording();
          const currentSessionId = sessionId || 'session_' + Date.now();
          try {
            await api.post(`/sessions/${currentSessionId}/finish`);
          } catch {}
          router.replace({
            pathname: '/session/report',
            params: {
              topicName: selectedTopic.name,
              questionCount: String(questionNumber),
              durationText: `${Math.floor(recordingDuration / 60)}m ${recordingDuration % 60}s`,
            },
          });
        },
      },
    ]);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Action Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleEndSession} style={styles.endSessionBtn}>
            <MaterialIcons name="close" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.endSessionText}>End Session</Text>
          </TouchableOpacity>

          <View style={styles.counterPill}>
            <Text style={styles.counterText}>Question {questionNumber} of 3</Text>
          </View>

          <View style={styles.headerControls}>
            <View style={styles.speedPill}>
              <Text style={styles.speedText}>{params.speechSpeed || '1.0x'}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setIsSpeakerEnabled(!isSpeakerEnabled);
                if (isSpeakerEnabled) Speech.stop();
              }}
              style={styles.speakerBtn}>
              <MaterialIcons
                name={isSpeakerEnabled ? 'volume-up' : 'volume-off'}
                size={18}
                color={Colors.light.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Question Canvas */}
        <View style={styles.content}>
          {/* Topic Context Pill */}
          <View style={styles.topicPill}>
            <View style={styles.topicDot} />
            <Text style={styles.topicPillText}>
              {selectedTopic.name} • {selectedTopic.difficulty}
            </Text>
          </View>

          {/* Signature Verbal Prompt Card */}
          <Card style={styles.promptCard}>
            <View style={styles.promptHeader}>
              <MaterialIcons name="psychology" size={18} color={Colors.light.primary} />
              <Text style={styles.promptLabel}>AI INTERVIEWER</Text>
            </View>

            <Text style={styles.promptText}>{currentQuestion}</Text>

            <View style={styles.promptFooter}>
              <TouchableOpacity onPress={() => speakQuestion(currentQuestion)} style={styles.repeatBtn}>
                <MaterialIcons name="replay" size={16} color={Colors.light.primary} />
                <Text style={styles.repeatText}>Repeat Question (AI Audio)</Text>
              </TouchableOpacity>
              <Text style={styles.durationNote}>
                {roomState === 'QUESTION_PLAYING' ? 'Speaking...' : 'Ready'}
              </Text>
            </View>
          </Card>

          {/* Clarification Alert if User Didn't Speak or Audio was Empty */}
          {clarifyMessage ? (
            <View style={styles.clarifyBanner}>
              <MaterialIcons name="info" size={20} color={Colors.light.cautionText} />
              <Text style={styles.clarifyText}>{clarifyMessage}</Text>
            </View>
          ) : null}

          {/* Center Acoustic Energy & Waveform Visualizer */}
          <View style={styles.acousticCenter}>
            {/* Live State Pill Indicator */}
            <View style={styles.stateIndicatorPill}>
              <View
                style={[
                  styles.statusDot,
                  roomState === 'LISTENING'
                    ? styles.statusDotRec
                    : roomState === 'PROCESSING'
                    ? styles.statusDotProc
                    : styles.statusDotIdle,
                ]}
              />
              <Text style={styles.stateIndicatorText}>
                {roomState === 'LISTENING'
                  ? 'Listening to your spoken answer...'
                  : roomState === 'PROCESSING'
                  ? 'Transcribing & evaluating speech...'
                  : roomState === 'CLARIFY'
                  ? 'No speech detected — tap mic to answer'
                  : 'AI ready'}
              </Text>
            </View>

            {/* Dynamic Waveform Visualizer */}
            <View style={styles.waveformBox}>
              <WaveformVisualizer isActive={roomState === 'LISTENING'} barCount={26} />
            </View>

            {/* Duration Counter & Limit Warning (2 Minutes Max) */}
            <View style={styles.timerRow}>
              <Text style={styles.timerCurrent}>{formatTimer(recordingDuration)}</Text>
              <Text style={styles.timerMax}>/ 02:00 max</Text>
            </View>
          </View>

          {/* Bottom Voice Controls */}
          <View style={styles.controlsSection}>
            <View style={styles.flankRow}>
              {/* Left Flank: Pause */}
              <View style={styles.flankCol}>
                <TouchableOpacity
                  onPress={() => {
                    Speech.stop();
                    Alert.alert('Paused', 'Take a breath. When ready, tap Continue.');
                  }}
                  style={styles.flankBtn}>
                  <MaterialIcons name="pause" size={20} color={Colors.light.onSurface} />
                </TouchableOpacity>
                <Text style={styles.flankLabel}>Pause</Text>
              </View>

              {/* Master Microphone Target: 84px elevated with radiant atmosphere */}
              <MicOrb
                isRecording={roomState === 'LISTENING'}
                onPress={
                  roomState === 'LISTENING'
                    ? handleFinishSpeaking
                    : () => {
                        Speech.stop();
                        setRoomState('LISTENING');
                        startAudioRecording();
                      }
                }
                label={
                  roomState === 'LISTENING'
                    ? 'Tap to Finish Speaking'
                    : roomState === 'PROCESSING'
                    ? 'Evaluating...'
                    : 'Tap to Answer'
                }
              />

              {/* Right Flank: Re-record */}
              <View style={styles.flankCol}>
                <TouchableOpacity onPress={handleRestartTurn} style={styles.flankBtn}>
                  <MaterialIcons name="restart-alt" size={20} color={Colors.light.onSurface} />
                </TouchableOpacity>
                <Text style={styles.flankLabel}>Restart</Text>
              </View>
            </View>

            {/* Transient Confidentiality Note */}
            <Text style={styles.transientNote}>
              Speak naturally. Your spoken audio is evaluated transiently for clarity and technical accuracy.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.margin,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200, 196, 215, 0.3)',
  },
  endSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.4)',
  },
  endSessionText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.tertiary,
  },
  counterPill: {
    backgroundColor: Colors.light.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.5)',
  },
  counterText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.onSurface,
    fontWeight: '600',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speedPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.4)',
  },
  speedText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.onSurfaceVariant,
    fontWeight: '600',
  },
  speakerBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.4)',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.margin,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  topicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF0FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(91, 80, 229, 0.2)',
  },
  topicDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  topicPillText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  promptCard: {
    padding: 18,
    gap: 12,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  promptLabel: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
    letterSpacing: 0.5,
  },
  promptText: {
    ...Typography.sizes.headlineMd,
    color: Colors.light.onSurface,
    lineHeight: 28,
  },
  promptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200, 196, 215, 0.3)',
  },
  repeatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  repeatText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  durationNote: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  clarifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cautionTint,
    borderRadius: BorderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.cautionBorder,
    gap: 10,
  },
  clarifyText: {
    ...Typography.sizes.bodySm,
    color: Colors.light.cautionText,
    flex: 1,
    lineHeight: 18,
  },
  acousticCenter: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  stateIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceContainer,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.4)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotRec: {
    backgroundColor: Colors.light.critical,
  },
  statusDotProc: {
    backgroundColor: Colors.light.caution,
  },
  statusDotIdle: {
    backgroundColor: Colors.light.primary,
  },
  stateIndicatorText: {
    ...Typography.sizes.labelMd,
    color: Colors.light.onSurface,
  },
  waveformBox: {
    width: '100%',
    maxWidth: 320,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  timerCurrent: {
    ...Typography.sizes.bodyMd,
    fontWeight: '700',
    color: Colors.light.onSurface,
  },
  timerMax: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textTertiary,
  },
  controlsSection: {
    gap: 12,
  },
  flankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  flankCol: {
    alignItems: 'center',
    gap: 6,
  },
  flankBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flankLabel: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  transientNote: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});
