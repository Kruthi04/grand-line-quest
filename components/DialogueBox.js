import { View, StyleSheet } from "react-native";
import TypewriterText from "./TypewriterText";

export default function DialogueBox({ text, onComplete }) {
  if (!text) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TypewriterText
        text={String(text)}
        onComplete={onComplete}
        speed={28}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.9)",
    padding: 20,
    borderRadius: 12,
    zIndex: 1000,
    elevation: 10,
    borderWidth: 2,
    borderColor: "#ffd700",
    shadowColor: "#ffd700",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
});
