import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import PrimaryButton from '@/components/PrimaryButton';
import CutscenePlayer from '@/components/CutscenePlayer';
import { useGame } from '@/context/GameContext';

const OATH_STATEMENTS = [
  'I commit to earning every power through discipline.',
  'I will face challenges with courage and resolve.',
  'I understand that true strength comes from within.',
  'I accept the responsibility that comes with power.',
];

export default function FinalLevelScreen() {
  const router = useRouter();
  const { power, getRequiredPower, completeLevel, fadeOutHomeMusic, pauseHomeMusic } = useGame();
  const [checkedStatements, setCheckedStatements] = useState([]);
  const [showOath, setShowOath] = useState(true);
  const [showCompletionPage, setShowCompletionPage] = useState(false);
  const [showBirthdayVideo, setShowBirthdayVideo] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  // Animation values for completion page
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const animationRef = useRef(null);

  // Fade out home music when level loads
  useEffect(() => {
    fadeOutHomeMusic();
  }, [fadeOutHomeMusic]);

  useEffect(() => {
    const requiredPower = getRequiredPower(5);
    setIsUnlocked(power >= requiredPower);
  }, [power]);

  // Auto-transition from completion page to birthday video after 5 seconds
  useEffect(() => {
    if (showCompletionPage) {
      // Stop any existing animations first
      if (animationRef.current) {
        animationRef.current.stop();
      }
      
      fadeAnim.setValue(0);
      translateYAnim.setValue(20);
      scaleAnim.setValue(0.95);

      // Animate riseIn effect (matches CSS keyframes)
      // Using default easing for smooth animation
      animationRef.current = Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]);
      animationRef.current.start();

      const timer = setTimeout(() => {
        pauseHomeMusic(); // Pause music when birthday video plays
        if (animationRef.current) {
          animationRef.current.stop();
        }
        setShowCompletionPage(false);
        setShowBirthdayVideo(true);
        // Reset animations
        fadeAnim.setValue(0);
        translateYAnim.setValue(20);
        scaleAnim.setValue(0.95);
      }, 5000);

      return () => {
        clearTimeout(timer);
        if (animationRef.current) {
          animationRef.current.stop();
        }
        fadeAnim.setValue(0);
        translateYAnim.setValue(20);
        scaleAnim.setValue(0.95);
      };
    }
  }, [showCompletionPage, pauseHomeMusic, fadeAnim, translateYAnim, scaleAnim]);

  const toggleStatement = (index) => {
    if (checkedStatements.includes(index)) {
      setCheckedStatements(checkedStatements.filter((i) => i !== index));
    } else {
      setCheckedStatements([...checkedStatements, index]);
    }
  };

  const handleAcceptOath = () => {
    if (checkedStatements.length === OATH_STATEMENTS.length) {
      setShowOath(false);
      setShowCompletionPage(true);
    } else {
      alert('Please accept all statements to continue.');
    }
  };

  const handleBirthdayVideoComplete = () => {
    completeLevel(5);
    router.push('/map');
  };

  const handleSkip = () => {
    completeLevel(5);
    router.push('/map');
  };

  if (showCompletionPage) {
    return (
      <View style={styles.completionContainer}>
        {/* Background decorative stars */}
        <Text style={styles.starDecor1}>✦</Text>
        <Text style={styles.starDecor2}>✦</Text>
        <Text style={styles.starDecor3}>✦</Text>
        <Text style={styles.starDecor4}>✦</Text>
        
        <Animated.View
          style={[
            styles.completionCard,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: translateYAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* Decorative corner elements */}
          <View style={styles.cornerDecorLeft} />
          <View style={styles.cornerDecorRight} />
          <View style={styles.cornerDecorTopRight} />
          <View style={styles.cornerDecorBottomLeft} />
          
          {/* Top decorative stars */}
          <Text style={styles.cardStar1}>✦</Text>
          <Text style={styles.cardStar2}>✦</Text>
          
          <View style={styles.completionContent}>
            <Animated.Text
              style={[
                styles.completionBadge,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              🏆
            </Animated.Text>
            
            <Animated.Text
              style={[
                styles.completionTitle,
                {
                  opacity: fadeAnim,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              CONGRATULATIONS!
            </Animated.Text>
            
            <View style={styles.dividerLine} />
            
            <Animated.Text
              style={[
                styles.completionMessage,
                {
                  opacity: fadeAnim,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              You have completed the game!
            </Animated.Text>
            
            <Animated.Text
              style={[
                styles.completionSubmessage,
                {
                  opacity: fadeAnim,
                },
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              You have reached the end of the Grand Line Quest.
            </Animated.Text>
            
            <Animated.Text
              style={[
                styles.completionThankYou,
                {
                  opacity: fadeAnim,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Thank you for playing!
            </Animated.Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  if (showBirthdayVideo) {
    return (
      <View style={styles.videoContainer}>
        <CutscenePlayer
          videoSource={require('@/assets/videos/bday 3.mp4')}
          onComplete={handleBirthdayVideoComplete}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (!isUnlocked) {
    const requiredPower = getRequiredPower(5);
    return (
      <View style={styles.container}>
        <Text style={styles.lockedTitle}>Captain's Oath</Text>
        <Text style={styles.lockedText}>
          This level requires {requiredPower} power.
        </Text>
        <Text style={styles.lockedText}>You have {power} power.</Text>
        <PrimaryButton
          title="Back to Map"
          onPress={() => router.push('/map')}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Captain's Oath</Text>
      <Text style={styles.subtitle}>
        Accept these statements to complete your journey
      </Text>

      <View style={styles.oathContainer}>
        {OATH_STATEMENTS.map((statement, index) => (
          <TouchableOpacity
            key={index}
            style={styles.statementRow}
            onPress={() => toggleStatement(index)}
          >
            <View
              style={[
                styles.checkbox,
                checkedStatements.includes(index) && styles.checkboxChecked,
              ]}
            >
              {checkedStatements.includes(index) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.statementText}>{statement}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <PrimaryButton
        title="Accept Oath"
        onPress={handleAcceptOath}
        disabled={checkedStatements.length !== OATH_STATEMENTS.length}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1d2a',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: '#ccc',
    fontSize: 18,
    marginBottom: 40,
    textAlign: 'center',
  },
  lockedTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  lockedText: {
    color: '#ccc',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  oathContainer: {
    width: '100%',
    marginBottom: 40,
  },
  statementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#1e3d2f',
    borderRadius: 10,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#4a9d7a',
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4a9d7a',
  },
  checkmark: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statementText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  skipButton: {
    position: "absolute",
    top: 50,
    right: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "rgba(30, 61, 47, 0.8)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4a9d7a",
    zIndex: 10,
  },
  skipButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  videoContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  completionContainer: {
    flex: 1,
    backgroundColor: '#0b1d2a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  starDecor1: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    fontSize: 40,
    color: '#ffd700',
    opacity: 0.4,
  },
  starDecor2: {
    position: 'absolute',
    top: '20%',
    right: '15%',
    fontSize: 35,
    color: '#ffd700',
    opacity: 0.4,
  },
  starDecor3: {
    position: 'absolute',
    bottom: '20%',
    left: '12%',
    fontSize: 38,
    color: '#ffd700',
    opacity: 0.4,
  },
  starDecor4: {
    position: 'absolute',
    bottom: '15%',
    right: '10%',
    fontSize: 42,
    color: '#ffd700',
    opacity: 0.4,
  },
  completionCard: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#ffd700',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  cornerDecorLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#ffd700',
    borderTopLeftRadius: 24,
    zIndex: 1,
  },
  cornerDecorRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#ffd700',
    borderBottomRightRadius: 24,
    zIndex: 1,
  },
  cornerDecorTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#ffd700',
    borderTopRightRadius: 24,
    zIndex: 1,
  },
  cornerDecorBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#ffd700',
    borderBottomLeftRadius: 24,
    zIndex: 1,
  },
  cardStar1: {
    position: 'absolute',
    top: 15,
    left: 20,
    fontSize: 22,
    color: '#ffd700',
    opacity: 0.7,
    zIndex: 1,
  },
  cardStar2: {
    position: 'absolute',
    top: 15,
    right: 20,
    fontSize: 22,
    color: '#ffd700',
    opacity: 0.7,
    zIndex: 1,
  },
  completionContent: {
    padding: 28,
    alignItems: 'center',
    zIndex: 2,
  },
  completionBadge: {
    fontSize: 60,
    marginBottom: 15,
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  completionTitle: {
    color: '#ffd700',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 15,
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    minWidth: 250,
  },
  dividerLine: {
    width: '70%',
    height: 2,
    backgroundColor: '#ffd700',
    marginBottom: 18,
    opacity: 0.6,
    borderRadius: 2,
  },
  completionMessage: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 14,
    textAlign: 'center',
    lineHeight: 26,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  completionSubmessage: {
    color: '#e0e0e0',
    fontSize: 15,
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
    fontWeight: '500',
  },
  completionThankYou: {
    color: '#ffd700',
    fontSize: 17,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '700',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

