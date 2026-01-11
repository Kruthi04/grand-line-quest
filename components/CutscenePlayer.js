import { Video } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

export default function CutscenePlayer({
  videoSource,
  animationType,
  onComplete,
  character,
  duration = 3000,
  resizeMode = "contain",
}) {
  const [showAnimation, setShowAnimation] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const videoRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const timeoutRef = useRef(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (videoSource && videoRef.current) {
      // Ensure video plays when source is set
      videoRef.current.playAsync().catch((error) => {
        console.log("Video play error:", error);
      });
    }
  }, [videoSource]);

  useEffect(() => {
    if (videoSource) {
      // Video will play automatically via onLoad callback
      // The Video component handles playback
    } else if (animationType) {
      // Play animation based on type
      setShowAnimation(true);

      switch (animationType) {
        case "matcha":
          // Green aura animation
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]).start();
          break;
        case "strength":
          // Slash/stance animation
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
          break;
        case "wisdom":
          // Pages flipping, light around head
          Animated.loop(
            Animated.sequence([
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
            ]),
            { iterations: 3 }
          ).start();
          break;
        case "control":
          // Calm stabilizing animation
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 0.9,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]).start();
          break;
        case "ship":
          // Ship sailing animation
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }).start();
          break;
        default:
          break;
      }

      timeoutRef.current = setTimeout(() => {
        onCompleteRef.current && onCompleteRef.current();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoSource, animationType, duration]);

  const renderAnimation = () => {
    if (!showAnimation) return null;

    switch (animationType) {
      case "matcha":
        return (
          <Animated.View
            style={[
              styles.aura,
              {
                opacity: fadeAnim,
                backgroundColor: "rgba(0, 255, 0, 0.3)",
              },
            ]}
          />
        );
      case "strength":
        return (
          <Animated.View
            style={[
              styles.characterContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {character && (
              <Image
                source={character}
                style={styles.character}
                resizeMode="contain"
              />
            )}
          </Animated.View>
        );
      case "wisdom":
        return (
          <Animated.View
            style={[
              styles.light,
              {
                opacity: fadeAnim,
                backgroundColor: "rgba(255, 255, 0, 0.4)",
              },
            ]}
          />
        );
      case "control":
        return (
          <Animated.View
            style={[
              styles.characterContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {character && (
              <Image
                source={character}
                style={styles.character}
                resizeMode="contain"
              />
            )}
          </Animated.View>
        );
      case "ship":
        return (
          <Animated.View
            style={[
              styles.shipContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.ship} />
          </Animated.View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {videoSource ? (
        <Video
          ref={videoRef}
          source={videoSource}
          style={styles.video}
          resizeMode={resizeMode}
          shouldPlay
          isLooping={false}
          onPlaybackStatusUpdate={(status) => {
            if (status.didJustFinish) {
              onCompleteRef.current && onCompleteRef.current();
            }
          }}
          onLoad={() => {
            // Video loaded, ensure it plays
            if (videoRef.current) {
              videoRef.current.playAsync();
            }
          }}
        />
      ) : (
        renderAnimation()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  aura: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  light: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  characterContainer: {
    width: 250,
    height: 250,
    justifyContent: "center",
    alignItems: "center",
  },
  character: {
    width: "100%",
    height: "100%",
  },
  shipContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  ship: {
    width: 200,
    height: 100,
    backgroundColor: "#8B4513",
    borderRadius: 10,
  },
});
