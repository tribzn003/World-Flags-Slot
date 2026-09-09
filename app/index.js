import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Vibration,
  Modal,
  ScrollView,
} from "react-native";

import {
  createReels,
  checkWins,
  GLOBE,
  WILD,
  JACKPOT,
  PREMIUM_CODES,
  MID_CODES,
  flagEmoji,
  flags,
} from "../gameData";

import {
  loadGameData,
  saveGameData,
} from "../storage";

const DAY = 86400000;

export default function HomeScreen() {
  const [reels, setReels] = useState(createReels());

  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);
  const [freeSpins, setFreeSpins] = useState(0);
  const [jackpot, setJackpot] = useState(5000);

  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [vip, setVip] = useState(false);

  const [lastDailyBonus, setLastDailyBonus] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);

  const [missionSpins, setMissionSpins] = useState(0);
  const [missionWins, setMissionWins] = useState(0);
  const [spinMissionClaimed, setSpinMissionClaimed] =
    useState(false);
  const [winMissionClaimed, setWinMissionClaimed] =
    useState(false);

  const [totalSpins, setTotalSpins] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [biggestWin, setBiggestWin] = useState(0);
  const [biggestJackpot, setBiggestJackpot] = useState(0);
  const [jackpotsWon, setJackpotsWon] = useState(0);
  const [highestLevel, setHighestLevel] = useState(1);

  const [collectedFlags, setCollectedFlags] = useState([]);

  const [message, setMessage] = useState("WORLD FLAGS SLOT");
  const [spinning, setSpinning] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [winningIndexes, setWinningIndexes] = useState([]);
  const [displayWin, setDisplayWin] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const [modal, setModal] = useState(null);
  const [bigWinTitle, setBigWinTitle] = useState("");
  const [bigWinAmount, setBigWinAmount] = useState(0);

  const reelAnimations = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;

  const winAnim = useRef(new Animated.Value(1)).current;
  const bigWinAnim = useRef(new Animated.Value(0)).current;

  const dailyBonusReady =
    Date.now() - lastDailyBonus >= DAY;

  useEffect(() => {
    (async () => {
      const data = await loadGameData();

      if (data) {
        setBalance(data.balance ?? 1000);
        setBet(data.bet ?? 10);
        setFreeSpins(data.freeSpins ?? 0);
        setJackpot(data.jackpot ?? 5000);

        setLevel(data.level ?? 1);
        setXp(data.xp ?? 0);
        setVip(data.vip ?? false);

        setLastDailyBonus(data.lastDailyBonus ?? 0);
        setDailyStreak(data.dailyStreak ?? 0);

        setMissionSpins(data.missionSpins ?? 0);
        setMissionWins(data.missionWins ?? 0);

        setSpinMissionClaimed(
          data.spinMissionClaimed ?? false
        );

        setWinMissionClaimed(
          data.winMissionClaimed ?? false
        );

        setTotalSpins(data.totalSpins ?? 0);
        setTotalWins(data.totalWins ?? 0);
        setBiggestWin(data.biggestWin ?? 0);
        setBiggestJackpot(data.biggestJackpot ?? 0);
        setJackpotsWon(data.jackpotsWon ?? 0);
        setHighestLevel(
          data.highestLevel ?? data.level ?? 1
        );

        setCollectedFlags(data.collectedFlags ?? []);
      }

      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;

    saveGameData({
      balance,
      bet,
      freeSpins,
      jackpot,
      level,
      xp,
      vip,
      lastDailyBonus,
      dailyStreak,
      missionSpins,
      missionWins,
      spinMissionClaimed,
      winMissionClaimed,
      totalSpins,
      totalWins,
      biggestWin,
      biggestJackpot,
      jackpotsWon,
      highestLevel,
      collectedFlags,
    });
  }, [
    loaded,
    balance,
    bet,
    freeSpins,
    jackpot,
    level,
    xp,
    vip,
    lastDailyBonus,
    dailyStreak,
    missionSpins,
    missionWins,
    spinMissionClaimed,
    winMissionClaimed,
    totalSpins,
    totalWins,
    biggestWin,
    biggestJackpot,
    jackpotsWon,
    highestLevel,
    collectedFlags,
  ]);

  useEffect(() => {
    if (level > highestLevel) {
      setHighestLevel(level);
    }
  }, [level, highestLevel]);

  const pulse = () => {
    winAnim.setValue(1);

    Animated.sequence([
      Animated.timing(winAnim, {
        toValue: 1.18,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(winAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showBigWin = (title, amount) => {
    setBigWinTitle(title);
    setBigWinAmount(amount);
    setModal("bigwin");

    bigWinAnim.setValue(0);

    Animated.spring(bigWinAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const addXp = (amount) => {
    setXp((old) => {
      let next = old + amount;

      if (next >= 100) {
        next -= 100;
        setLevel((value) => value + 1);
      }

      return next;
    });
  };

  const claimDailyBonus = () => {
    if (!dailyBonusReady) {
      setMessage("DAILY BONUS AVAILABLE LATER");
      return;
    }

    const now = Date.now();

    const streak =
      lastDailyBonus &&
      now - lastDailyBonus < DAY * 2
        ? Math.min(dailyStreak + 1, 7)
        : 1;

    let bonus =
      250 +
      level * 50 +
      streak * 50;

    if (vip) {
      bonus *= 2;
    }

    setBalance((value) => value + bonus);
    setDailyStreak(streak);
    setLast
