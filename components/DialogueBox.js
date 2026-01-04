import { View, StyleSheet } from "react-native";
import TypewriterText from "./TypewriterText";

export default function DialogueBox({ text, onComplete }) {
  return (
    <View style={styles.container}>
      <TypewriterText
        text={text}
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
    backgroundColor: "rgba(0,0,0,0.75)",
    padding: 16,
    borderRadius: 12,
  },
});
