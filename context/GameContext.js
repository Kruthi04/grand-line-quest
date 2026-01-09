import React, { createContext, useContext, useState, useEffect } from 'react';

const GameContext = createContext();

export function GameProvider({ children }) {
  const [power, setPower] = useState(0);
  const [unlockedLevels, setUnlockedLevels] = useState([1]); // Level 1 starts unlocked
  const [completedLevels, setCompletedLevels] = useState([]);
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
  const [homeScreenSound, setHomeScreenSound] = useState(null);
  // Track the last level where Chirag was standing on the map
  const [lastChiragLevel, setLastChiragLevel] = useState(1);

  const unlockLevel = (level) => {
    if (!unlockedLevels.includes(level)) {
      setUnlockedLevels([...unlockedLevels, level]);
    }
  };

  const completeLevel = (level) => {
    if (!completedLevels.includes(level)) {
      setCompletedLevels([...completedLevels, level]);
    }
  };

  const increasePower = (amount = 1) => {
    setPower(power + amount);
  };

  const isLevelUnlocked = (level) => {
    return unlockedLevels.includes(level);
  };

  const isLevelCompleted = (level) => {
    return completedLevels.includes(level);
  };

  const getRequiredPower = (level) => {
    const requirements = {
      1: 0,
      2: 1, // Observation Haki gives +1 power
      3: 2, // Strength gives +1 power
      4: 3, // Wisdom gives +1 power
      5: 4, // Control gives +1 power
    };
    return requirements[level] || 0;
  };

  const pauseHomeMusic = async () => {
    if (homeScreenSound) {
      try {
        await homeScreenSound.pauseAsync();
      } catch (error) {
        console.log('Error pausing home music:', error);
      }
    }
  };

  const resumeHomeMusic = async () => {
    if (homeScreenSound) {
      try {
        await homeScreenSound.playAsync();
      } catch (error) {
        console.log('Error resuming home music:', error);
      }
    }
  };

  const fadeOutHomeMusic = async () => {
    if (homeScreenSound) {
      try {
        // Fade out over 1 second
        await homeScreenSound.setVolumeAsync(1.0);
        await new Promise((resolve) => setTimeout(resolve, 200));
        await homeScreenSound.setVolumeAsync(0.7);
        await new Promise((resolve) => setTimeout(resolve, 200));
        await homeScreenSound.setVolumeAsync(0.4);
        await new Promise((resolve) => setTimeout(resolve, 200));
        await homeScreenSound.setVolumeAsync(0.2);
        await new Promise((resolve) => setTimeout(resolve, 200));
        await homeScreenSound.setVolumeAsync(0);
        await new Promise((resolve) => setTimeout(resolve, 200));
        await homeScreenSound.stopAsync();
        await homeScreenSound.unloadAsync();
        setHomeScreenSound(null);
      } catch (error) {
        console.log('Error fading home music:', error);
        // Fallback: just unload
        try {
          if (homeScreenSound) {
            await homeScreenSound.unloadAsync();
            setHomeScreenSound(null);
          }
        } catch (e) {
          // Ignore
        }
      }
    }
  };

  return (
    <GameContext.Provider
      value={{
        power,
        unlockedLevels,
        completedLevels,
        lastChiragLevel,
        hasPlayedAudio,
        setHasPlayedAudio,
        homeScreenSound,
        setHomeScreenSound,
        pauseHomeMusic,
        resumeHomeMusic,
        fadeOutHomeMusic,
        unlockLevel,
        completeLevel,
        increasePower,
        isLevelUnlocked,
        isLevelCompleted,
        getRequiredPower,
        setLastChiragLevel,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

