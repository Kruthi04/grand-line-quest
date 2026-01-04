import { useEffect, useRef, useState } from "react";
import { Text } from "react-native";

export default function TypewriterText({ text, speed = 30, onComplete }) {
  const [displayedText, setDisplayedText] = useState("");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let index = 0;
    setDisplayedText("");

    const interval = setInterval(() => {
      index++;
      setDisplayedText(text.slice(0, index));

      if (index === text.length) {
        clearInterval(interval);
        onCompleteRef.current && onCompleteRef.current();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <Text>{displayedText}</Text>;
}
