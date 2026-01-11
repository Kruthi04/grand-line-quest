import { StyleSheet, Text, TouchableOpacity } from "react-native";

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
}) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.buttonText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#1e3d2f",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    minWidth: 200,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
