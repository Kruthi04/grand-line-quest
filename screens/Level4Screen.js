import CutscenePlayer from "@/components/CutscenePlayer";
import PrimaryButton from "@/components/PrimaryButton";
import TypewriterText from "@/components/TypewriterText";
import { useGame } from "@/context/GameContext";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Conversation dialogue before the game starts
const INTRO_DIALOGUE = [
  {
    character: "chirag",
    text: "Why did I get a harmonica?",
  },
  {
    character: "luffy",
    text: "Hehehe! Because this round's about music!",
  },
  {
    character: "chirag",
    text: "Music…?",
  },
  {
    character: "luffy",
    text: "Yeah! Rhythm and timing!",
  },
  {
    character: "chirag",
    text: "Timing?",
  },
  {
    character: "luffy",
    text: "Yeah! In a moment, tiles will start falling down the screen.",
  },
  {
    character: "chirag",
    text: "Falling tiles…?",
  },
  {
    character: "luffy",
    text: "As soon as a dark tile starts falling, tap it!",
  },
  {
    character: "chirag",
    text: "So I don't wait till the bottom.",
  },
  {
    character: "luffy",
    text: "Nope! Hit it while it's moving! Keep tapping them in order as they fall.",
  },
  {
    character: "chirag",
    text: "Sounds like I'll need fast reactions.",
  },
  {
    character: "luffy",
    text: "Yeah!! Eyes sharp, hands quick! Stay in rhythm and keep going till the end!",
  },
];

