import CutscenePlayer from "@/components/CutscenePlayer";
import PrimaryButton from "@/components/PrimaryButton";
import TypewriterText from "@/components/TypewriterText";
import { useGame } from "@/context/GameContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Images for the memory game (6 pairs = 12 cards)
const MEMORY_IMAGES = [
  require("@/assets/images/MemoryGame/Buggy.jpeg"),
  require("@/assets/images/MemoryGame/char.jpeg"),
  require("@/assets/images/MemoryGame/devilfruit.jpeg"),
  require("@/assets/images/MemoryGame/onepiece_logo.jpeg"),
  require("@/assets/images/MemoryGame/ship.jpeg"),
  require("@/assets/images/MemoryGame/straw_hat.jpeg"),
];

// Conversation dialogue before the game starts
const INTRO_DIALOGUE = [
  {
    character: "shanks",
    text: "Heh… rushing in won't help you here, Chirag.",
  },
  {
    character: "chirag",
    text: "This doesn't look like a fight. What am I supposed to do?",
  },
  {
    character: "shanks",
    text: "Not everything on the sea is won with strength. Sometimes, you learn by revealing things one step at a time.",
  },
  {
    character: "chirag",
    text: "Revealing…?",
  },
  {
    character: "shanks",
    text: "Each choice opens a path, even if only for a moment. Pay attention to what you uncover.",
  },
  {
    character: "chirag",
    text: "So I have to remember what I see.",
  },
  {
    character: "shanks",
    text: "Exactly. One card at a time. Notice the shape. The symbol. The place it appeared.",
  },
  {
    character: "chirag",
    text: "And match them.",
  },
  {
    character: "shanks",
    text: "Yes. Stay calm. Don't force it. Observation Haki grows when you trust your awareness.",
  },
  {
    character: "chirag",
    text: "If I lose focus, I'll forget.",
  },
  {
    character: "shanks",
    text: "Heh. And forgetting is the same as being blind at sea.",
  },
  {
    character: "chirag",
    text: "…Alright. I'll take it slow.",
  },
  {
    character: "shanks",
    text: "Good. Open your senses, Chirag. Let your Observation Haki guide you.",
  },
];

