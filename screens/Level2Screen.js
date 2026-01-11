import CutscenePlayer from "@/components/CutscenePlayer";
import PrimaryButton from "@/components/PrimaryButton";
import TypewriterText from "@/components/TypewriterText";
import { useGame } from "@/context/GameContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Conversation dialogue before the game starts
const INTRO_DIALOGUE = [
  {
    character: "zoro",
    text: "So… you drank the matcha.",
  },
  {
    character: "chirag",
    text: "Yeah. I can feel it. My body feels heavier… but stronger.",
  },
  {
    character: "zoro",
    text: "Good. Strength always comes with weight. If you can't carry it, you're not ready.",
  },
  {
    character: "chirag",
    text: "What's this trial?",
  },
  {
    character: "zoro",
    text: "Eight blocks. Numbers from one to eight. They're out of order.",
  },
  {
    character: "chirag",
    text: "That's it?",
  },
  {
    character: "zoro",
    text: "Don't get comfortable. Move them. Rearrange them. Put them in order.",
  },
  {
    character: "chirag",
    text: "Sounds simple.",
  },
  {
    character: "zoro",
    text: "It isn't. Every move costs focus. Every mistake wastes strength.",
  },
  {
    character: "chirag",
    text: "So I can't rush it.",
  },
  {
    character: "zoro",
    text: "Exactly. A swordsman doesn't swing wildly. Each step has to be deliberate.",
  },
  {
    character: "chirag",
    text: "One through eight… clean and exact.",
  },
  {
    character: "zoro",
    text: "No shortcuts. No guessing. If your hands move before your mind, you fail.",
  },
  {
    character: "chirag",
    text: "And if I finish?",
  },
  {
    character: "zoro",
    text: "Then you've proven you can control the power you gained. Strength without control is useless.",
  },
  {
    character: "chirag",
    text: "Alright.",
  },
  {
    character: "zoro",
    text: "Good. Stand firm. Breathe. Show me you deserve it.",
  },
];

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
    // fadeOutHomeMusic,
    resumeHomeMusic,
    setLastChiragLevel,
  } = useGame();
  const [tiles, setTiles] = useState(INITIAL_TILES);

  // Fade out home music when level loads
  // useEffect(() => {
  //   fadeOutHomeMusic();
  // }, [fadeOutHomeMusic]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showCutscene, setShowCutscene] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [showMangaVideo, setShowMangaVideo] = useState(false);
  const [showConversation, setShowConversation] = useState(true);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [canAdvance, setCanAdvance] = useState(false);

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
    resumeHomeMusic();
    setShowCutscene(false);
    setShowReward(true);
  };

  const handleComplete = () => {
    // Remember that Chirag was at level 2 before unlocking the next level
    setLastChiragLevel(2);
    increasePower(1);
    unlockLevel(3);
    resumeHomeMusic();
    completeLevel(2);
    setShowReward(true);
  };

  const handleRewardContinue = () => {
    setShowReward(false);
    setShowMangaVideo(true);
  };

  const handleMangaVideoComplete = () => {
    resumeHomeMusic();
    router.push("/map");
  };

  const handleSkip = () => {
    // Remember that Chirag was at level 2 before unlocking the next level
    setLastChiragLevel(2);
    increasePower(1);
    unlockLevel(3);
    completeLevel(2);
    resumeHomeMusic();
    setShowReward(true);
  };

  const handleDialogueNext = () => {
    if (!canAdvance) return;

    setCanAdvance(false);
    if (dialogueIndex < INTRO_DIALOGUE.length - 1) {
      setDialogueIndex(dialogueIndex + 1);
    } else {
      // Conversation complete, start the game
      setShowConversation(false);
    }
  };

  const handleDialogueComplete = () => {
    setCanAdvance(true);
  };

  if (showConversation) {
    const currentDialogue = INTRO_DIALOGUE[dialogueIndex];
    if (!currentDialogue) {
      setShowConversation(false);
      return null;
    }

    const isChiragSpeaking = currentDialogue.character === "chirag";

    const handleConversationSkip = () => {
      setShowConversation(false);
    };

    return (
      <View style={styles.conversationContainer}>
        {/* Skip button */}
        <TouchableOpacity
          style={styles.conversationSkipButton}
          onPress={handleConversationSkip}
        >
          <Text style={styles.conversationSkipButtonText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={1}
          style={styles.conversationTouchable}
          onPress={handleDialogueNext}
          disabled={!canAdvance}
        >
          {/* Manga-style background */}
          <View style={styles.mangaBackground}>
            {/* Characters facing each other */}
            <View style={styles.charactersContainer}>
              {/* Chirag on the left */}
              <View style={styles.characterWrapper}>
                <Image
                  source={require("@/assets/images/Characters/chirag.png")}
                  style={[
                    styles.conversationCharacter,
                    {
                      opacity: isChiragSpeaking ? 1 : 0.4,
                      transform: [
                        { scaleX: -1 },
                        { scale: isChiragSpeaking ? 1.1 : 1 },
                      ],
                    },
                  ]}
                />
              </View>

              {/* Zoro on the right */}
              <View style={styles.characterWrapper}>
                <Image
                  source={require("@/assets/images/Characters/Zoro.png")}
                  style={[
                    styles.conversationCharacter,
                    {
                      opacity: !isChiragSpeaking ? 1 : 0.4,
                      transform: [{ scale: !isChiragSpeaking ? 1.1 : 1 }],
                    },
                  ]}
                />
              </View>
            </View>

            {/* Speech bubble for Chirag (left side, above) */}
            {isChiragSpeaking && (
              <View style={styles.speechBubbleLeft}>
                <View style={styles.speechBubbleContent}>
                  <TypewriterText
                    text={currentDialogue.text}
                    speed={30}
                    onComplete={handleDialogueComplete}
                  />
                </View>
                <View style={styles.speechBubbleTailLeft} />
              </View>
            )}

            {/* Speech bubble for Zoro (right side, below) */}
            {!isChiragSpeaking && (
              <View style={styles.speechBubbleRight}>
                <View style={styles.speechBubbleTailRight} />
                <View style={styles.speechBubbleContent}>
                  <TypewriterText
                    text={currentDialogue.text}
                    speed={30}
                    onComplete={handleDialogueComplete}
                  />
                </View>
              </View>
            )}

            {/* Tap to continue hint */}
            {canAdvance && <Text style={styles.tapHint}>Tap to continue</Text>}
          </View>
        </TouchableOpacity>
      </View>
    );
  }

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
            <PrimaryButton
              title="Continue"
              onPress={handleRewardContinue}
              style={styles.continueButton}
              textStyle={styles.continueButtonText}
            />
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
    backgroundColor: "#ffeb3b",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    color: "#000",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    color: "#333",
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
    backgroundColor: "#ffeb3b",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  rewardCard: {
    width: "90%",
    maxWidth: 380,
    backgroundColor: "#1e3d2f",
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#4a9d7a",
    shadowColor: "#4a9d7a",
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
    borderColor: "#4a9d7a",
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
    borderColor: "#4a9d7a",
    borderBottomRightRadius: 24,
  },
  starDecor1: {
    position: "absolute",
    top: 15,
    left: 20,
    fontSize: 24,
    color: "#ffeb3b",
    opacity: 0.8,
  },
  starDecor2: {
    position: "absolute",
    top: 15,
    right: 20,
    fontSize: 24,
    color: "#ffeb3b",
    opacity: 0.8,
  },
  rewardContent: {
    width: "100%",
    padding: 28,
    alignItems: "center",
    zIndex: 1,
  },
  rewardBadge: {
    fontSize: 64,
    color: "#ffeb3b",
    marginBottom: 12,
    textShadowColor: "rgba(255, 235, 59, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  rewardTitle: {
    color: "#fff",
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
    backgroundColor: "#4a9d7a",
    marginBottom: 20,
    opacity: 0.5,
  },
  rewardMessage: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 24,
    fontWeight: "500",
  },
  continueButton: {
    backgroundColor: "rgba(30, 61, 47, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(74, 157, 154, 0.5)",
  },
  continueButtonText: {
    color: "#fff",
    fontWeight: "700",
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
  conversationContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "relative",
  },
  conversationTouchable: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  conversationSkipButton: {
    position: "absolute",
    top: 50,
    right: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#000",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#000",
    zIndex: 2000,
    elevation: 20,
  },
  conversationSkipButtonText: {
    color: "#ffeb3b",
    fontSize: 14,
    fontWeight: "600",
  },
  mangaBackground: {
    flex: 1,
    backgroundColor: "#ffeb3b",
    position: "relative",
    width: "100%",
    overflow: "hidden",
  },
  charactersContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 120,
    paddingBottom: 200,
  },
  characterWrapper: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "50%",
  },
  conversationCharacter: {
    width: 280,
    height: 400,
    resizeMode: "contain",
    maxWidth: "100%",
    maxHeight: 400,
  },
  speechBubbleLeft: {
    position: "absolute",
    top: 100,
    left: "10%",
    width: "40%",
    zIndex: 1000,
    elevation: 10,
    alignItems: "flex-start",
  },
  speechBubbleRight: {
    position: "absolute",
    bottom: 160,
    right: "10%",
    width: "40%",
    zIndex: 1000,
    elevation: 10,
    alignItems: "flex-end",
  },
  speechBubbleContent: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#000000",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    minHeight: 60,
    justifyContent: "center",
  },
  speechBubbleTailLeft: {
    width: 20,
    height: 20,
    backgroundColor: "#ffffff",
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: "#000000",
    transform: [{ rotate: "45deg" }],
    marginTop: -10,
    marginLeft: 20,
    alignSelf: "flex-start",
  },
  speechBubbleTailRight: {
    width: 20,
    height: 20,
    backgroundColor: "#ffffff",
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: "#000000",
    transform: [{ rotate: "45deg" }],
    marginBottom: -10,
    marginRight: 20,
    alignSelf: "flex-end",
  },
  tapHint: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
});
