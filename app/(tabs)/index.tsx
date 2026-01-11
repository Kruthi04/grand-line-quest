import { useGame } from "@/context/GameContext";
import { useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
  const {
    setHasPlayedAudio,
    setHomeScreenSound,
    pauseHomeMusic,
    homeScreenSound,
    resumeHomeMusic,
  } = useGame();
  const pulseAnim = useState(new Animated.Value(1))[0];
  const scaleAnim = useState(new Animated.Value(1.02))[0];
  const bounceAnim = useState(new Animated.Value(1))[0];

  // Initialize audio on mount
  useEffect(() => {
    // Play One Piece theme audio when app loads (only create once)
    async function playThemeAudio() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        // Only create new sound if one doesn't exist
        if (!homeScreenSound) {
          const { sound } = await Audio.Sound.createAsync(
            require("@/assets/audio/OnePieceTheme.mp3"),
            { shouldPlay: true, isLooping: true }
          );
          setHomeScreenSound(sound); // Store in context for global access
        }
      } catch (error) {
        console.log("Error loading audio:", error);
      }
    }

    playThemeAudio();

    return () => {
      // Don't unload here - let the context manage it
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Resume audio when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Resume home music when navigating back to home screen
      if (homeScreenSound) {
        resumeHomeMusic();
      }
    }, [homeScreenSound, resumeHomeMusic])
  );

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

  const handleButtonPress = async () => {
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

    // Play gamified button click sound effect
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("@/assets/audio/OnePieceTheme.mp3"),
        { shouldPlay: true, volume: 0.6, isLooping: false }
      );

      // Play a satisfying click sound (short clip of theme for gamified feel)
      // Stop after 0.3 seconds for a crisp button click effect
      setTimeout(async () => {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch {
          // Ignore errors during cleanup
        }
      }, 300);
    } catch (error) {
      console.log("Error playing button sound:", error);
    }

    // Pause home music when navigating to map
    setTimeout(() => {
      pauseHomeMusic();
      setHasPlayedAudio(true);
      router.push("/map");
    }, 350);
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={[styles.topNavBar, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={["rgba(0, 0, 0, 0.7)", "rgba(0, 0, 0, 0.4)", "transparent"]}
          locations={[0, 0.5, 1]}
          style={styles.navGradient}
        />
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
        <BlurView intensity={1} style={styles.blurOverlay} />
        {/* Fog/mist layer between background and foreground */}
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0.08)",
            "rgba(255, 255, 255, 0.05)",
            "transparent",
            "rgba(255, 255, 255, 0.03)",
          ]}
          locations={[0, 0.3, 0.6, 1]}
          style={styles.fogLayer}
        />
        {/* Dark overlay to push background back */}
        <View style={styles.darkOverlay} />
        {/* Foreground contrast boost overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0, 0, 0, 0.15)", "rgba(0, 0, 0, 0.25)"]}
          locations={[0, 0.4, 1]}
          style={styles.foregroundBoost}
        />
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
        {/* Frosted glass panel behind button */}
        <BlurView intensity={10} tint="dark" style={styles.buttonPanel}>
          <View style={styles.buttonPanelBorder} />
        </BlurView>
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
    zIndex: 0, // Background layer
    // Soft shadow beneath to create depth
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  homepageBackground: {
    width: "100%",
    height: "100%",
    opacity: 0.95, // Slightly increased for foreground contrast
  },
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fogLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1, // Between background and foreground
  },
  darkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Black at 40% opacity
    zIndex: 2,
  },
  foregroundBoost: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3, // On top to boost foreground contrast
  },
  buttonContainer: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20, // Ensure button is above everything
  },
  buttonPanel: {
    position: "absolute",
    borderRadius: 32,
    padding: 12,
    // Extend beyond button slightly for padding
    minWidth: 324, // Button minWidth (300) + padding
    minHeight: 80, // Button height + padding
    alignSelf: "center",
    zIndex: 0,
    backgroundColor: "rgba(0, 0, 0, 0.2)", // Subtle dark tint
  },
  buttonPanelBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "rgba(107, 182, 255, 0.4)", // Sky blue border
  },
  startButton: {
    backgroundColor: "#6B5B4A", // Wood brown with navy tint
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
    // 3D embossed border with sky blue to navy
    borderTopColor: "#eab676", // Sky blue top
    borderBottomColor: "#f19d36", // Deep navy bottom
    borderLeftColor: "#f5ae56", // Medium sky blue left
    borderRightColor: "#f5ae56", // Medium sky blue right
  },
  buttonGlow: {
    // position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 26,
    backgroundColor: "rgba(107, 182, 255, 0.2)", // Sky blue glow
    zIndex: -1,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonIcon: {
    color: "#d56e3e", // Sky blue icon
    fontSize: 20,
    fontWeight: "bold",
    textShadowColor: "#1a2f4a", // Navy shadow
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  startButtonText: {
    color: "#E8F4F8", // Sky blue tinted white text
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
    textShadowColor: "#d56e3e", // Deep navy shadow
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 5,
  },
  topNavBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 0,
    zIndex: 30, // High z-index to ensure it's above everything
    overflow: "hidden",
  },
  navGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  navTitle: {
    color: "#87CEEB", // Sky blue title
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "rgba(26, 47, 74, 0.8)", // Deep navy shadow
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    zIndex: 1,
  },
});