export default function Level1Screen() {
  const router = useRouter();
  const {
    increasePower,
    unlockLevel,
    completeLevel,
    fadeOutHomeMusic,
    setLastChiragLevel,
  } = useGame();
  const [cards, setCards] = useState([]);

  // Fade out home music when level loads
  useEffect(() => {
    fadeOutHomeMusic();
  }, [fadeOutHomeMusic]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [showCutscene, setShowCutscene] = useState(false);
  const [showPowerup, setShowPowerup] = useState(false);
  const [showMatchaVideo, setShowMatchaVideo] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConversation, setShowConversation] = useState(true);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [canAdvance, setCanAdvance] = useState(false);

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    // Create pairs with indices
    const pairsWithIndices = MEMORY_IMAGES.map((image, index) => ({
      image,
      imageIndex: index,
    }));
    const pairs = [...pairsWithIndices, ...pairsWithIndices];

    // Shuffle the cards
    const shuffled = pairs.sort(() => Math.random() - 0.5);

    // Create card objects with id, image, and flipped state
    const cardObjects = shuffled.map((pair, index) => ({
      id: index,
      image: pair.image,
      imageIndex: pair.imageIndex,
      isFlipped: false,
      isMatched: false,
    }));

    setCards(cardObjects);
    setFlippedCards([]);
    setMatchedPairs([]);
  };

  const handleCardPress = (cardId) => {
    // Don't allow interaction if processing or card already flipped/matched
    if (isProcessing || flippedCards.length >= 2) return;

    const card = cards.find((c) => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    // Update card to show it's flipped
    setCards((prevCards) =>
      prevCards.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c))
    );

    // If two cards are flipped, check for match
    if (newFlippedCards.length === 2) {
      setIsProcessing(true);

      setTimeout(() => {
        const [firstId, secondId] = newFlippedCards;
        const firstCard = cards.find((c) => c.id === firstId);
        const secondCard = cards.find((c) => c.id === secondId);

        if (
          firstCard &&
          secondCard &&
          firstCard.imageIndex === secondCard.imageIndex
        ) {
          // Match found!
          const newMatchedPairs = [...matchedPairs, firstCard.imageIndex];
          setMatchedPairs(newMatchedPairs);

          setCards((prevCards) =>
            prevCards.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, isMatched: true, isFlipped: true }
                : c
            )
          );

          // Check if all pairs are matched
          if (newMatchedPairs.length === MEMORY_IMAGES.length) {
            // Game complete! Skip cutscene and go directly to powerup
            setTimeout(() => {
              setShowPowerup(true);
            }, 500);
          }
        } else {
          // No match - flip cards back
          setCards((prevCards) =>
            prevCards.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, isFlipped: false }
                : c
            )
          );
        }

        setFlippedCards([]);
        setIsProcessing(false);
      }, 1000); // Wait 1 second before checking/flipping back
    }
  };

  const handleCutsceneComplete = () => {
    setShowCutscene(false);
    setShowPowerup(true);
  };

  const handlePowerup = () => {
    setShowPowerup(false);
    setShowMatchaVideo(true);
  };

  const handleMatchaVideoComplete = () => {
    // Remember that Chirag was at level 1 before unlocking the next level
    setLastChiragLevel(1);
    increasePower(1);
    unlockLevel(2);
    completeLevel(1);
    router.push("/map");
  };

  const handleSkip = () => {
    // Remember that Chirag was at level 1 before unlocking the next level
    setLastChiragLevel(1);
    increasePower(1);
    unlockLevel(2);
    completeLevel(1);
    router.push("/map");
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
                    styles.chiragMirrored,
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

              {/* Shanks on the right */}
              <View style={styles.characterWrapper}>
                <Image
                  source={require("@/assets/images/Characters/Shanks.png")}
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

            {/* Speech bubble for Shanks (right side, below) */}
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

  if (showMatchaVideo) {
    return (
      <View style={styles.videoContainer}>
        <CutscenePlayer
          videoSource={require("@/assets/videos/chiragDrinkingMatcha.mp4")}
          onComplete={handleMatchaVideoComplete}
        />
      </View>
    );
  }

  if (showPowerup) {
    return (
      <View style={styles.container}>
        <Text style={styles.powerupTitle}>Power Unlocked!</Text>
        <Text style={styles.powerupText}>Observation Haki</Text>
        <Text style={styles.rewardReminder}>
          Collect your reward before going to the next level.
        </Text>
        <PrimaryButton title="Continue" onPress={handlePowerup} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Observation Haki</Text>
      <Text style={styles.subtitle}>
        Find all matching pairs! ({matchedPairs.length}/{MEMORY_IMAGES.length})
      </Text>

      <View style={styles.grid}>
        {cards.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={[
              styles.card,
              card.isFlipped || card.isMatched
                ? styles.cardFlipped
                : styles.cardHidden,
            ]}
            onPress={() => handleCardPress(card.id)}
            disabled={card.isMatched || isProcessing}
          >
            {card.isFlipped || card.isMatched ? (
              <Image
                source={card.image}
                style={styles.cardImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.cardBack}>?</Text>
            )}
          </TouchableOpacity>
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
  videoContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  title: {
    color: "#000",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    color: "#000",
    fontSize: 18,
    marginBottom: 30,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    maxWidth: 400,
    gap: 10,
    marginBottom: 20,
  },
  card: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    overflow: "hidden",
    margin: 4,
  },
  cardHidden: {
    backgroundColor: "#1e3d2f",
    borderColor: "#4a9d7a",
  },
  cardFlipped: {
    backgroundColor: "#fff",
    borderColor: "#4a9d7a",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardBack: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "bold",
  },
  powerupTitle: {
    color: "#000",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
  },
  powerupText: {
    color: "#000",
    fontSize: 24,
    marginBottom: 20,
  },
  rewardReminder: {
    color: "#ffd700",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 40,
    fontStyle: "italic",
    paddingHorizontal: 20,
  },
  resetButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#1e3d2f",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4a9d7a",
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  skipButton: {
    position: "absolute",
    top: 50,
    right: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#1e3d2f",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#4a9d7a",
    zIndex: 10,
  },
  skipButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  rewardContainer: {
    flex: 1,
    backgroundColor: "#ffeb3b",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  rewardCard: {
    width: "100%",
    maxWidth: 400,
    padding: 30,
    backgroundColor: "#1e3d2f",
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4a9d7a",
  },
  rewardTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  rewardMessage: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 26,
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
  chiragMirrored: {
    transform: [{ scaleX: -1 }],
  },
  activeCharacter: {
    opacity: 1,
  },
  inactiveCharacter: {
    opacity: 0.4,
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
    bottom: 100,
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
