import { useGame } from "@/context/GameContext";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Level = {
  id: number;
  name: string;
  character: string;
  image: any;
  position: { x: number; y: number };
};

const LEVELS: Level[] = [
  {
    id: 1,
    name: "Observation Haki",
    character: "Shanks",
    image: require("@/assets/images/Characters/Shanks.png"),
    // Position as percentage of screen (will be converted to pixels)
    position: { x: 0.2, y: 0.3 },
  },
  {
    id: 2,
    name: "Trial of Strength",
    character: "Zoro",
    image: require("@/assets/images/Characters/Zoro.png"),
    position: { x: 0.5, y: 0.4 },
  },
  {
    id: 3,
    name: "Wisdom of the Seas",
    character: "Sanji",
    image: require("@/assets/images/Characters/Sanji.png"),
    position: { x: 0.75, y: 0.5 },
  },
  {
    id: 4,
    name: "Breath & Control",
    character: "Luffy",
    image: require("@/assets/images/Characters/Luffy.png"),
    position: { x: 0.3, y: 0.65 },
  },
  {
    id: 5,
    name: "Captain's Oath",
    character: "Usopp",
    image: require("@/assets/images/Characters/kruthi1.png"),
    position: { x: 0.7, y: 0.75 },
  },
];

interface CharacterMarkerProps {
  level: Level;
  isUnlocked: boolean;
  isCompleted: boolean;
  onPress: () => void;
}

