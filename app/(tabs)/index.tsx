import CutscenePlayer from "@/components/CutscenePlayer";
import { useGame } from "@/context/GameContext";
import { Audio } from "expo-av";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setHasPlayedAudio, setHomeScreenSound, pauseHomeMusic } = useGame();
  const [showVideo, setShowVideo] = useState(false);
  const pulseAnim = useState(new Animated.Value(1))[0];
  const scaleAnim = useState(new Animated.Value(1.02))[0];
  const bounceAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    // Play One Piece theme audio when app loads
    async function playThemeAudio() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          require("@/assets/audio/OnePieceThemeBeginTrim.mp3"),
          { shouldPlay: true, isLooping: true }
        );
        setHomeScreenSound(sound); // Store in context for global access
      } catch (error) {
        console.log("Error loading audio:", error);
      }
    }

    playThemeAudio();

    return () => {
      // Don't unload here - let the context manage it
    };
  }, [setHomeScreenSound]);

  // Pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Scale-up on idle - already at 1.02, keep it there

  const handleButtonPress = () => {
    // Bounce animation on tap
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Then proceed with normal action
    setTimeout(() => {
      pauseHomeMusic();
      setShowVideo(true);
      setHasPlayedAudio(true);
    }, 200);
  };

  function handleVideoComplete() {
    // Navigate to Map Screen
    router.push("/map");
  }

  if (showVideo) {
    return (
      <CutscenePlayer
        videoSource={require("@/assets/videos/intro5.mp4")}
        onComplete={handleVideoComplete}
        animationType={undefined}
        character={undefined}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={[styles.topNavBar, { paddingTop: insets.top }]}>
        <Text style={styles.navTitle}>The Grand Line Quest</Text>
      </View>
      {/* Image Container - starts below nav bar */}
      <View style={[styles.imageContainer, { top: 60 + insets.top }]}>
        <Animated.Image
          source={require("@/assets/images/homepage.png")}
          style={styles.homepageBackground}
          resizeMode="cover"
        />
        {/* Light blur effect */}
        <BlurView intensity={3} style={styles.blurOverlay} />
        {/* Dark overlay to push background back */}
        <View style={styles.darkOverlay} />
      </View>
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            bottom: 80 + insets.bottom,
            transform: [
              {
                scale: Animated.multiply(
                  Animated.multiply(pulseAnim, scaleAnim),
                  bounceAnim
                ),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleButtonPress}
          activeOpacity={1}
        >
          <View style={styles.buttonGlow} />
          <View style={styles.buttonInner}>
            <Text style={styles.buttonIcon}>▶</Text>
            <Text style={styles.startButtonText}>Start Adventure</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  imageContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0b1d2a",
  },
  homepageBackground: {
    width: "100%",
    height: "100%",
    opacity: 0.9, // Slightly reduce saturation/visibility
  },
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  darkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Black at 40% opacity
  },
  buttonContainer: {
    position: "absolute",
    alignSelf: "center",
  },
  startButton: {
    backgroundColor: "#8B6F47", // Medium brown wood background
    paddingHorizontal: 50,
    paddingVertical: 26,
    borderRadius: 24,
    borderWidth: 5,
    minWidth: 300,
    alignItems: "center",
    justifyContent: "center",
    // Soft drop shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 15,
    overflow: "hidden",
    // 3D embossed golden border effect
    borderTopColor: "#F4C882", // Lighter golden top
    borderBottomColor: "#B8935A", // Darker golden bottom
    borderLeftColor: "#E4B972", // Medium golden left
    borderRightColor: "#E4B972", // Medium golden right
  },
  buttonGlow: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 26,
    backgroundColor: "rgba(244, 200, 130, 0.3)",
    zIndex: -1,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonIcon: {
    color: "#F4C882",
    fontSize: 20,
    fontWeight: "bold",
    textShadowColor: "#1A1A1A",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  startButtonText: {
    color: "#F5F5DC", // Off-white/beige text
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
    textShadowColor: "#1A1A1A", // Dark shadow
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 5,
  },
  topNavBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(11, 29, 42, 0.85)",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(74, 157, 122, 0.5)",
    zIndex: 10,
  },
  navTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
