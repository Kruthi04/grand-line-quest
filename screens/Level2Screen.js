import CutscenePlayer from "@/components/CutscenePlayer";
import PrimaryButton from "@/components/PrimaryButton";
import { useGame } from "@/context/GameContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Simple tile rotation puzzle
const INITIAL_TILES = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 0], // 0 is empty
];

const SOLVED_STATE = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 0],
];

export default function Level2Screen() {
  const router = useRouter();
  const {
    power,
    getRequiredPower,
    increasePower,
    unlockLevel,
    completeLevel,
    fadeOutHomeMusic,
    setLastChiragLevel,
  } = useGame();
  const [tiles, setTiles] = useState(INITIAL_TILES);

  // Fade out home music when level loads
  useEffect(() => {
    fadeOutHomeMusic();
  }, [fadeOutHomeMusic]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showCutscene, setShowCutscene] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [showMangaVideo, setShowMangaVideo] = useState(false);

  useEffect(() => {
    const requiredPower = getRequiredPower(2);
    if (power >= requiredPower) {
      setIsUnlocked(true);
      // Shuffle tiles
      shuffleTiles();
    }
  }, [power]);

  const shuffleTiles = () => {
    // Simple shuffle - swap random tiles
    const shuffled = JSON.parse(JSON.stringify(INITIAL_TILES));
    for (let i = 0; i < 10; i++) {
      const row1 = Math.floor(Math.random() * 3);
      const col1 = Math.floor(Math.random() * 3);
      const row2 = Math.floor(Math.random() * 3);
      const col2 = Math.floor(Math.random() * 3);
      [shuffled[row1][col1], shuffled[row2][col2]] = [
        shuffled[row2][col2],
        shuffled[row1][col1],
      ];
    }
    setTiles(shuffled);
  };

  const handleTilePress = (row, col) => {
    if (!isUnlocked) return;

    // Find empty tile (0)
    let emptyRow = -1;
    let emptyCol = -1;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (tiles[r][c] === 0) {
          emptyRow = r;
          emptyCol = c;
          break;
        }
      }
    }

    // Check if adjacent
    const isAdjacent =
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow);

    if (isAdjacent) {
      const newTiles = JSON.parse(JSON.stringify(tiles));
      [newTiles[row][col], newTiles[emptyRow][emptyCol]] = [
        newTiles[emptyRow][emptyCol],
        newTiles[row][col],
      ];
      setTiles(newTiles);

      // Check if solved
      if (JSON.stringify(newTiles) === JSON.stringify(SOLVED_STATE)) {
        setShowCutscene(true);
      }
    }
  };

  const handleCutsceneComplete = () => {
    setShowCutscene(false);
    setShowReward(true);
  };

  const handleComplete = () => {
    // Remember that Chirag was at level 2 before unlocking the next level
    setLastChiragLevel(2);
    increasePower(1);
    unlockLevel(3);
    completeLevel(2);
    setShowReward(true);
  };

  const handleRewardContinue = () => {
    setShowReward(false);
    setShowMangaVideo(true);
  };

  const handleMangaVideoComplete = () => {
    router.push("/map");
  };

  const handleSkip = () => {
    // Remember that Chirag was at level 2 before unlocking the next level
    setLastChiragLevel(2);
    increasePower(1);
    unlockLevel(3);
    completeLevel(2);
    setShowReward(true);
  };

  if (showMangaVideo) {
    return (
      <View style={styles.videoContainer}>
        <CutscenePlayer
          videoSource={require("@/assets/videos/MangaVideo.mp4")}
          onComplete={handleMangaVideoComplete}
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

  if (showCutscene) {
    return (
      <View style={styles.container}>
        <CutscenePlayer
          animationType="strength"
          character={require("@/assets/images/Characters/Zoro.png")}
          onComplete={handleCutsceneComplete}
          duration={2000}
        />
      </View>
    );
  }

  if (!isUnlocked) {
    const requiredPower = getRequiredPower(2);
    return (
      <View style={styles.container}>
        <Text style={styles.lockedTitle}>Trial of Strength</Text>
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
      <Text style={styles.title}>Trial of Strength</Text>
      <Text style={styles.subtitle}>Align the tiles to solve the puzzle</Text>

      <View style={styles.puzzleContainer}>
        {tiles.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((tile, colIndex) => (
              <TouchableOpacity
                key={colIndex}
                style={[styles.tile, tile === 0 && styles.emptyTile]}
                onPress={() => handleTilePress(rowIndex, colIndex)}
                disabled={tile === 0}
              >
                {tile !== 0 && <Text style={styles.tileText}>{tile}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        ))}
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
  puzzleContainer: {
    gap: 5,
  },
  row: {
    flexDirection: "row",
    gap: 5,
  },
  tile: {
    width: 80,
    height: 80,
    backgroundColor: "#1e3d2f",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#4a9d7a",
  },
  emptyTile: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  tileText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
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
    marginBottom: 30,
  },
  rewardImage: {
    width: 150,
    height: 150,
    marginBottom: 30,
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
