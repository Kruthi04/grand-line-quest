import { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Animated } from "react-native";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import PrimaryButton from "@/components/PrimaryButton";
import CutscenePlayer from "@/components/CutscenePlayer";
import { useGame } from "@/context/GameContext";

// Simplified rhythm pattern: Watch the orbs light up, then tap them in the same order
const NUM_ORBS = 5;
const PATTERN_DISPLAY_TIME = 3000; // Show pattern for 3 seconds
const ORB_GLOW_DURATION = 400;

export default function Level4Screen() {
  const router = useRouter();
  const { power, getRequiredPower, increasePower, unlockLevel, completeLevel, fadeOutHomeMusic, pauseHomeMusic } =
    useGame();
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Fade out home music when level loads
  useEffect(() => {
    fadeOutHomeMusic();
  }, [fadeOutHomeMusic]);
  const [phase, setPhase] = useState("title"); // title, introVideo, harmonica, showPattern, playPattern, feedback, complete
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [showHarmonicaVideo, setShowHarmonicaVideo] = useState(false);
  const [waveSound, setWaveSound] = useState(null);
  const [patternSequence, setPatternSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showSanjiText, setShowSanjiText] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [instructionText, setInstructionText] = useState("Watch the pattern...");
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const orbAnimations = useRef(
    Array(NUM_ORBS)
      .fill(0)
      .map(() => new Animated.Value(0))
  ).current;
  const oceanGlowAnim = useRef(new Animated.Value(0)).current;
  const transitionFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const requiredPower = getRequiredPower(4);
    setIsUnlocked(power >= requiredPower);
    
    // Auto-advance from title to intro video after 2 seconds
    if (isUnlocked && phase === "title") {
      const timer = setTimeout(() => {
        pauseHomeMusic(); // Pause music when video starts
        setShowIntroVideo(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [power, isUnlocked, phase, pauseHomeMusic]);

  useEffect(() => {
    return () => {
      if (waveSound) {
        waveSound.unloadAsync();
      }
    };
  }, [waveSound]);

  const handlePlayHarmonica = async () => {
    pauseHomeMusic(); // Pause home music when harmonica video plays
    setShowHarmonicaVideo(true);
    // Don't start wave sound here - wait until after harmonica video completes
  };

  const handleIntroVideoComplete = () => {
    // Start smooth fade transition
    setIsTransitioning(true);
    Animated.timing(transitionFadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      setShowIntroVideo(false);
      setPhase("harmonica");
      // Fade back in
      transitionFadeAnim.setValue(0);
      Animated.timing(transitionFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setIsTransitioning(false);
      });
    });
  };

  const handleHarmonicaVideoComplete = async () => {
    // Start soft wave sound after harmonica video completes
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        require("@/assets/audio/OnePieceThemeBeginTrim.mp3"),
        { shouldPlay: true, isLooping: true, volume: 0.3 }
      );
      setWaveSound(sound);
    } catch (error) {
      console.log("Error loading wave sound:", error);
    }

    // Start smooth fade transition
    setIsTransitioning(true);
    Animated.timing(transitionFadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      setShowHarmonicaVideo(false);
      // Generate a simple pattern: 3-4 orbs in sequence
      const pattern = [0, 2, 4, 1, 3]; // Tap orb 0, then 2, then 4, then 1, then 3
      setPatternSequence(pattern);
      setPhase("showPattern");
      // Fade back in
      transitionFadeAnim.setValue(0);
      Animated.timing(transitionFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setIsTransitioning(false);
        showPatternSequence(pattern);
      });
    });
  };

  const showPatternSequence = (pattern) => {
    setInstructionText("Watch the pattern...");
    let index = 0;
    
    const showNext = () => {
      if (index < pattern.length) {
        const orbIndex = pattern[index];
        
        // Light up the orb
        Animated.sequence([
          Animated.timing(orbAnimations[orbIndex], {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(orbAnimations[orbIndex], {
            toValue: 0,
            duration: ORB_GLOW_DURATION,
            useNativeDriver: true,
          }),
        ]).start();
        
        index++;
        setTimeout(showNext, 600); // Wait 600ms between each orb
      } else {
        // Pattern complete, now player's turn
        setTimeout(() => {
          setPhase("playPattern");
          setInstructionText("Now tap the orbs in the same order!");
          setPlayerSequence([]);
        }, 500);
      }
    };
    
    showNext();
  };

  const handleOrbTap = (orbIndex) => {
    if (phase !== "playPattern") return;

    const newSequence = [...playerSequence, orbIndex];
    setPlayerSequence(newSequence);

    // Visual feedback for tap
    Animated.sequence([
      Animated.timing(orbAnimations[orbIndex], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(orbAnimations[orbIndex], {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Check if sequence is complete
    if (newSequence.length === patternSequence.length) {
      checkPattern(newSequence);
    } else {
      // Check if current tap is correct
      if (newSequence[newSequence.length - 1] !== patternSequence[newSequence.length - 1]) {
        // Wrong tap
        setInstructionText("Wrong! Try again...");
        setTimeout(() => {
          setPlayerSequence([]);
          setPhase("showPattern");
          showPatternSequence(patternSequence);
        }, 1500);
      }
    }
  };

  const checkPattern = (playerSeq) => {
    const isMatch = playerSeq.every(
      (tap, index) => tap === patternSequence[index]
    );

    if (isMatch) {
      setIsCorrect(true);
      setShowFeedback(true);
      setPhase("feedback");
      setInstructionText("Perfect! The ocean responds...");
      
      // Ocean glow animation
      Animated.sequence([
        Animated.timing(oceanGlowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ]).start(() => {
        setShowSanjiText(true);
        setTimeout(() => {
          // Smooth transition to completion
          setIsTransitioning(true);
          Animated.timing(transitionFadeAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }).start(() => {
            setShowCompletion(true);
            transitionFadeAnim.setValue(0);
            Animated.timing(transitionFadeAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }).start(() => {
              setIsTransitioning(false);
            });
          });
        }, 3000);
      });
    } else {
      // Wrong pattern
      setIsCorrect(false);
      setShowFeedback(true);
      setInstructionText("Not quite right. Watch again...");
      setTimeout(() => {
        setShowFeedback(false);
        setPlayerSequence([]);
        setPhase("showPattern");
        showPatternSequence(patternSequence);
      }, 2000);
    }
  };

  const fadeOutAndStop = async () => {
    if (waveSound) {
      try {
        // Fade out over 1 second
        await waveSound.setVolumeAsync(0.3);
        await new Promise((resolve) => setTimeout(resolve, 200));
        await waveSound.setVolumeAsync(0.2);
        await new Promise((resolve) => setTimeout(resolve, 200));
        await waveSound.setVolumeAsync(0.1);
        await new Promise((resolve) => setTimeout(resolve, 200));
        await waveSound.setVolumeAsync(0);
        await new Promise((resolve) => setTimeout(resolve, 200));
        await waveSound.stopAsync();
        await waveSound.unloadAsync();
      } catch (error) {
        console.log("Error fading audio:", error);
        // Fallback: just unload
        try {
          await waveSound.unloadAsync();
        } catch (e) {
          // Ignore
        }
      }
    }
  };

  const handleCompletion = async () => {
    await fadeOutAndStop();
    increasePower(1);
    unlockLevel(5);
    completeLevel(4);
    router.push("/map");
  };

  const handleSkip = async () => {
    await fadeOutAndStop();
    increasePower(1);
    unlockLevel(5);
    completeLevel(4);
    router.push("/map");
  };

  if (showCompletion) {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            opacity: transitionFadeAnim,
          },
        ]}
      >
        <CutscenePlayer
          animationType="ship"
          onComplete={handleCompletion}
          duration={3000}
        />
        <View style={styles.completionTextContainer}>
          <Text style={styles.luffyText}>Nice. Let's keep going.</Text>
        </View>
      </Animated.View>
    );
  }

  if (showIntroVideo) {
    return (
      <View style={styles.videoContainer}>
        <CutscenePlayer
          videoSource={require("@/assets/videos/level4-1.mp4")}
          onComplete={handleIntroVideoComplete}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (showHarmonicaVideo) {
    return (
      <View style={styles.videoContainer}>
        <CutscenePlayer
          videoSource={require("@/assets/videos/HarmonicaFinal.mp4")}
          onComplete={handleHarmonicaVideoComplete}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (!isUnlocked) {
    const requiredPower = getRequiredPower(4);
    return (
      <View style={styles.container}>
        <Text style={styles.lockedTitle}>Breath & Control</Text>
        <Text style={styles.lockedText}>
          This level requires {requiredPower} power.
        </Text>
        <Text style={styles.lockedText}>You have {power} power.</Text>
        <PrimaryButton
          title="Back to Map"
          onPress={() => router.push("/map")}
        />
      </View>
    );
  }

  if (phase === "title") {
    return (
      <View style={styles.container}>
        <Text style={styles.levelTitle}>🎵 LEVEL 4</Text>
        <Text style={styles.levelSubtitle}>The Sound of the Sea</Text>
      </View>
    );
  }

  if (phase === "harmonica") {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            opacity: transitionFadeAnim,
          },
        ]}
      >
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Breath & Control</Text>
        <Text style={styles.subtitle}>The harmonica gift</Text>
        
        <View style={styles.harmonicaContainer}>
          <Text style={styles.harmonicaEmoji}>🎵</Text>
          <Text style={styles.harmonicaText}>Harmonica</Text>
        </View>

        <PrimaryButton
          title="Play the harmonica"
          onPress={handlePlayHarmonica}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: transitionFadeAnim,
        },
      ]}
    >
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>
      
      {showFeedback && isCorrect && (
        <Animated.View
          style={[
            styles.oceanGlow,
            {
              opacity: oceanGlowAnim,
              backgroundColor: "rgba(74, 157, 154, 0.4)",
            },
          ]}
        />
      )}

      {showSanjiText && (
        <View style={styles.sanjiTextContainer}>
          <Text style={styles.sanjiText}>
            "Music isn't noise. It's control."
          </Text>
        </View>
      )}

      <Text style={styles.title}>Listen to the rhythm</Text>
      <Text style={styles.instructionText}>{instructionText}</Text>
      <Text style={styles.subtitle}>
        {phase === "showPattern"
          ? "Watch which orbs light up"
          : "Tap the orbs in the same order"}
      </Text>

      <View style={styles.orbsContainer}>
        {Array(NUM_ORBS)
          .fill(0)
          .map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleOrbTap(index)}
              style={styles.orbTouchArea}
              disabled={phase === "showPattern"}
            >
              <Animated.View
                style={[
                  styles.orb,
                  {
                    opacity: orbAnimations[index],
                    transform: [
                      {
                        scale: orbAnimations[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.4],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Text style={styles.orbNumber}>{index + 1}</Text>
            </TouchableOpacity>
          ))}
      </View>

      {phase === "playPattern" && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Tapped: {playerSequence.length} / {patternSequence.length}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1d2a",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
  },
  instructionText: {
    color: "#4a9d7a",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  lockedTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  lockedText: {
    color: "#ccc",
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  harmonicaContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  harmonicaEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  harmonicaText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
  orbsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    marginVertical: 40,
    flexWrap: "wrap",
  },
  orbTouchArea: {
    width: 80,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  orb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4a9d9a",
    borderWidth: 3,
    borderColor: "#6bc9c9",
    position: "absolute",
  },
  orbNumber: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 65,
  },
  oceanGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sanjiTextContainer: {
    position: "absolute",
    top: 100,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 10,
    zIndex: 5,
  },
  sanjiText: {
    color: "#fff",
    fontSize: 18,
    fontStyle: "italic",
    textAlign: "center",
  },
  completionTextContainer: {
    position: "absolute",
    bottom: 100,
    zIndex: 10,
  },
  luffyText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  progressContainer: {
    marginTop: 20,
  },
  progressText: {
    color: "#fff",
    fontSize: 16,
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
  levelTitle: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 10,
  },
  levelSubtitle: {
    color: "#4a9d7a",
    fontSize: 24,
    fontWeight: "600",
  },
});
