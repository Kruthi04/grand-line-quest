import { Audio } from "expo-av";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DialogueBox from "../components/DialogueBox";

const DIALOGUE = [
  {
    character: "shanks",
    text: "The Grand Line isn’t for everyone.",
  },
  {
    character: "shanks",
    text: "But you have the will.",
  },
  {
    character: "power",
    text: "Every power must be earned.",
  },
  {
    character: "luffy",
    text: "Let’s go! This’ll be fun!",
  },
];

export default function HomeScreen() {
  const [index, setIndex] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const [sound, setSound] = useState(null);
  const [canAdvance, setCanAdvance] = useState(false);

  async function playPowerLine() {
    const { sound } = await Audio.Sound.createAsync(
      require("../assets/audio/power_line.mp3")
    );
    setSound(sound);
    await sound.playAsync();
  }

  useEffect(() => {
    if (DIALOGUE[index]?.character === "power") {
      playPowerLine();
    }

    if (index === DIALOGUE.length) {
      setShowButton(true);
    }

    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [index]);

  const current = DIALOGUE[index];

  function next() {
    if (!canAdvance) return;

    if (index < DIALOGUE.length) {
      setCanAdvance(false);
      setIndex(index + 1);
    }
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={styles.container}
      onPress={next}
      disabled={showButton}
    >
      {/* Title */}
      <Text style={styles.title}>The Grand Line Quest</Text>
      <Text style={styles.subtitle}>Every power must be earned.</Text>

      {/* Character display */}
      {current?.character === "shanks" && (
        <Image
          source={require("../assets/images/shanks.png")}
          style={styles.character}
        />
      )}

      {current?.character === "luffy" && (
        <Image
          source={require("../assets/images/luffy.png")}
          style={styles.character}
        />
      )}

      {/* Power line (centered text) */}
      {current?.character === "power" && (
        <View style={styles.powerContainer}>
          <Text style={styles.powerText}>{current.text}</Text>
        </View>
      )}

      {/* Dialogue box */}
      {current && current.character !== "power" && (
  <DialogueBox
    text={current.text}
    onComplete={() => setCanAdvance(true)}
  />
)}

      {/* Begin Button */}
      {showButton && (
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Begin the Quest</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1d2a",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    position: "absolute",
    top: 80,
    fontSize: 32,
    color: "#d56e3e",
    fontWeight: "bold",
  },
  subtitle: {
    position: "absolute",
    top: 120,
    fontSize: 14,
    color: "#ccc",
  },
  character: {
    width: 220,
    height: 220,
    resizeMode: "contain",
  },
  powerContainer: {
    position: "absolute",
    center: "50%",
  },
  powerText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  button: {
    position: "absolute",
    bottom: 80,
    backgroundColor: "#1e3d2f",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