// Mini Game: Pineapple Tiles
const LANES = 4;
const INITIAL_FALL_DURATION = 5500; // ms for a tile to fall from top to bottom (start slow)
const FINAL_FALL_DURATION = 2800; // ms for final speed
const INITIAL_SPAWN_INTERVAL = 1500; // ms between spawns (start slow)
const FINAL_SPAWN_INTERVAL = 700; // ms for final speed
const SPEED_RAMP_UP_TILES = 3; // Number of tiles before reaching final speed
const MAX_MISSES = 3; // Allow a few misses
const TARGET_HITS = 12; // Song length (visual only)
const NOTE_SEGMENT_MS = 600; // length of each snippet from the Baka song
const AUDIO_TARGET_MS = 13000; // total audio time to reach before ending level
const NOTE_SYMBOLS = ["♪", "♫", "♩", "♬"];

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export default function Level4Screen() {
  const router = useRouter();
  const {
    power,
    getRequiredPower,
    increasePower,
    unlockLevel,
    completeLevel,
     pauseHomeMusic,
    //lowerHomeMusic,
    resumeHomeMusic,
    setLastChiragLevel,
    isLevelCompleted,
  } = useGame();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showCompletionVideo, setShowCompletionVideo] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [showHoodieVideo, setShowHoodieVideo] = useState(false);
  const [tiles, setTiles] = useState([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [buggyComment, setBuggyComment] = useState("");
  const [oceanGlow, setOceanGlow] = useState(false);
  const [lanesWidth, setLanesWidth] = useState(SCREEN_WIDTH - 40);
  const [showVideo, setShowVideo] = useState(false);
  const [showConversation, setShowConversation] = useState(true);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [canAdvance, setCanAdvance] = useState(false);

  const noteSoundRef = useRef(null);
  const noteDurationRef = useRef(0);
  const noteSegmentIndexRef = useRef(0);
  const audioPlayedMsRef = useRef(0);
  const idCounter = useRef(0);
  const spawnIntervalRef = useRef(null);
  const tilesSpawnedRef = useRef(0);

  useEffect(() => {
    const requiredPower = getRequiredPower(4);
    const unlocked = power >= requiredPower;
    setIsUnlocked(unlocked);
  }, [power, getRequiredPower]);

  // Fade out home music and start simple background track
  useEffect(() => {
     

    let isMounted = true;
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
        // Only load the per-tile note sound (Luffy Baka Song snippet)
        const { sound: noteSound } = await Audio.Sound.createAsync(
          require("@/assets/audio/Luffy - Baka Song [HD].mp3"),
          { shouldPlay: false, isLooping: false, volume: 0.6 }
        );
        if (isMounted) {
          noteSoundRef.current = noteSound;
          // Cache duration so we can walk through the song in segments
          const status = await noteSound.getStatusAsync();
          if (status.isLoaded && typeof status.durationMillis === "number") {
            noteDurationRef.current = status.durationMillis;
          }
        } else {
          await noteSound.unloadAsync();
        }
      } catch (e) {
        console.log("Error loading note sound:", e);
      }
    })();

    return () => {
      isMounted = false;
      if (noteSoundRef.current) {
        noteSoundRef.current.unloadAsync();
      }
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
      }
    };
  }, [pauseHomeMusic]);

  // Start spawning tiles when unlocked and game hasn't ended
  useEffect(() => {
    if (
      !isUnlocked ||
      gameOver ||
      showCompletionVideo ||
      showReward ||
      showConversation ||
      showVideo
    )
      return;

    // Reset tile count when starting
    tilesSpawnedRef.current = 0;

    const getDynamicSpeed = () => {
      const tilesCount = tilesSpawnedRef.current;
      if (tilesCount < SPEED_RAMP_UP_TILES) {
        // Gradual speed increase: start slow, reach final speed after SPEED_RAMP_UP_TILES
        const progress = tilesCount / SPEED_RAMP_UP_TILES;
        const fallDuration =
          INITIAL_FALL_DURATION -
          (INITIAL_FALL_DURATION - FINAL_FALL_DURATION) * progress;
        const spawnInterval =
          INITIAL_SPAWN_INTERVAL -
          (INITIAL_SPAWN_INTERVAL - FINAL_SPAWN_INTERVAL) * progress;
        return { fallDuration, spawnInterval };
      } else {
        // After ramp-up period, use final speed
        return {
          fallDuration: FINAL_FALL_DURATION,
          spawnInterval: FINAL_SPAWN_INTERVAL,
        };
      }
    };

    let timeoutId = null;
    let isActive = true;

    const spawnTile = () => {
      if (!isActive) return;

      const lane = Math.floor(Math.random() * LANES);
      const id = idCounter.current++;
      const translateY = new Animated.Value(-80);

      // Get speed for THIS tile (before incrementing)
      const { fallDuration } = getDynamicSpeed();

      // Increment counter after getting speed for this tile
      tilesSpawnedRef.current++;

      const newTile = {
        id,
        lane,
        translateY,
        hit: false,
      };

      setTiles((prev) => [...prev, newTile]);

      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: fallDuration,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        // If tile wasn't hit, it's a miss (gentle)
        setTiles((prev) => prev.filter((t) => t.id !== id));
        setMisses((prev) => {
          const next = prev + (newTile.hit ? 0 : 1);
          if (!newTile.hit && next <= MAX_MISSES) {
            setBuggyComment("Heh! Even pirates miss a beat!");
            setTimeout(() => setBuggyComment(""), 2000);
          }
          return next;
        });
      });

      // Schedule next spawn with dynamic interval (after incrementing, so it uses next tile's speed)
      if (isActive) {
        const { spawnInterval: nextInterval } = getDynamicSpeed();
        timeoutId = setTimeout(spawnTile, nextInterval);
      }
    };

    // Start first tile spawn
    const { spawnInterval: initialInterval } = getDynamicSpeed();
    timeoutId = setTimeout(spawnTile, initialInterval);

    return () => {
      isActive = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    isUnlocked,
    gameOver,
    showCompletionVideo,
    showReward,
    showConversation,
    showVideo,
  ]);

  const playNoteSound = async () => {
    if (!noteSoundRef.current) return;

    try {
      // Stop any currently playing sound first
      try {
        const status = await noteSoundRef.current.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await noteSoundRef.current.stopAsync();
        }
      } catch {
        // ignore stop errors
      }

      const duration = noteDurationRef.current;
      let startMs = 0;

      if (duration > 0) {
        const maxStart = Math.max(duration - NOTE_SEGMENT_MS, 0);
        startMs = noteSegmentIndexRef.current * NOTE_SEGMENT_MS;
        if (startMs > maxStart) {
          // Wrap back to the beginning once we reach the end
          startMs = 0;
          noteSegmentIndexRef.current = 0;
        }
      }

      await noteSoundRef.current.setPositionAsync(startMs);
      await noteSoundRef.current.playAsync();

      // Stop after segment duration
      setTimeout(async () => {
        try {
          if (noteSoundRef.current) {
            const status = await noteSoundRef.current.getStatusAsync();
            if (status.isLoaded && status.isPlaying) {
              await noteSoundRef.current.stopAsync();
            }
          }
        } catch {
          // ignore stop errors
        }
      }, NOTE_SEGMENT_MS);

      // Advance to next segment for the next tile tap
      noteSegmentIndexRef.current += 1;

      // Track total audio played; when we reach target, finish the level
      audioPlayedMsRef.current += NOTE_SEGMENT_MS;
      if (!gameOver && audioPlayedMsRef.current >= AUDIO_TARGET_MS) {
        setOceanGlow(true);
        setGameOver(true);
        if (spawnIntervalRef.current) {
          clearInterval(spawnIntervalRef.current);
        }
        setTimeout(() => {
          finishLevel();
        }, 2500);
      }
    } catch (e) {
      console.log("Error playing note sound:", e);
    }
  };

  const handleTileTap = (tileId) => {
    if (gameOver) return;

    // Play a soft note for this tap
    playNoteSound();

    setTiles((prevTiles) =>
      prevTiles.filter((tile) => {
        if (tile.id === tileId && !tile.hit) {
          return false;
        }
        return true;
      })
    );

    setHits((prev) => prev + 1);
  };

  const finishLevel = async () => {
    setLastChiragLevel(4);
    increasePower(1);
    unlockLevel(5);
    completeLevel(4);
    setGameOver(true);
    setShowCompletionVideo(true);
  };

  const handleRewardContinue = () => {
    setShowReward(false);
    setShowHoodieVideo(true);
  };

  const handleHoodieVideoComplete = () => {
    resumeHomeMusic();

    router.push("/map");
  };

  const handleCompletionVideoComplete = () => {
    setShowCompletionVideo(false);
    setShowReward(true);
  };

  const handleDialogueNext = () => {
    if (!canAdvance) return;

    setCanAdvance(false);
    if (dialogueIndex < INTRO_DIALOGUE.length - 1) {
      setDialogueIndex(dialogueIndex + 1);
    } else {
      // Conversation complete, show video
      pauseHomeMusic();
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
      pauseHomeMusic();
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

              {/* Luffy on the right */}
              <View style={styles.characterWrapper}>
                <Image
                  source={require("@/assets/images/Characters/Luffy.png")}
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

            {/* Speech bubble for Sanji (right side, below) */}
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

  if (showHoodieVideo) {
    return (
      <View style={styles.videoContainer}>
        <CutscenePlayer
          videoSource={require("@/assets/videos/hoodie final.mp4")}
          onComplete={handleHoodieVideoComplete}
          resizeMode="contain"
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

  if (showCompletionVideo) {
    return (
      <View style={styles.videoContainer}>
        <CutscenePlayer
          videoSource={require("@/assets/videos/ChiragLuffySongVideo.mp4")}
          onComplete={handleCompletionVideoComplete}
          resizeMode="contain"
        />
      </View>
    );
  }

  if (!isUnlocked) {
    const requiredPower = getRequiredPower(4);
    return (
      <View style={styles.container}>
        <Text style={styles.levelTitle}>🎵 LEVEL 4</Text>
        <Text style={styles.levelSubtitle}>Pineapple Tiles</Text>
        <Text style={styles.lockedText}>
          This level requires {requiredPower} power.
        </Text>
        <Text style={styles.lockedText}>You have {power} power.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {oceanGlow && <View style={styles.oceanGlow} pointerEvents="none" />}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={playNoteSound}
        style={styles.titleTouchable}
      >
        <Text style={styles.levelTitle}>🎵 Pineapple Tiles</Text>
      </TouchableOpacity>
      <Text style={styles.subtitle}>
        Tap the falling notes as they reach the bottom lanes.
      </Text>
      <Text style={styles.infoText}>
        Slow tempo, big hit zone. Just have fun.
      </Text>

      <View
        style={styles.lanesContainer}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          if (width > 0) {
            setLanesWidth(width);
          }
        }}
      >
        {/* Hit zone indicator */}
        <View style={styles.hitZone} pointerEvents="none">
          <Text style={styles.hitZoneText}>Hit Zone</Text>
        </View>

        {/* Falling tiles */}
        {tiles.map((tile) => {
          const laneWidth = lanesWidth / LANES;
          const tileWidth = 60;
          // Center each tile in its lane, fully inside the bordered container
          const left = tile.lane * laneWidth + (laneWidth - tileWidth) / 2;
          return (
            <Animated.View
              key={tile.id}
              style={[
                styles.tile,
                {
                  transform: [{ translateY: tile.translateY }],
                  left,
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleTileTap(tile.id)}
              >
                <View style={styles.tileInner}>
                  <Text style={styles.tileNote}>{NOTE_SYMBOLS[tile.lane]}</Text>
                  <Text style={styles.tileIcon}>🍍</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* Stats & gentle feedback */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Hits: {hits}</Text>
        <Text style={styles.footerText}>
          Misses: {misses} / {MAX_MISSES}
        </Text>
      </View>

      {buggyComment ? (
        <View style={styles.buggyBubble}>
          <Text style={styles.buggyText}>{buggyComment}</Text>
        </View>
      ) : null}

      {oceanGlow && (
        <View style={styles.sanjiTextContainer}>
          <Text style={styles.sanjiText}>"Music isn't about perfection."</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffeb3b",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  videoContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  levelTitle: {
    color: "#000",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  levelSubtitle: {
    color: "#4a9d7a",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    color: "#000",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 4,
  },
  infoText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  lanesContainer: {
    flex: 1,
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e3d47",
    overflow: "hidden",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  hitZone: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  hitZoneText: {
    color: "#ccc",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tile: {
    position: "absolute",
    width: 60,
    zIndex: 2,
  },
  tileInner: {
    width: 60,
    height: 80,
    borderRadius: 14,
    backgroundColor: "rgba(81, 157, 74, 0.9)",
    borderWidth: 2,
    borderColor: "#4a7a6a",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  tileNote: {
    color: "#fff",
    fontSize: 24,
    marginBottom: 4,
  },
  tileIcon: {
    color: "#ffe48a",
    fontSize: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 12,
    marginBottom: 10,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 8,
    width: "100%",
  },
  footerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  lockedText: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
  },
  oceanGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(82, 157, 74, 0.35)",
  },
  buggyBubble: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  buggyText: {
    color: "#ffd700",
    fontSize: 14,
    textAlign: "center",
  },
  sanjiTextContainer: {
    position: "absolute",
    top: 80,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  sanjiText: {
    color: "#fff",
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
  },
  titleTouchable: {
    alignItems: "center",
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
    backgroundColor: "#1e3d2f",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#4a9d7a",
    zIndex: 2000,
    elevation: 20,
  },
  conversationSkipButtonText: {
    color: "#fff",
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
});
