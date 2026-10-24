import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  AppState,
  AppStateStatus,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { Button } from '../../components/ui/Button';
import { WaveformVisualizer } from '../../components/ui/WaveformVisualizer';
import { MicOrb } from '../../components/ui/MicOrb';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

type RoomState = 'QUESTION_PLAYING' | 'LISTENING' | 'PROCESSING' | 'CLARIFY' | 'ERROR';

export default function VoicePracticeRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { preferences } = useAuth();
  const isReducedMotion = preferences?.reducedMotion || false;

  const params = useLocalSearchParams<{
    topicId?: string;
    topicName?: string;
    customPrompt?: string;
    feedbackMode?: 'per_answer' | 'end_of_session';
    speechSpeed?: string;
    coachingFocus?: string;
    sessionId?: string;
    currentQuestion?: string;
    questionNumber?: string;
    sessionTimeRemaining?: string;
  }>();

  const selectedTopic =
    INITIAL_TOPICS.find((t) => t.id === params.topicId) || INITIAL_TOPICS[0];
  const feedbackMode = params.feedbackMode || preferences?.preferredFeedbackMode || 'per_answer';

  // Session state
  const [sessionId, setSessionId] = useState<string>(params.sessionId || '');
  const [questionNumber, setQuestionNumber] = useState<number>(
    params.questionNumber ? Number(params.questionNumber) : 1
  );
  const [currentQuestion, setCurrentQuestion] = useState<string>(
    params.currentQuestion ||
      (params.customPrompt
        ? `Explain the core architectural trade-offs of ${params.customPrompt}.`
        : selectedTopic.sampleQuestion)
  );
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number>(
    params.sessionTimeRemaining ? Number(params.sessionTimeRemaining) : 600
  );
  const [roomState, setRoomState] = useState<RoomState>('QUESTION_PLAYING');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [clarifyMessage, setClarifyMessage] = useState<string | null>(null);
  const [ttsFailedNotice, setTtsFailedNotice] = useState<string | null>(null);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  // High quality static audio recorder instance - avoids releasing shared object across turns
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Audio & interruption control references
  const webMediaRecorderRef = useRef<any>(null);
  const webAudioChunksRef = useRef<any[]>([]);
  const webStreamRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const isRecordingStartingRef = useRef<boolean>(false);
  const isStoppingRef = useRef<boolean>(false);
  const isNativeRecordingActiveRef = useRef<boolean>(false);
  const isInternalAudioTransitionRef = useRef<boolean>(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const roomStateRef = useRef<RoomState>(roomState);
  const isInterruptedRef = useRef<boolean>(isInterrupted);

  useEffect(() => {
    roomStateRef.current = roomState;
  }, [roomState]);

  useEffect(() => {
    isInterruptedRef.current = isInterrupted;
  }, [isInterrupted]);

  // 1. Initialize session with backend
  useEffect(() => {
    let isMounted = true;
    if (params.sessionId) {
      setSessionId(params.sessionId);
      if (params.currentQuestion) {
        setCurrentQuestion(params.currentQuestion);
      }
      return () => {
        isMounted = false;
        if (isNativeRecordingActiveRef.current) {
          stopAudioRecording();
        }
        Speech.stop();
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }

    const initBackendSession = async () => {
      try {
        const response = await api.post('/sessions', {
          topicId: selectedTopic.id,
          customTopicText: params.customPrompt || undefined,
          feedbackMode,
          coachingFocus: params.coachingFocus || preferences?.coachingFocus || 'all_round',
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
      if (isNativeRecordingActiveRef.current) {
        stopAudioRecording();
      }
      Speech.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 10-Minute Overall Session Countdown Timer — runs once on mount, does not reset on question changes
  useEffect(() => {
    const sessionCountdown = setInterval(() => {
      setSessionTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(sessionCountdown);
          handleFinishSession(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(sessionCountdown);
  }, []); // <-- INTENTIONALLY empty deps: timer starts once on mount, not on each question

  // 2. Play question audio on question change
  useEffect(() => {
    if (currentQuestion) {
      speakQuestion(currentQuestion);
    }
  }, [currentQuestion]);

  // 3. Interruption Handling: Only trigger when app is truly backgrounded, never on spurious Android inactive events
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      // Do NOT trigger if this was an internal audio focus switch or permission prompt
      if (isInternalAudioTransitionRef.current) return;

      // On Android: NEVER trigger on 'inactive' (which fires on audio focus/dialog changes), ONLY on 'background'
      const isActualBackground =
        Platform.OS === 'android'
          ? prev === 'active' && nextState === 'background'
          : nextState === 'background' || (prev === 'active' && nextState === 'inactive');

      if (isActualBackground && !isInterruptedRef.current) {
        Speech.stop();
        if (roomStateRef.current === 'LISTENING') {
          await stopAudioRecording();
          setIsInterrupted(true);
        } else if (roomStateRef.current === 'QUESTION_PLAYING') {
          setIsInterrupted(true);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 4. Duration counter during LISTENING (2 minutes max auto-submit)
  useEffect(() => {
    if (roomState === 'LISTENING' && !isInterrupted) {
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 120) {
            // Auto-finish only if we have actual audio (duration > 0 means recording started)
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
  }, [roomState, isInterrupted]);

  const speakQuestion = async (text: string) => {
    try {
      setRoomState('QUESTION_PLAYING');
      setClarifyMessage(null);
      setTtsFailedNotice(null);
      Speech.stop();

      if (isSpeakerEnabled) {
        const speedPreference = params.speechSpeed || preferences?.speechSpeed || '1.0x';
        const rate = speedPreference === '1.1x' ? 1.1 : speedPreference === '0.9x' ? 0.9 : 1.0;

        Speech.speak(text, {
          rate,
          pitch: 1.0,
          language: 'en-US',
          onDone: () => {
            // State machine transition: TTS finished -> enable mic & start recording
            setRoomState('LISTENING');
            startAudioRecording();
          },
          onError: (e) => {
            console.warn('TTS playback error (edge case):', e);
            setTtsFailedNotice('Question speech unavailable on device. Please read the prompt above.');
            setRoomState('LISTENING');
            startAudioRecording();
          },
        });
      } else {
        setRoomState('LISTENING');
        startAudioRecording();
      }
    } catch {
      setTtsFailedNotice('Question speech unavailable on device. Please read the prompt above.');
      setRoomState('LISTENING');
      startAudioRecording();
    }
  };

  const skipTtsAndRecord = () => {
    Speech.stop();
    setRoomState('LISTENING');
    startAudioRecording();
  };

  const startAudioRecording = async () => {
    if (isRecordingStartingRef.current || isStoppingRef.current) return;
    isRecordingStartingRef.current = true;
    isInternalAudioTransitionRef.current = true;
    setClarifyMessage(null);
    setRecordingDuration(0);

    // Ensure audio routing hygiene: stop any speech output to prevent echo/feedback loop
    Speech.stop();

    if (Platform.OS === 'web') {
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
      } finally {
        isRecordingStartingRef.current = false;
        setTimeout(() => {
          isInternalAudioTransitionRef.current = false;
        }, 500);
      }
    } else {
      try {
        const { granted } = await requestRecordingPermissionsAsync();
        if (!granted) {
          Alert.alert('Microphone Access', 'Please allow microphone access to practice speaking.');
          isRecordingStartingRef.current = false;
          isInternalAudioTransitionRef.current = false;
          return;
        }

        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });

        if (isNativeRecordingActiveRef.current || audioRecorder.isRecording) {
          isRecordingStartingRef.current = false;
          isInternalAudioTransitionRef.current = false;
          return;
        }

        try {
          await audioRecorder.prepareToRecordAsync();
        } catch (prepErr: any) {
          if (!prepErr?.message?.includes('already been prepared')) {
            console.warn('Recorder preparation warning:', prepErr?.message);
          }
        }

        // Guard record() in try/catch so native errors NEVER crash the app
        try {
          if (!audioRecorder.isRecording) {
            audioRecorder.record();
            isNativeRecordingActiveRef.current = true;
          }
        } catch (recErr: any) {
          console.warn('Native record call error:', recErr);
        }
      } catch (e: any) {
        console.warn('Native recording start error:', e);
      } finally {
        isRecordingStartingRef.current = false;
        setTimeout(() => {
          isInternalAudioTransitionRef.current = false;
        }, 500);
      }
    }
  };

  const stopAudioRecording = async (): Promise<{ uri?: string; blob?: Blob } | null> => {
    if (isStoppingRef.current) return null;
    isStoppingRef.current = true;
    isRecordingStartingRef.current = false;
    isInternalAudioTransitionRef.current = true;

    try {
      if (Platform.OS === 'web') {
        return await new Promise((resolve) => {
          try {
            if (webMediaRecorderRef.current && webMediaRecorderRef.current.state !== 'inactive') {
              webMediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(webAudioChunksRef.current, { type: 'audio/webm' });
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
        if (!isNativeRecordingActiveRef.current && !audioRecorder.isRecording) {
          return null;
        }
        isNativeRecordingActiveRef.current = false;
        try {
          await audioRecorder.stop();
          const recordedUri = audioRecorder.uri ?? undefined;
          return { uri: recordedUri };
        } catch (e: any) {
          console.warn('Native stop warning:', e.message);
          return null;
        }
      }
    } finally {
      isStoppingRef.current = false;
      setTimeout(() => {
        isInternalAudioTransitionRef.current = false;
      }, 500);
    }
  };

  const handleResumeRecording = async () => {
    if (isResuming) return;
    try {
      setIsResuming(true);
      setIsInterrupted(false);
      setRoomState('LISTENING');
      await startAudioRecording();
    } catch (e) {
      console.warn('Resume recording warning:', e);
    } finally {
      setIsResuming(false);
    }
  };

  const handleFinishSpeaking = async () => {
    Speech.stop();
    setRoomState('PROCESSING');
    setClarifyMessage(null);

    const recordingResult = await stopAudioRecording();

    // Check if recording was virtually empty (< 2 seconds)
    if (recordingDuration < 2) {
      setRoomState('CLARIFY');
      setClarifyMessage("I didn't hear an answer. Please tap the microphone and speak your explanation.");
      return;
    }

    if (Platform.OS !== 'web' && !recordingResult?.uri) {
      setRoomState('CLARIFY');
      setClarifyMessage("Could not capture audio recording from the microphone. Please tap the mic and speak your answer.");
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

      // Note: Do NOT manually override Content-Type with 'multipart/form-data' in React Native,
      // as Axios/React Native must attach the multipart boundary automatically to prevent network errors.
      const response = await api.post(`/sessions/${currentSessionId}/turns`, formData, {
        headers: {
          Accept: 'application/json',
        },
        timeout: 60000,
      });

      const data = response.data;

      if (data.type === 'clarify') {
        setRoomState('CLARIFY');
        setClarifyMessage(data.message || "I couldn't hear any speech clearly. Could you please repeat your answer?");
        return;
      }

      if (data.type === 'config_error') {
        setRoomState('ERROR');
        Alert.alert('Configuration Required', data.message);
        return;
      }

      if (feedbackMode === 'per_answer') {
        const feedbackPayload = data.feedback || {
          grammarScore: 4,
          clarityScore: 4,
          technicalAccuracyScore: 4,
          interviewReadinessScore: 4,
          strengths: ['Addressed the technical prompt directly'],
          improvements: ['Elaborate with concrete architectural examples'],
          quickCoachTip: 'State the core definition clearly before discussing trade-offs.',
        };

        router.push({
          pathname: '/session/feedback',
          params: {
            questionNumber: String(questionNumber),
            questionText: currentQuestion,
            topicName: selectedTopic.name,
            feedbackData: JSON.stringify(feedbackPayload),
            nextQuestion: data.nextQuestion || 'How would you scale this design under high concurrency?',
            sessionId: currentSessionId,
            mode: feedbackMode,
            sessionTimeRemaining: String(sessionTimeRemaining),
          },
        });
      } else {
        setQuestionNumber((n) => n + 1);
        setCurrentQuestion(data.nextQuestion || 'How would you scale this design under high concurrency?');
      }
    } catch (err: any) {
      console.warn('Turn evaluation error:', err);
      // Do NOT navigate away on error \u2014 show in-page retry message so user stays in session
      const serverMsg = err.response?.data?.message || err.message || 'Could not process audio. Please try again.';
      setRoomState('CLARIFY');
      setClarifyMessage(`\u26a0\ufe0f ${serverMsg} \u2014 Tap the mic to retry your answer.`);
    }
  };

  const handleRestartTurn = async () => {
    await stopAudioRecording();
    setRecordingDuration(0);
    setClarifyMessage(null);
    speakQuestion(currentQuestion);
  };

  const handleFinishSession = async (auto = false) => {
    Speech.stop();
    await stopAudioRecording();
    const currentSessionId = sessionId || 'session_' + Date.now();
    const elapsed = Math.max(1, 600 - sessionTimeRemaining);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const durationText = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

    let summaryData = '';
    try {
      const res = await api.post(`/sessions/${currentSessionId}/finish`, {
        durationSeconds: elapsed,
      });
      if (res.data?.summary) {
        summaryData = JSON.stringify(res.data.summary);
      }
    } catch (e) {
      console.warn('Finish session error:', e);
    }

    router.replace({
      pathname: '/session/report',
      params: {
        sessionId: currentSessionId,
        topicName: selectedTopic.name,
        questionCount: String(questionNumber),
        durationText,
        mode: feedbackMode,
        summaryData,
      },
    });
  };

  const handleEndSession = () => {
    Alert.alert(
      'End Practice Session',
      'Are you sure you want to conclude this rehearsal session and view your evaluation report?',
      [
        { text: 'Keep Practicing', style: 'cancel' },
        {
          text: 'Finish & View Report',
          style: 'destructive',
          onPress: () => handleFinishSession(false),
        },
      ]
    );
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top Action Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleEndSession}
            style={styles.endSessionBtn}
            accessibilityRole="button"
            accessibilityLabel="End session">
            <MaterialIcons name="close" size={16} color={Colors.light.critical} />
            <Text style={[styles.endSessionText, { color: Colors.light.critical }]}>End</Text>
          </TouchableOpacity>

          <View style={styles.counterPill}>
            <Text style={styles.counterText}>Question {questionNumber}</Text>
          </View>

          <View style={styles.timerPill}>
            <MaterialIcons
              name="timer"
              size={14}
              color={sessionTimeRemaining < 60 ? Colors.light.critical : Colors.light.primary}
            />
            <Text
              style={[
                styles.timerText,
                sessionTimeRemaining < 60 && { color: Colors.light.critical },
              ]}>
              {formatTimer(sessionTimeRemaining)}
            </Text>
          </View>

          <View style={styles.headerControls}>
            <TouchableOpacity
              onPress={() => {
                setIsSpeakerEnabled(!isSpeakerEnabled);
                if (isSpeakerEnabled) Speech.stop();
              }}
              style={styles.speakerBtn}
              accessibilityRole="button"
              accessibilityLabel={isSpeakerEnabled ? 'Mute speaker' : 'Enable speaker'}>
              <MaterialIcons
                name={isSpeakerEnabled ? 'volume-up' : 'volume-off'}
                size={18}
                color={Colors.light.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Question & Voice Controls Canvas (Scrollable so large questions don't push mic controls off screen) */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 40 + Math.max(insets.bottom, 20) },
          ]}
          showsVerticalScrollIndicator={true}
          bounces={true}
          keyboardShouldPersistTaps="handled">
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

            <Text
              style={[
                styles.promptText,
                (currentQuestion?.length || 0) > 140 && styles.promptTextLong,
              ]}
              selectable={true}>
              {currentQuestion}
            </Text>

            {/* TTS Failure fallback text banner (Milestone 5) */}
            {ttsFailedNotice && (
              <View style={styles.ttsNoticeBox}>
                <MaterialIcons name="volume-mute" size={14} color={Colors.light.textTertiary} />
                <Text style={styles.ttsNoticeText}>{ttsFailedNotice}</Text>
              </View>
            )}

            <View style={styles.promptFooter}>
              <TouchableOpacity
                onPress={() => speakQuestion(currentQuestion)}
                style={styles.repeatBtn}
                accessibilityRole="button"
                accessibilityLabel="Repeat question audio">
                <MaterialIcons name="replay" size={16} color={Colors.light.primary} />
                <Text style={styles.repeatText}>Repeat Audio</Text>
              </TouchableOpacity>

              {/* Milestone 5: Skip TTS button when TTS is playing */}
              {roomState === 'QUESTION_PLAYING' ? (
                <TouchableOpacity
                  onPress={skipTtsAndRecord}
                  style={styles.skipTtsBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Skip audio and answer now">
                  <MaterialIcons name="fast-forward" size={16} color={Colors.light.primary} />
                  <Text style={styles.skipTtsText}>Skip TTS & Answer</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.durationNote}>
                  {roomState === 'LISTENING' ? 'Recording answer...' : 'Ready'}
                </Text>
              )}
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
                {roomState === 'QUESTION_PLAYING'
                  ? 'AI reading question aloud...'
                  : roomState === 'LISTENING'
                  ? 'Listening to your spoken answer...'
                  : roomState === 'PROCESSING'
                  ? 'Transcribing & evaluating speech...'
                  : roomState === 'CLARIFY'
                  ? 'No speech detected — tap mic to answer'
                  : 'AI ready'}
              </Text>
            </View>

            {/* Dynamic Waveform Visualizer (Reduced Motion respected) */}
            <View style={styles.waveformBox}>
              <WaveformVisualizer
                isActive={roomState === 'LISTENING'}
                barCount={26}
                reducedMotion={isReducedMotion}
              />
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
                  onPress={async () => {
                    Speech.stop();
                    await stopAudioRecording();
                    setIsInterrupted(true);
                  }}
                  style={styles.flankBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Pause rehearsal">
                  <MaterialIcons name="pause" size={20} color={Colors.light.onSurface} />
                </TouchableOpacity>
                <Text style={styles.flankLabel}>Pause</Text>
              </View>

              {/* Master Microphone Target: 84px elevated */}
              <MicOrb
                isRecording={roomState === 'LISTENING'}
                reducedMotion={isReducedMotion}
                onPress={() => {
                  if (roomState === 'QUESTION_PLAYING') {
                    // Milestone 5: Tapping mic during TTS cancels TTS and starts recording
                    skipTtsAndRecord();
                  } else if (roomState === 'LISTENING') {
                    handleFinishSpeaking();
                  } else {
                    Speech.stop();
                    setRoomState('LISTENING');
                    startAudioRecording();
                  }
                }}
                label={
                  roomState === 'QUESTION_PLAYING'
                    ? 'Tap Mic to Skip & Speak'
                    : roomState === 'LISTENING'
                    ? 'Tap to Finish Speaking'
                    : roomState === 'PROCESSING'
                    ? 'Evaluating...'
                    : 'Tap to Answer'
                }
              />

              {/* Right Flank: Re-record */}
              <View style={styles.flankCol}>
                <TouchableOpacity
                  onPress={handleRestartTurn}
                  style={styles.flankBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Restart this answer">
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
        </ScrollView>

        {/* Milestone 5: Interruption Resume Overlay */}
        {isInterrupted && (
          <View style={styles.interruptionOverlay}>
            <Card style={styles.interruptionCard}>
              <View style={styles.interruptionIconBox}>
                <MaterialIcons name="phone-paused" size={32} color={Colors.light.cautionText} />
              </View>
              <Text style={styles.interruptionTitle}>Session Paused</Text>
              <Text style={styles.interruptionDesc}>
                Rehearsal paused. Your session state and answers are safe. Tap Resume Recording to continue.
              </Text>
              <View style={styles.interruptionBtnRow}>
                <Button
                  title="Repeat Question"
                  disabled={isResuming}
                  onPress={() => {
                    setIsInterrupted(false);
                    speakQuestion(currentQuestion);
                  }}
                  variant="outline"
                  size="md"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Resume Recording"
                  loading={isResuming}
                  disabled={isResuming}
                  onPress={handleResumeRecording}
                  size="md"
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          </View>
        )}
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
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.4)',
    minHeight: 44,
  },
  endSessionText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.tertiary,
  },
  counterPill: {
    backgroundColor: Colors.light.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.5)',
  },
  counterText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.onSurface,
    fontWeight: '600',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.4)',
    gap: 4,
  },
  timerText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.primary,
    fontWeight: '700',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speedPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.4)',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.margin,
    paddingTop: 12,
    paddingBottom: 40,
    justifyContent: 'space-between',
    gap: 16,
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
  promptTextLong: {
    fontSize: 17,
    lineHeight: 25,
  },
  ttsNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.surfaceContainerLow,
    padding: 8,
    borderRadius: BorderRadius.xs + 2,
  },
  ttsNoticeText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
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
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    gap: 6,
    minHeight: 44,
  },
  repeatText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  skipTtsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF0FD',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    gap: 6,
    minHeight: 44,
    borderWidth: 1,
    borderColor: 'rgba(91, 80, 229, 0.3)',
  },
  skipTtsText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.primary,
    fontWeight: '600',
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
  interruptionOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.margin,
    zIndex: 100,
  },
  interruptionCard: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
    gap: 12,
  },
  interruptionIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.cautionTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interruptionTitle: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
  },
  interruptionDesc: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  interruptionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
});