function CharacterMarker({
  level,
  isUnlocked,
  isCompleted,
  onPress,
}: CharacterMarkerProps) {
  // Calculate target position (centered on the marker)
  const targetX = level.position.x * SCREEN_WIDTH - 40; // Subtract half marker width
  const targetY = level.position.y * SCREEN_HEIGHT - 40; // Subtract half marker height

  const left = useSharedValue(targetX);
  const top = useSharedValue(targetY);
  const scale = useSharedValue(isUnlocked ? 1 : 0.5);
  const opacity = useSharedValue(isUnlocked ? 1 : 0.4);

  useEffect(() => {
    // Animate to position when unlocked
    if (isUnlocked) {
      left.value = withSpring(targetX, {
        damping: 15,
        stiffness: 100,
      });
      top.value = withSpring(targetY, {
        damping: 15,
        stiffness: 100,
      });
      scale.value = withSpring(1, { damping: 10 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      // Keep position but reduce scale and opacity
      scale.value = withTiming(0.5, { duration: 200 });
      opacity.value = withTiming(0.4, { duration: 200 });
    }
  }, [isUnlocked, targetX, targetY, left, top]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      left: left.value,
      top: top.value,
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.characterMarker,
        animatedStyle,
        isCompleted && styles.characterCompleted,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={!isUnlocked}
        activeOpacity={0.7}
        style={styles.characterButton}
      >
        {isUnlocked ? (
          <>
            <Image
              source={level.image}
              style={styles.characterImage}
              contentFit="contain"
            />
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedCheck}>✓</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.lockedMarker}>
            <Text style={styles.lockedIcon}>🔒</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Component to draw a path line between two levels
function PathLine({
  from,
  to,
  isVisible,
}: {
  from: Level;
  to: Level;
  isVisible: boolean;
}) {
  const fromX = from.position.x * SCREEN_WIDTH;
  const fromY = from.position.y * SCREEN_HEIGHT;
  const toX = to.position.x * SCREEN_WIDTH;
  const toY = to.position.y * SCREEN_HEIGHT;

  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  const pathOpacity = useSharedValue(isVisible ? 0.6 : 0);

  useEffect(() => {
    pathOpacity.value = withTiming(isVisible ? 0.6 : 0, { duration: 500 });
  }, [isVisible, pathOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pathOpacity.value,
  }));

  // Position line starting from 'from' point, rotated to point towards 'to'
  // Adjust top by -2px (half line height) so rotation happens around center
  return (
    <Animated.View
      style={[
        styles.pathLine,
        {
          left: fromX,
          top: fromY - 2, // Offset by half height for better rotation
          width: distance,
          transform: [{ rotate: `${angle}deg` }],
        },
        animatedStyle,
      ]}
    />
  );
}

// Component for animated hint popup
function AnimatedHint() {
  const glow = useSharedValue(0.5);
  const fadeIn = useSharedValue(0);

  useEffect(() => {
    // Initial fade-in animation
    fadeIn.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });

    // Pulsing glow animation - infinite repeat with stronger effect
    glow.value = withRepeat(
      withTiming(1, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // infinite repeats
      true // reverse animation
    );
  }, []);

  const textStyle = useAnimatedStyle(() => {
    const intensity = glow.value;
    const opacityValue = (0.8 + (intensity - 0.5) * 0.4) * fadeIn.value; // Pulse from 0.8 to 1.0, multiplied by fadeIn
    const scaleValue = (1 + (intensity - 0.5) * 0.08) * fadeIn.value; // Scale pulse, multiplied by fadeIn

    return {
      opacity: opacityValue,
      transform: [{ scale: scaleValue }],
    };
  });

  const containerGlow = useAnimatedStyle(() => {
    const intensity = glow.value;
    const shadowOpacity = (0.6 + intensity * 0.4) * fadeIn.value; // Scale from 0.6 to 1.0, multiplied by fadeIn
    const shadowRadius = (15 + (intensity - 0.5) * 30) * fadeIn.value; // Scale from 15 to 45, multiplied by fadeIn

    return {
      shadowColor: "#8B6F47",
      shadowOpacity: shadowOpacity,
      shadowRadius: shadowRadius,
      shadowOffset: { width: 0, height: 0 },
    };
  });

  // Create a glow overlay for additional visual effect
  const glowOverlayStyle = useAnimatedStyle(() => {
    const intensity = glow.value;
    const overlayOpacity = (intensity - 0.5) * 0.4 * fadeIn.value; // Scale from 0 to 0.2, multiplied by fadeIn
    const overlayScale = fadeIn.value * (1 + (intensity - 0.5) * 0.1); // Scale from 1.0 to 1.05, multiplied by fadeIn

    return {
      opacity: overlayOpacity,
      transform: [{ scale: overlayScale }],
    };
  });

  return (
    <Animated.View style={[styles.hintContainer, containerGlow]}>
      <Animated.View style={[styles.hintGlowOverlay, glowOverlayStyle]} />
      <Animated.Text style={[styles.hintText, textStyle]}>
        Click on Shanks to begin your journey
      </Animated.Text>
    </Animated.View>
  );
}

// Component for Chirag character that moves along the path
function ChiragCharacter({
  previousLevelId,
  targetLevelId,
}: {
  previousLevelId: number;
  targetLevelId: number;
}) {
  // Find previous and target levels
  const previousLevel =
    LEVELS.find((l) => l.id === previousLevelId) || LEVELS[0];
  const targetLevel = LEVELS.find((l) => l.id === targetLevelId) || LEVELS[0];

  // Helper to compute Chirag's standing position NEXT TO a level marker (to the right side)
  const getChiragPositionForLevel = (level: Level) => {
    // Level marker is 80x80 centered at (level.position.x * SCREEN_WIDTH, level.position.y * SCREEN_HEIGHT)
    // Chirag is 60x60 – we offset so he stands slightly to the right of the marker, vertically centered.
    const levelCenterX = level.position.x * SCREEN_WIDTH;
    const levelCenterY = level.position.y * SCREEN_HEIGHT;

    const x = levelCenterX + 60 - 30; // move 60px to the right, then subtract half Chirag width (30)
    const y = levelCenterY - 30; // center vertically: subtract half Chirag height (30)
    return { x, y };
  };

  const previousPos = getChiragPositionForLevel(previousLevel);
  const targetPos = getChiragPositionForLevel(targetLevel);

  // Start Chirag at the previous level position so movement is visible
  const chiragX = useSharedValue(previousPos.x);
  const chiragY = useSharedValue(previousPos.y);
  const chiragOpacity = useSharedValue(1);
  const chiragScale = useSharedValue(1);

  useEffect(() => {
    // Animate Chirag to the target level position
    chiragX.value = withSpring(targetPos.x, {
      damping: 15,
      stiffness: 100,
    });
    chiragY.value = withSpring(targetPos.y, {
      damping: 15,
      stiffness: 100,
    });
    chiragOpacity.value = withTiming(1, { duration: 300 });
    chiragScale.value = withSpring(1, { damping: 10 });
  }, [targetPos.x, targetPos.y, chiragX, chiragY, chiragOpacity, chiragScale]);

  const chiragStyle = useAnimatedStyle(() => ({
    left: chiragX.value,
    top: chiragY.value,
    opacity: chiragOpacity.value,
    transform: [{ scale: chiragScale.value }],
  }));

  return (
    <Animated.View style={[styles.chiragMarker, chiragStyle]}>
      <Image
        source={require("@/assets/images/Characters/chirag.png")}
        style={styles.chiragImage}
        contentFit="contain"
      />
    </Animated.View>
  );
}

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const gameContext = useGame();
  const { isLevelUnlocked, isLevelCompleted } = gameContext;
  const completedLevels = (gameContext as any).completedLevels || [];
  const unlockedLevelsFromContext = (gameContext as any).unlockedLevels || [1];
  const lastChiragLevel = (gameContext as any).lastChiragLevel || 1;

  const { resumeHomeMusic } = useGame();

  // Show hint only when no levels are completed (first visit)
  const [showHint, setShowHint] = useState(completedLevels.length === 0);

  useFocusEffect(
    useCallback(() => {
      if (resumeHomeMusic) {
        resumeHomeMusic();
      }
    }, [resumeHomeMusic])
  );
  // Resume home music if it exists when on map screen
  // useEffect(() => {
  //   const homeScreenSound = (gameContext as any).homeScreenSound;
  //   const resumeHomeMusic = (gameContext as any).resumeHomeMusic;
  //   if (homeScreenSound && resumeHomeMusic) {
  //     resumeHomeMusic();
  //   }
  // }, [gameContext]);

  // Update hint visibility when levels are completed
  useEffect(() => {
    if (completedLevels.length > 0) {
      setShowHint(false);
    }
  }, [completedLevels.length]);

  const handleLevelPress = (levelId: number) => {
    if (isLevelUnlocked(levelId)) {
      // Hide hint when user interacts with a level
      if (showHint) {
        setShowHint(false);
      }
      router.push(`/level/${levelId}`);
    }
  };

  // Calculate which paths should be visible (between consecutive unlocked levels)
  const visiblePaths = useMemo(() => {
    const paths: Array<{ from: Level; to: Level }> = [];
    const unlockedLevels = LEVELS.filter((level) => isLevelUnlocked(level.id));

    for (let i = 0; i < unlockedLevels.length - 1; i++) {
      paths.push({
        from: unlockedLevels[i],
        to: unlockedLevels[i + 1],
      });
    }

    return paths;
  }, [isLevelUnlocked]);

  // Determine Chirag's current level (highest completed level, or level 1)
  // Previous level: where Chirag was standing last time (stored in context)
  const previousChiragLevelId = lastChiragLevel || 1;

  // Target level: highest unlocked level (so Chirag moves to the newest unlocked island)
  const maxUnlockedId =
    unlockedLevelsFromContext.length > 0
      ? Math.max(...unlockedLevelsFromContext)
      : 1;

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

      {/* Draw paths between levels */}
      {visiblePaths.map((path, index) => (
        <PathLine
          key={`path-${path.from.id}-${path.to.id}`}
          from={path.from}
          to={path.to}
          isVisible={true}
        />
      ))}

      {/* Chirag character - moves along the path */}
      <ChiragCharacter
        previousLevelId={previousChiragLevelId}
        targetLevelId={maxUnlockedId}
      />

      {/* Character markers positioned on map */}
      {LEVELS.map((level) => {
        const unlocked = isLevelUnlocked(level.id);
        const completed = isLevelCompleted(level.id);

        return (
          <CharacterMarker
            key={level.id}
            level={level}
            isUnlocked={unlocked}
            isCompleted={completed}
            onPress={() => handleLevelPress(level.id)}
          />
        );
      })}

      {/* Initial hint for first-time users */}
      {showHint && <AnimatedHint />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1d2a",
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
  },
  title: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 20,
    zIndex: 1,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  characterMarker: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  characterButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  characterImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#4a9d7a",
    backgroundColor: "rgba(30, 61, 47, 0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  characterCompleted: {
    // Additional styling for completed characters
  },
  completedBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ffd700",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  completedCheck: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
  lockedMarker: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(26, 26, 26, 0.8)",
    borderWidth: 2,
    borderColor: "#444",
    alignItems: "center",
    justifyContent: "center",
  },
  lockedIcon: {
    fontSize: 24,
  },
  pathLine: {
    position: "absolute",
    height: 4,
    backgroundColor: "#ffd700",
    borderRadius: 2,
    zIndex: 5,
    shadowColor: "#ffd700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  chiragMarker: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 15,
  },
  chiragImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#ff6b6b",
    backgroundColor: "rgba(255, 107, 107, 0.3)",
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  hintContainer: {
    position: "absolute",
    top: "52%",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    paddingHorizontal: 20,
    transform: [{ translateY: -10 }],
  },
  hintGlowOverlay: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 300,
    height: 60,
    marginLeft: -150,
    marginTop: -30,
    backgroundColor: "#8B6F47",
    borderRadius: 30,
    opacity: 0.3,
    zIndex: -1,
  },
  hintText: {
    fontSize: 20,
    color: "#4E342E",
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "rgba(139, 111, 71, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    zIndex: 1,
  },
});
