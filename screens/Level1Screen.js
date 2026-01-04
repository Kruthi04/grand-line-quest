import CutscenePlayer from "@/components/CutscenePlayer";
import PrimaryButton from "@/components/PrimaryButton";
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

export default function Level1Screen() {
  const router = useRouter();
  const { increasePower, unlockLevel, completeLevel, fadeOutHomeMusic } =
    useGame();
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
  const [isProcessing, setIsProcessing] = useState(false);

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
            // Game complete!
            setTimeout(() => {
              setShowCutscene(true);
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
    increasePower(1);
    unlockLevel(2);
    completeLevel(1);
    router.push("/map");
  };

  const handleSkip = () => {
    increasePower(1);
    unlockLevel(2);
    completeLevel(1);
    router.push("/map");
  };

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

  if (showCutscene) {
    return (
      <View style={styles.container}>
        <CutscenePlayer
          animationType="matcha"
          onComplete={handleCutsceneComplete}
          duration={2000}
        />
      </View>
    );
  }

  if (showPowerup) {
    return (
      <View style={styles.container}>
        <Text style={styles.powerupTitle}>Power Unlocked!</Text>
        <Text style={styles.powerupText}>Observation Haki</Text>
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

      <TouchableOpacity style={styles.resetButton} onPress={initializeGame}>
        <Text style={styles.resetButtonText}>Reset Game</Text>
      </TouchableOpacity>
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
  videoContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    color: "#ccc",
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
    width: 90,
    height: 90,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    overflow: "hidden",
  },
  cardHidden: {
    backgroundColor: "#1e3d2f",
    borderColor: "#4a9d7a",
  },
  cardFlipped: {
    backgroundColor: "#2a4d3a",
    borderColor: "#6bc99a",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardBack: {
    fontSize: 32,
    color: "#4a9d7a",
    fontWeight: "bold",
  },
  powerupTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
  },
  powerupText: {
    color: "#4a9d7a",
    fontSize: 24,
    marginBottom: 40,
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
