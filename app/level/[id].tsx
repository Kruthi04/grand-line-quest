import { useLocalSearchParams, useRouter } from 'expo-router';
import Level1Screen from '@/screens/Level1Screen';
import Level2Screen from '@/screens/Level2Screen';
import Level3Screen from '@/screens/Level3Screen';
import Level4Screen from '@/screens/Level4Screen';
import FinalLevelScreen from '@/screens/FinalLevelScreen';

export default function LevelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const levelId = parseInt(id || '1', 10);

  switch (levelId) {
    case 1:
      return <Level1Screen />;
    case 2:
      return <Level2Screen />;
    case 3:
      return <Level3Screen />;
    case 4:
      return <Level4Screen />;
    case 5:
      return <FinalLevelScreen />;
    default:
      return <Level1Screen />;
  }
}

