import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView } from 'react-native';
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
  const [showVideo, setShowVideo] = useState(true);

  // Fade out home music when level loads
  useEffect(() => {
    fadeOutHomeMusic();
  }, [fadeOutHomeMusic]);
  const [showOath, setShowOath] = useState(false);
  const [showBirthdayVideo, setShowBirthdayVideo] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const requiredPower = getRequiredPower(5);
    setIsUnlocked(power >= requiredPower);
  }, [power]);

  const handleVideoComplete = () => {
    setShowVideo(false);
    setShowOath(true);
  };

  const toggleStatement = (index) => {
    if (checkedStatements.includes(index)) {
      setCheckedStatements(checkedStatements.filter((i) => i !== index));
    } else {
      setCheckedStatements([...checkedStatements, index]);
    }
  };

  const handleAcceptOath = () => {
    if (checkedStatements.length === OATH_STATEMENTS.length) {
      pauseHomeMusic(); // Pause music when birthday video plays
      setShowOath(false);
      setShowBirthdayVideo(true);
    } else {
      alert('Please accept all statements to continue.');
    }
  };

  const handleBirthdayVideoComplete = () => {
    setShowBirthdayVideo(false);
    setShowReward(true);
  };

  const handleComplete = () => {
    completeLevel(5);
    router.push('/map');
  };

  const handleSkip = () => {
    completeLevel(5);
    router.push('/map');
  };

  if (showVideo) {
    return (
      <View style={styles.container}>
        <CutscenePlayer
          animationType="ship"
          onComplete={handleVideoComplete}
          duration={3000}
        />
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

  if (showReward) {
    return (
      <View style={styles.container}>
        <Text style={styles.rewardTitle}>Captain's Oath Complete!</Text>
        <Text style={styles.rewardText}>You have earned the Zoro Hoodie</Text>
        <Image
          source={require('@/assets/images/Characters/Zoro.png')}
          style={styles.rewardImage}
        />
        <Text style={styles.closingMessage}>
          Every power must be earned. You have proven your worth.
        </Text>
        <PrimaryButton title="Return to Map" onPress={handleComplete} />
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
  rewardTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  rewardText: {
    color: '#ffd700',
    fontSize: 24,
    marginBottom: 30,
    textAlign: 'center',
  },
  rewardImage: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  closingMessage: {
    color: '#ccc',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
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
});

