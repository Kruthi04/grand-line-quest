import CutscenePlayer from "@/components/CutscenePlayer";
import PrimaryButton from "@/components/PrimaryButton";
import { useGame } from "@/context/GameContext";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Individual hint boxes component (no animation to avoid native driver issues)
function HintBox({ hint, isExpanded, onToggle }) {
  return (
    <View style={styles.hintBoxContainer}>
      <TouchableOpacity
        style={styles.hintBoxHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.hintBoxTitle}>💡 Hint</Text>
        <Text style={styles.hintBoxToggle}>{isExpanded ? "−" : "+"}</Text>
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.hintBoxContent}>
          <Text style={styles.hintBoxText}>{hint}</Text>
        </View>
      )}
    </View>
  );
}

// Target sentence for this level
const TARGET_SENTENCE = "i'm a brave and gallant pirate";

export default function Level3Screen() {
  const router = useRouter();
  const {
    power,
    getRequiredPower,
    increasePower,
    unlockLevel,
    completeLevel,
    fadeOutHomeMusic,
    setLastChiragLevel,
    isLevelCompleted,
  } = useGame();
  const [input, setInput] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [showHarmonicaVideo, setShowHarmonicaVideo] = useState(false);
  const [showOopsVideo, setShowOopsVideo] = useState(false);
  const [showWrongAnswerMessage, setShowWrongAnswerMessage] = useState(false);
  const [hintLevel, setHintLevel] = useState(0); // 0 = poem only, 1..3 = progressively more hints
  const [expandedHints, setExpandedHints] = useState({}); // Track which hint boxes are expanded
  const [showVideo, setShowVideo] = useState(false);

  const pageSoundRef = useRef(null);
  const successOpacity = useRef(new Animated.Value(0)).current;
  const hasPlayedVideoRef = useRef(false);
  const oopsVideoIndexRef = useRef(0); // Track which oops video to show (0 = oops.mp4, 1 = oops2.mp4)

  // Fade out home music when level loads
  useEffect(() => {
    fadeOutHomeMusic();
  }, [fadeOutHomeMusic]);
  const [showCutscene, setShowCutscene] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const requiredPower = getRequiredPower(3);
    const unlocked = power >= requiredPower;
    const completed = isLevelCompleted(3);
    setIsUnlocked(unlocked);
    // Show video only the first time level is unlocked and not yet completed
    if (unlocked && !completed && !hasPlayedVideoRef.current) {
      setShowVideo(true);
      hasPlayedVideoRef.current = true;
    }
  }, [power, getRequiredPower, isLevelCompleted]);

  // Load soft page-turn sound for success moment
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
        const { sound } = await Audio.Sound.createAsync(
          require("@/assets/audio/onepiecendTrim.mp3"),
          { shouldPlay: false, volume: 0.4 }
        );
        if (isMounted) {
          pageSoundRef.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch (e) {
        console.log("Error loading page sound:", e);
      }
    })();

    return () => {
      isMounted = false;
      if (pageSoundRef.current) {
        pageSoundRef.current.unloadAsync();
      }
    };
  }, []);

  const normalizeSentence = (text) => {
    return text
      .toLowerCase()
      .replace(/[’']/g, "") // ignore apostrophes
      .replace(/\s+/g, " ")
      .trim();
  };

  // Helper function to toggle hints with max 2 open at once
  const handleHintToggle = (hintId) => {
    setExpandedHints((prev) => {
      const newExpanded = { ...prev };
      const isCurrentlyExpanded = newExpanded[hintId] || false;

      if (isCurrentlyExpanded) {
        // Closing this hint - just remove it
        delete newExpanded[hintId];
        return newExpanded;
      } else {
        // Opening this hint - check if we're at max (2)
        const currentlyOpenCount =
          Object.values(newExpanded).filter(Boolean).length;

        if (currentlyOpenCount >= 2) {
          // Find the oldest (lowest numbered) hint and close it
          const openHintIds = Object.keys(newExpanded)
            .map(Number)
            .filter((id) => newExpanded[id])
            .sort((a, b) => a - b);

          if (openHintIds.length > 0) {
            delete newExpanded[openHintIds[0]]; // Close the oldest hint
          }
        }

        // Open the new hint
        newExpanded[hintId] = true;
        return newExpanded;
      }
    });
  };

  const handleSubmit = () => {
    const normalizedInput = normalizeSentence(input);
    const normalizedTarget = normalizeSentence(TARGET_SENTENCE);

    if (normalizedInput === normalizedTarget) {
      setShowSuccess(true);
      successOpacity.setValue(0);
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }).start();
    } else {
      // Show video based on current index (0 = oops.mp4, 1 = oops2.mp4)
      // Index will be incremented after video completes for next time
      setShowOopsVideo(true);
    }
  };

  const handleComplete = () => {
    // Remember that Chirag was at level 3 before unlocking the next level
    setLastChiragLevel(3);
    increasePower(1);
    unlockLevel(4);
    completeLevel(3);
    setShowReward(true);
  };

  const handleRewardContinue = () => {
    setShowReward(false);
    setShowHarmonicaVideo(true);
  };

  const handleHarmonicaVideoComplete = () => {
    router.push("/map");
  };

  const handleOopsVideoComplete = () => {
    setShowOopsVideo(false);
    setShowWrongAnswerMessage(true);
    // Increment index for next wrong answer (alternate between 0 and 1)
    oopsVideoIndexRef.current = (oopsVideoIndexRef.current + 1) % 2;
    // Auto-return to game after 2 seconds
    setTimeout(() => {
      setShowWrongAnswerMessage(false);
      setInput(""); // Clear the input field
    }, 2000);
  };

  const handleSkip = () => {
    // Remember that Chirag was at level 3 before unlocking the next level
    setLastChiragLevel(3);
    increasePower(1);
    unlockLevel(4);
    completeLevel(3);
    router.push("/map");
  };

  const handleVideoComplete = () => {
    setShowVideo(false);
  };

  if (showWrongAnswerMessage) {
    return (
      <View style={styles.messageContainer}>
        <View style={styles.messageCard}>
          <Text style={styles.messageText}>It's a wrong answer</Text>
        </View>
      </View>
    );
  }

  if (showOopsVideo) {
    // First wrong answer: index 0 -> oops.mp4
    // Second wrong answer: index 1 -> oops2.mp4 (after first increment)
    // Third wrong answer: index 0 -> oops.mp4 (after second increment wraps back)
    const currentVideoIndex = oopsVideoIndexRef.current;
    return (
      <View style={styles.videoContainer}>
        <CutscenePlayer
          videoSource={
            currentVideoIndex === 1
              ? require("@/assets/videos/oops2.mp4")
              : require("@/assets/videos/oops.mp4")
          }
          onComplete={handleOopsVideoComplete}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (showVideo && isUnlocked) {
    return (
      <View style={styles.videoContainer}>
        <CutscenePlayer
          videoSource={require("@/assets/videos/luffyAndUsopp.mp4")}
          onComplete={handleVideoComplete}
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

  if (showReward) {
    return (
      <View style={styles.rewardContainer}>
        <View style={styles.rewardCard}>
          {/* Decorative corner elements */}
          <View style={styles.cornerDecorLeft} />
          <View style={styles.cornerDecorRight} />

          {/* Star decorations */}
          <Text style={styles.starDecor1}>✦</Text>
          <Text style={styles.starDecor2}>✦</Text>

          <View style={styles.rewardContent}>
            <Text style={styles.rewardBadge}>✓</Text>
            <Text style={styles.rewardTitle}>LEVEL COMPLETE!</Text>
            <View style={styles.dividerLine} />
            <Text style={styles.rewardMessage}>
              Collect your reward for completing the level.
            </Text>
            <PrimaryButton title="Continue" onPress={handleRewardContinue} />
          </View>
        </View>
      </View>
    );
  }

  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        <Animated.View
          style={[styles.successCard, { opacity: successOpacity }]}
        >
          <Text style={styles.successTitle}>Words of a True Pirate</Text>
          <Text style={styles.successSentence}>
            "I'm a brave and gallant pirate"
          </Text>
          <Text style={styles.successQuote}>
            Sometimes, lies are acts of courage.
          </Text>
          <PrimaryButton title="Continue" onPress={handleComplete} />
        </Animated.View>
      </View>
    );
  }

  if (!isUnlocked) {
    const requiredPower = getRequiredPower(3);
    return (
      <View style={styles.container}>
        <Text style={styles.lockedTitle}>Wisdom of the Seas</Text>
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

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>Words of a True Pirate</Text>
          <Text style={styles.subtitle}>Seek the hidden sentence.</Text>
        </View>

        <View style={styles.cipherContainer}>
          <Text style={styles.poemLine}>Seek the words spoken by a liar,</Text>
          <Text style={styles.poemLine}>when courage was finally chosen.</Text>

          <Text style={styles.referenceText}>East Blue • Chapter 24</Text>

          <View style={styles.inputBlock}>
            <Text style={styles.inputInstruction}>
              Enter the sentence exactly as written.
            </Text>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Type the full sentence"
              placeholderTextColor="#888"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <PrimaryButton title="Submit" onPress={handleSubmit} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.hintsSection}>
        <ScrollView
          style={styles.hintsScrollView}
          contentContainerStyle={styles.hintsScrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {hintLevel === 0 && (
            <PrimaryButton
              title="I need a hint"
              onPress={() => {
                setHintLevel(1);
                setExpandedHints({ 1: true }); // Only expand hint 1, collapse others
              }}
            />
          )}

          {hintLevel === 1 && (
            <PrimaryButton
              title="Next hint"
              onPress={() => {
                setHintLevel(2);
                // Keep hint 1 open if it was open, add hint 2, but max 2 total
                setExpandedHints((prev) => {
                  const newExpanded = { ...prev };
                  // If hint 1 is open and we're adding hint 2, that's 2 total - OK
                  // If hint 1 is closed, just open hint 2
                  if (newExpanded[1]) {
                    newExpanded[2] = true;
                    // Ensure max 2 - if somehow more are open, close oldest
                    const openIds = Object.keys(newExpanded)
                      .map(Number)
                      .filter((id) => newExpanded[id])
                      .sort((a, b) => a - b);
                    if (openIds.length > 2) {
                      delete newExpanded[openIds[0]];
                    }
                  } else {
                    newExpanded[2] = true;
                  }
                  return newExpanded;
                });
              }}
            />
          )}

          {hintLevel === 2 && (
            <PrimaryButton
              title="Next hint"
              onPress={() => {
                setHintLevel(3);
                // Add hint 3, but ensure max 2 open
                setExpandedHints((prev) => {
                  const newExpanded = { ...prev };
                  newExpanded[3] = true;
                  // If we have more than 2 open, close the oldest
                  const openIds = Object.keys(newExpanded)
                    .map(Number)
                    .filter((id) => newExpanded[id])
                    .sort((a, b) => a - b);
                  if (openIds.length > 2) {
                    delete newExpanded[openIds[0]];
                  }
                  return newExpanded;
                });
              }}
            />
          )}

          {hintLevel === 3 && (
            <PrimaryButton
              title="Final hint"
              onPress={() => {
                setHintLevel(4);
                // Add hint 4, but ensure max 2 open
                setExpandedHints((prev) => {
                  const newExpanded = { ...prev };
                  newExpanded[4] = true;
                  // If we have more than 2 open, close the oldest
                  const openIds = Object.keys(newExpanded)
                    .map(Number)
                    .filter((id) => newExpanded[id])
                    .sort((a, b) => a - b);
                  if (openIds.length > 2) {
                    delete newExpanded[openIds[0]];
                  }
                  return newExpanded;
                });
              }}
            />
          )}

          {hintLevel >= 1 && (
            <HintBox
              hint="Not shouted in battle… but spoken from the heart."
              isExpanded={expandedHints[1] || false}
              onToggle={() => handleHintToggle(1)}
            />
          )}

          {hintLevel >= 2 && (
            <HintBox
              hint="Find the line where he names himself."
              isExpanded={expandedHints[2] || false}
              onToggle={() => handleHintToggle(2)}
            />
          )}

          {hintLevel >= 3 && (
            <HintBox
              hint="Not what others think of him — what he claims to be."
              isExpanded={expandedHints[3] || false}
              onToggle={() => handleHintToggle(3)}
            />
          )}

          {hintLevel >= 4 && (
            <HintBox
              hint="A sick girl believed him… because she needed to."
              isExpanded={expandedHints[4] || false}
              onToggle={() => handleHintToggle(4)}
            />
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1d2a",
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
    paddingTop: 80,
    paddingBottom: 200, // Space for hints section at bottom
  },
  headerSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    color: "#ccc",
    fontSize: 16,
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
  cipherContainer: {
    width: "100%",
    alignItems: "center",
  },
  hintsSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(11, 29, 42, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(74, 157, 154, 0.3)",
    maxHeight: 300,
  },
  hintsScrollView: {
    flex: 1,
  },
  hintsScrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  poemLine: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
  referenceText: {
    color: "#ffd700",
    fontSize: 16,
    marginTop: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  hintBoxContainer: {
    width: "100%",
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "rgba(30, 61, 47, 0.6)",
    borderWidth: 1,
    borderColor: "#4a9d7a",
    overflow: "hidden",
    alignSelf: "stretch",
  },
  hintBoxHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: "rgba(74, 157, 154, 0.2)",
  },
  hintBoxTitle: {
    color: "#ffd700",
    fontSize: 16,
    fontWeight: "600",
  },
  hintBoxToggle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  hintBoxContent: {
    overflow: "hidden",
  },
  hintBoxContentInner: {
    position: "absolute",
    width: "100%",
  },
  hintBoxText: {
    color: "#ccc",
    fontSize: 15,
    padding: 14,
    lineHeight: 22,
  },
  inputBlock: {
    width: "100%",
    marginTop: 24,
  },
  inputInstruction: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#1e3d2f",
    color: "#fff",
    fontSize: 18,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#4a9d7a",
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
  successContainer: {
    flex: 1,
    backgroundColor: "#0b1d2a",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successCard: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 16,
    alignItems: "center",
  },
  successTitle: {
    color: "#ffd700",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  successSentence: {
    color: "#fff",
    fontSize: 20,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 16,
  },
  successQuote: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  rewardContainer: {
    flex: 1,
    backgroundColor: "#0b1d2a",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  rewardCard: {
    width: "90%",
    maxWidth: 380,
    backgroundColor: "#1a1a2e",
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffd700",
    shadowColor: "#ffd700",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden",
    position: "relative",
  },
  cornerDecorLeft: {
    position: "absolute",
    top: -1,
    left: -1,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#ffd700",
    borderTopLeftRadius: 24,
  },
  cornerDecorRight: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#ffd700",
    borderBottomRightRadius: 24,
  },
  starDecor1: {
    position: "absolute",
    top: 15,
    left: 20,
    fontSize: 24,
    color: "#ffd700",
    opacity: 0.6,
  },
  starDecor2: {
    position: "absolute",
    top: 15,
    right: 20,
    fontSize: 24,
    color: "#ffd700",
    opacity: 0.6,
  },
  rewardContent: {
    width: "100%",
    padding: 28,
    alignItems: "center",
    zIndex: 1,
  },
  rewardBadge: {
    fontSize: 64,
    color: "#ffd700",
    marginBottom: 12,
    textShadowColor: "rgba(255, 215, 0, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  rewardTitle: {
    color: "#ffd700",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: "center",
    textTransform: "uppercase",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  dividerLine: {
    width: "80%",
    height: 2,
    backgroundColor: "#ffd700",
    marginBottom: 20,
    opacity: 0.5,
  },
  rewardMessage: {
    color: "#e0e0e0",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 24,
    fontWeight: "500",
  },
  videoContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  messageContainer: {
    flex: 1,
    backgroundColor: "#0b1d2a",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  messageCard: {
    width: "100%",
    maxWidth: 400,
    padding: 30,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ff6b6b",
  },
  messageText: {
    color: "#ff6b6b",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
});
