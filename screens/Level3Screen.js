import CutscenePlayer from "@/components/CutscenePlayer";
import PrimaryButton from "@/components/PrimaryButton";
import { useGame } from "@/context/GameContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Cipher: "Chapter 3, Word 5" = "WISDOM"
// You can customize this based on your manga
const CIPHER_HINT = "Chapter 3, Word 5";
const CORRECT_ANSWER = "WISDOM"; // Player needs to decode this

export default function Level3Screen() {
  const router = useRouter();
  const {
    power,
    getRequiredPower,
    increasePower,
    unlockLevel,
    completeLevel,
    fadeOutHomeMusic,
  } = useGame();
  const [input, setInput] = useState("");

  // Fade out home music when level loads
  useEffect(() => {
    fadeOutHomeMusic();
  }, [fadeOutHomeMusic]);
  const [showCutscene, setShowCutscene] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const requiredPower = getRequiredPower(3);
    setIsUnlocked(power >= requiredPower);
  }, [power]);

  const handleSubmit = () => {
    if (input.toUpperCase().trim() === CORRECT_ANSWER) {
      setShowCutscene(true);
    } else {
      alert("Incorrect. Try again!");
      setInput("");
    }
  };

  const handleCutsceneComplete = () => {
    setShowCutscene(false);
    setShowReward(true);
  };

  const handleComplete = () => {
    increasePower(1);
    unlockLevel(4);
    completeLevel(3);
    router.push("/map");
  };

  const handleSkip = () => {
    increasePower(1);
    unlockLevel(4);
    completeLevel(3);
    router.push("/map");
  };

  if (showCutscene) {
    return (
      <View style={styles.container}>
        <CutscenePlayer
          animationType="wisdom"
          onComplete={handleCutsceneComplete}
          duration={2000}
        />
      </View>
    );
  }

  if (showReward) {
    return (
      <View style={styles.container}>
        <Text style={styles.rewardTitle}>Reward Unlocked!</Text>
        <Text style={styles.rewardText}>Harmonica</Text>
        <Text style={styles.rewardDescription}>
          The wisdom of the seas flows through you
        </Text>
        <Image
          source={require("@/assets/images/Characters/buggy.png")}
          style={styles.rewardImage}
        />
        <PrimaryButton title="Continue" onPress={handleComplete} />
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
      <Text style={styles.title}>Wisdom of the Seas</Text>
      <Text style={styles.subtitle}>Decode the cipher</Text>

      <View style={styles.cipherContainer}>
        <Text style={styles.hint}>Hint:</Text>
        <Text style={styles.cipherHint}>{CIPHER_HINT}</Text>
        <Text style={styles.instruction}>
          Use your physical manga to find the answer
        </Text>

        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Enter the decoded word"
          placeholderTextColor="#888"
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <PrimaryButton title="Submit Answer" onPress={handleSubmit} />
      </View>
    </View>
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
  hint: {
    color: "#fff",
    fontSize: 20,
    marginBottom: 10,
  },
  cipherHint: {
    color: "#ffd700",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  instruction: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 30,
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
  rewardTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
  },
  rewardText: {
    color: "#ffd700",
    fontSize: 24,
    marginBottom: 10,
  },
  rewardDescription: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
  },
  rewardImage: {
    width: 150,
    height: 150,
    marginBottom: 30,
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
});
