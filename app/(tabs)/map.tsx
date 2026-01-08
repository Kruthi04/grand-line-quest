import { useGame } from "@/context/GameContext";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LEVELS = [
  {
    id: 1,
    name: "Observation Haki",
    character: "Shanks",
    image: require("@/assets/images/Characters/Shanks.png"),
  },
  {
    id: 2,
    name: "Trial of Strength",
    character: "Zoro",
    image: require("@/assets/images/Characters/Zoro.png"),
  },
  {
    id: 3,
    name: "Wisdom of the Seas",
    character: "Buggy",
    image: require("@/assets/images/Characters/buggy.png"),
  },
  {
    id: 4,
    name: "Breath & Control",
    character: "Sanji",
    image: require("@/assets/images/Characters/Sanji.png"),
  },
  {
    id: 5,
    name: "Captain's Oath",
    character: "Luffy",
    image: require("@/assets/images/Characters/Luffy.png"),
  },
];

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    isLevelUnlocked,
    getRequiredPower,
    isLevelCompleted,
    homeScreenSound,
    resumeHomeMusic,
  } = useGame();

  // Resume home music if it exists when on map screen
  useEffect(() => {
    if (homeScreenSound) {
      resumeHomeMusic();
    }
  }, [homeScreenSound, resumeHomeMusic]);

  const handleLevelPress = (levelId: number) => {
    if (isLevelUnlocked(levelId)) {
      router.push(`/level/${levelId}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map background image */}
      <Image
        source={require("@/assets/images/map.png")}
        style={styles.mapBackground}
        contentFit="cover"
        contentPosition="center"
        cachePolicy="memory-disk"
        transition={0}
      />

      <Text style={[styles.title, { marginTop: 50 + insets.top }]}>
        The Grand Line
      </Text>

      {/* Island nodes */}
      <ScrollView
        style={styles.islandsContainer}
        contentContainerStyle={[
          styles.islandsContent,
          { paddingBottom: 80 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {LEVELS.map((level, index) => {
          const unlocked = isLevelUnlocked(level.id);
          const completed = isLevelCompleted(level.id);
          const requiredPower = getRequiredPower(level.id);

          return (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.islandNode,
                !unlocked && styles.islandLocked,
                completed && styles.islandCompleted,
              ]}
              onPress={() => handleLevelPress(level.id)}
              disabled={!unlocked}
            >
              {unlocked && (
                <>
                  <Image
                    source={level.image}
                    style={styles.characterImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.levelName}>{level.name}</Text>
                  {!completed && (
                    <Text style={styles.levelStatus}>Tap to begin</Text>
                  )}
                  {completed && (
                    <Text style={styles.levelStatus}>✓ Completed</Text>
                  )}
                </>
              )}
              {!unlocked && (
                <>
                  <Text style={styles.lockedText}>🔒</Text>
                  <Text style={styles.lockedLabel}>Locked</Text>
                  <Text style={styles.powerRequirement}>
                    Power: {requiredPower}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1d2a",
    paddingTop: 0,
    paddingBottom: 0,
    overflow: "hidden",
  },
  mapBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    opacity: 0.9,
    resizeMode: "cover",
  },
  title: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 20,
    zIndex: 1,
  },
  islandsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  islandsContent: {
    paddingBottom: 20,
  },
  islandNode: {
    backgroundColor: "#1e3d2f",
    borderRadius: 15,
    padding: 15,
    marginVertical: 10,
    alignItems: "center",
    minHeight: 120,
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#4a9d7a",
  },
  islandLocked: {
    backgroundColor: "#1a1a1a",
    borderColor: "#444",
    opacity: 0.6,
  },
  islandCompleted: {
    borderColor: "#ffd700",
    backgroundColor: "#2a3d1e",
  },
  characterImage: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  levelName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  levelStatus: {
    color: "#ccc",
    fontSize: 12,
  },
  lockedText: {
    fontSize: 32,
    marginBottom: 8,
  },
  lockedLabel: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  powerRequirement: {
    color: "#666",
    fontSize: 12,
  },
});
