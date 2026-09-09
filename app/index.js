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
} from "./gameData";

import {
  loadGameData,
  saveGameData,
} from "./storage";

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
  const [spinMissionClaimed, setSpinMissionClaimed] = useState(false);
  const [winMissionClaimed, setWinMissionClaimed] = useState(false);

  const [totalSpins, setTotalSpins] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [biggestWin, setBiggestWin] = useState(0);
  const [jackpotsWon, setJackpotsWon] = useState(0);

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
        setSpinMissionClaimed(data.spinMissionClaimed ?? false);
        setWinMissionClaimed(data.winMissionClaimed ?? false);

        setTotalSpins(data.totalSpins ?? 0);
        setTotalWins(data.totalWins ?? 0);
        setBiggestWin(data.biggestWin ?? 0);
        setJackpotsWon(data.jackpotsWon ?? 0);
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
      jackpotsWon,
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
    jackpotsWon,
  ]);

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

    if (vip) bonus *= 2;

    setBalance((value) => value + bonus);
    setDailyStreak(streak);
    setLastDailyBonus(now);
    setMessage(`DAILY BONUS +${bonus}`);

    Vibration.vibrate(150);
  };

  const claimMission = (type) => {
    if (
      type === "spin" &&
      missionSpins >= 20 &&
      !spinMissionClaimed
    ) {
      setBalance((value) => value + 500);
      setSpinMissionClaimed(true);
      setMessage("MISSION +500");
    }

    if (
      type === "win" &&
      missionWins >= 5 &&
      !winMissionClaimed
    ) {
      setBalance((value) => value + 750);
      setWinMissionClaimed(true);
      setMessage("MISSION +750");
    }
  };

  const buyCredits = (amount) => {
    setBalance((value) => value + amount);
    setMessage(`TEST SHOP +${amount}`);
  };

  const activateVip = () => {
    if (vip) return;

    setVip(true);
    setBalance((value) => value + 10000);
    setMessage("👑 VIP ACTIVATED");
  };

  const animateReels = (callback) => {
    reelAnimations.forEach((animation) =>
      animation.setValue(0)
    );

    Animated.parallel(
      reelAnimations.map((animation, index) =>
        Animated.sequence([
          Animated.delay(index * 130),
          Animated.timing(animation, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: -1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
        ])
      )
    ).start(callback);
  };

  const spin = () => {
    if (spinning || modal || !loaded) return;

    if (freeSpins <= 0 && balance < bet) {
      setMessage("NOT ENOUGH CREDITS");
      setAutoSpin(false);
      return;
    }

    setSpinning(true);
    setWinningIndexes([]);
    setDisplayWin(0);
    setMessage("SPINNING...");

    setTotalSpins((value) => value + 1);

    const usingFreeSpin = freeSpins > 0;

    let newBalance = balance;
    let newJackpot = jackpot;

    if (usingFreeSpin) {
      setFreeSpins((value) =>
        Math.max(0, value - 1)
      );
    } else {
      newBalance -= bet;

      newJackpot += Math.max(
        1,
        Math.floor(bet * 0.05)
      );

      addXp(vip ? 15 : 10);

      setMissionSpins((value) =>
        Math.min(20, value + 1)
      );
    }

    animateReels(() => {
      const nextReels = createReels();
      const result = checkWins(nextReels, bet);

      const globes =
        nextReels.filter((symbol) => symbol === GLOBE).length;

      const diamonds =
        nextReels.filter((symbol) => symbol === JACKPOT).length;

      let awardedFreeSpins = 0;
      let jackpotWin = 0;

      if (globes === 3) awardedFreeSpins = 8;
      if (globes === 4) awardedFreeSpins = 12;
      if (globes >= 5) awardedFreeSpins = 20;

      if (diamonds >= 3) {
        jackpotWin = newJackpot;
        newJackpot = 5000;

        setJackpotsWon((value) => value + 1);
      }

      if (awardedFreeSpins > 0) {
        setFreeSpins((value) =>
          value + awardedFreeSpins
        );
      }

      const totalWin =
        result.totalWin + jackpotWin;

      newBalance += totalWin;

      setBalance(newBalance);
      setJackpot(newJackpot);
      setReels(nextReels);
      setWinningIndexes(result.winningIndexes);
      setDisplayWin(totalWin);

      if (totalWin > 0) {
        setTotalWins((value) => value + 1);

        setBiggestWin((value) =>
          Math.max(value, totalWin)
        );

        setMissionWins((value) =>
          Math.min(5, value + 1)
        );

        pulse();
        Vibration.vibrate(150);
      }

      if (jackpotWin > 0) {
        setAutoSpin(false);
        setMessage(`💎 JACKPOT ${jackpotWin}`);
        showBigWin("JACKPOT", jackpotWin);
      } else if (result.totalWin >= bet * 20) {
        setAutoSpin(false);
        setMessage(`MEGA WIN ${result.totalWin}`);
        showBigWin("MEGA WIN", result.totalWin);
      } else if (result.totalWin >= bet * 10) {
        setMessage(`BIG WIN ${result.totalWin}`);
      } else if (result.totalWin > 0) {
        setMessage(`WIN ${result.totalWin}`);
      } else if (awardedFreeSpins > 0) {
        setMessage(`${awardedFreeSpins} FREE SPINS`);
      } else {
        setMessage(
          usingFreeSpin
            ? "FREE SPIN"
            : "GOOD LUCK!"
        );
      }

      setSpinning(false);
    });
  };

  useEffect(() => {
    if (
      !autoSpin ||
      spinning ||
      modal ||
      !loaded
    ) {
      return;
    }

    const timer =
      setTimeout(spin, 1200);

    return () =>
      clearTimeout(timer);
  }, [
    autoSpin,
    spinning,
    modal,
    balance,
    freeSpins,
    bet,
    loaded,
  ]);

  const achievements = [
    {
      icon: "🎰",
      title: "ROOKIE SPINNER",
      text: "100 total spins",
      unlocked: totalSpins >= 100,
    },
    {
      icon: "🏆",
      title: "WINNER",
      text: "25 total wins",
      unlocked: totalWins >= 25,
    },
    {
      icon: "💎",
      title: "JACKPOT HUNTER",
      text: "Win your first jackpot",
      unlocked: jackpotsWon >= 1,
    },
    {
      icon: "💰",
      title: "BIG MONEY",
      text: "Win 1,000+ credits",
      unlocked: biggestWin >= 1000,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>

      <GameModal
        visible={modal === "bigwin"}
        onClose={() => setModal(null)}
      >
        <Animated.View
          style={{
            alignItems: "center",
            transform: [{ scale: bigWinAnim }],
          }}
        >
          <Text style={styles.bigEmoji}>
            {bigWinTitle === "JACKPOT" ? "💎" : "🏆"}
          </Text>

          <Text style={styles.bigTitle}>
            {bigWinTitle}
          </Text>

          <Text style={styles.bigAmount}>
            {bigWinAmount}
          </Text>
        </Animated.View>
      </GameModal>

      <GameModal
        visible={modal === "profile"}
        onClose={() => setModal(null)}
        title="👤 PROFILE"
      >
        <Card>
          <Text style={styles.profileLevel}>
            LEVEL {level}
          </Text>

          {vip && (
            <Text style={styles.vip}>
              👑 VIP PLAYER
            </Text>
          )}
        </Card>

        <ProfileStat
          icon="🎰"
          title="TOTAL SPINS"
          value={totalSpins}
        />

        <ProfileStat
          icon="🏆"
          title="TOTAL WINS"
          value={totalWins}
        />

        <ProfileStat
          icon="💰"
          title="BIGGEST WIN"
          value={biggestWin}
        />

        <ProfileStat
          icon="💎"
          title="JACKPOTS WON"
          value={jackpotsWon}
        />

        <Text style={styles.achievementHeading}>
          🏅 ACHIEVEMENTS
        </Text>

        {achievements.map((item) => (
          <View
            key={item.title}
            style={[
              styles.achievementCard,
              !item.unlocked &&
                styles.achievementLocked,
            ]}
          >
            <Text style={styles.achievementIcon}>
              {item.unlocked ? item.icon : "🔒"}
            </Text>

            <View style={{ flex: 1 }}>
              <Text style={styles.achievementTitle}>
                {item.title}
              </Text>

              <Text style={styles.achievementText}>
                {item.text}
              </Text>
            </View>

            <Text style={styles.achievementStatus}>
              {item.unlocked ? "✓" : ""}
            </Text>
          </View>
        ))}
      </GameModal>

      <GameModal
        visible={modal === "shop"}
        onClose={() => setModal(null)}
        title="🛒 SHOP"
      >
        {[5000, 150
