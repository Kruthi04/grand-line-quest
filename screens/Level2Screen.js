import CutscenePlayer from "@/components/CutscenePlayer";
import PrimaryButton from "@/components/PrimaryButton";
import { useGame } from "@/context/GameContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
    router.push("/map");
  };

  const handleSkip = () => {
    // Remember that Chirag was at level 2 before unlocking the next level
    setLastChiragLevel(2);
    increasePower(1);
    unlockLevel(3);
    completeLevel(2);
    router.push("/map");
  };

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

  if (showReward) {
    return (
      <View style={styles.container}>
        <Text style={styles.rewardTitle}>Reward Unlocked!</Text>
        <Text style={styles.rewardText}>Manga Gift</Text>
        <Image
          source={require("@/assets/images/Characters/Zoro.png")}
          style={styles.rewardImage}
        />
        <PrimaryButton title="Continue" onPress={handleComplete} />
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
