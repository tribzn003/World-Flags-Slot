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

export default function HomeScreen() {
  const [reels, setReels] = useState(createReels());

  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);
  const [freeSpins, setFreeSpins] = useState(0);
  const [jackpot, setJackpot] = useState(5000);

  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);

  const [lastDailyBonus, setLastDailyBonus] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);

  const [missionSpins, setMissionSpins] = useState(0);
  const [missionWins, setMissionWins] = useState(0);

  const [spinMissionClaimed, setSpinMissionClaimed] =
    useState(false);

  const [winMissionClaimed, setWinMissionClaimed] =
    useState(false);

  const [vip, setVip] = useState(false);

  const [message, setMessage] =
    useState("WORLD FLAGS SLOT");

  const [spinning, setSpinning] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);

  const [winningIndexes, setWinningIndexes] =
    useState([]);

  const [displayWin, setDisplayWin] = useState(0);

  const [loaded, setLoaded] = useState(false);

  const [paytableVisible, setPaytableVisible] =
    useState(false);

  const [missionsVisible, setMissionsVisible] =
    useState(false);

  const [shopVisible, setShopVisible] =
    useState(false);

  const [bigWinVisible, setBigWinVisible] =
    useState(false);

  const [bigWinTitle, setBigWinTitle] =
    useState("");

  const [bigWinAmount, setBigWinAmount] =
    useState(0);

  const reelAnimations = useRef(
    Array.from(
      { length: 5 },
      () => new Animated.Value(0)
    )
  ).current;

  const winAnim = useRef(
    new Animated.Value(1)
  ).current;

  const bigWinAnim = useRef(
    new Animated.Value(0)
  ).current;

  const winTimerRef = useRef(null);

  const DAY =
    24 * 60 * 60 * 1000;

  const dailyBonusReady =
    Date.now() - lastDailyBonus >= DAY;

  useEffect(() => {
    const load = async () => {
      const data =
        await loadGameData();

      if (data) {
        if (typeof data.balance === "number") {
          setBalance(data.balance);
        }

        if (typeof data.bet === "number") {
          setBet(data.bet);
        }

        if (typeof data.freeSpins === "number") {
          setFreeSpins(data.freeSpins);
        }

        if (typeof data.jackpot === "number") {
          setJackpot(data.jackpot);
        }

        if (typeof data.level === "number") {
          setLevel(data.level);
        }

        if (typeof data.xp === "number") {
          setXp(data.xp);
        }

        if (typeof data.lastDailyBonus === "number") {
          setLastDailyBonus(data.lastDailyBonus);
        }

        if (typeof data.dailyStreak === "number") {
          setDailyStreak(data.dailyStreak);
        }

        if (typeof data.missionSpins === "number") {
          setMissionSpins(data.missionSpins);
        }

        if (typeof data.missionWins === "number") {
          setMissionWins(data.missionWins);
        }

        if (
          typeof data.spinMissionClaimed === "boolean"
        ) {
          setSpinMissionClaimed(
            data.spinMissionClaimed
          );
        }

        if (
          typeof data.winMissionClaimed === "boolean"
        ) {
          setWinMissionClaimed(
            data.winMissionClaimed
          );
        }

        if (typeof data.vip === "boolean") {
          setVip(data.vip);
        }
      }

      setLoaded(true);
    };

    load();
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
      lastDailyBonus,
      dailyStreak,
      missionSpins,
      missionWins,
      spinMissionClaimed,
      winMissionClaimed,
      vip,
    });
  }, [
    loaded,
    balance,
    bet,
    freeSpins,
    jackpot,
    level,
    xp,
    lastDailyBonus,
    dailyStreak,
    missionSpins,
    missionWins,
    spinMissionClaimed,
    winMissionClaimed,
    vip,
  ]);

  useEffect(() => {
    return () => {
      if (winTimerRef.current) {
        clearInterval(
          winTimerRef.current
        );
      }
    };
  }, []);

  const addXp = (amount) => {
    setXp((oldXp) => {
      let nextXp =
        oldXp + amount;

      let levelsGained = 0;

      while (nextXp >= 100) {
        nextXp -= 100;
        levelsGained++;
      }

      if (levelsGained > 0) {
        setLevel((oldLevel) => {
          const nextLevel =
            oldLevel + levelsGained;

          setMessage(
            `LEVEL UP! LEVEL ${nextLevel}`
          );

          return nextLevel;
        });

        Vibration.vibrate([
          0,
          150,
          100,
          250,
        ]);
      }

      return nextXp;
    });
  };

  const claimDailyBonus = () => {
    if (!dailyBonusReady) {
      setMessage(
        "DAILY BONUS AVAILABLE LATER"
      );

      return;
    }

    const now = Date.now();

    let nextStreak = 1;

    if (
      lastDailyBonus > 0 &&
      now - lastDailyBonus < DAY * 2
    ) {
      nextStreak =
        dailyStreak + 1;
    }

    const cappedStreak =
      Math.min(nextStreak, 7);

    let bonus =
      250 +
      level * 50 +
      cappedStreak * 50;

    if (vip) {
      bonus *= 2;
    }

    setBalance(
      (value) =>
        value + bonus
    );

    setDailyStreak(
      cappedStreak
    );

    setLastDailyBonus(now);

    setMessage(
      `DAILY BONUS +${bonus}`
    );

    Vibration.vibrate([
      0,
      100,
      80,
      180,
    ]);
  };

  const buyCredits = (amount) => {
    setBalance(
      (value) =>
        value + amount
    );

    setMessage(
      `SHOP +${amount} CREDITS`
    );

    Vibration.vibrate(120);
  };

  const activateVip = () => {
    if (vip) {
      setMessage(
        "VIP ALREADY ACTIVE"
      );

      return;
    }

    setVip(true);

    setBalance(
      (value) =>
        value + 10000
    );

    setMessage(
      "👑 VIP ACTIVATED +10000"
    );

    Vibration.vibrate([
      0,
      150,
      100,
      250,
    ]);
  };

  const claimSpinMission = () => {
    if (
      missionSpins < 20 ||
      spinMissionClaimed
    ) {
      return;
    }

    setBalance(
      (value) =>
        value + 500
    );

    setSpinMissionClaimed(true);

    setMessage(
      "MISSION REWARD +500"
    );

    Vibration.vibrate(180);
  };

  const claimWinMission = () => {
    if (
      missionWins < 5 ||
      winMissionClaimed
    ) {
      return;
    }

    setBalance(
      (value) =>
        value + 750
    );

    setWinMissionClaimed(true);

    setMessage(
      "MISSION REWARD +750"
    );

    Vibration.vibrate(180);
  };

  const runWinAnimation = () => {
    winAnim.setValue(1);

    Animated.sequence([
      Animated.timing(winAnim, {
        toValue: 1.18,
        duration: 180,
        useNativeDriver: true,
      }),

      Animated.timing(winAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),

      Animated.timing(winAnim, {
        toValue: 1.18,
        duration: 180,
        useNativeDriver: true,
      }),

      Animated.timing(winAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showBigWin = (
    title,
    amount
  ) => {
    setBigWinTitle(title);
    setBigWinAmount(amount);
    setBigWinVisible(true);

    bigWinAnim.setValue(0);

    Animated.spring(
      bigWinAnim,
      {
        toValue: 1,
        friction: 5,
        tension: 70,
        useNativeDriver: true,
      }
    ).start();
  };

  const animateWinCounter = (
    target
  ) => {
    if (winTimerRef.current) {
      clearInterval(
        winTimerRef.current
      );
    }

    if (target <= 0) {
      setDisplayWin(0);
      return;
    }

    setDisplayWin(0);

    const steps = 30;
    let currentStep = 0;

    winTimerRef.current =
      setInterval(() => {
        currentStep++;

        const value =
          Math.round(
            target *
              currentStep /
              steps
          );

        setDisplayWin(value);

        if (
          currentStep >= steps
        ) {
          clearInterval(
            winTimerRef.current
          );

          winTimerRef.current =
            null;

          setDisplayWin(
            target
          );
        }
      }, 35);
  };

  const runReelAnimations = (
    callback
  ) => {
    reelAnimations.forEach(
      (anim) =>
        anim.setValue(0)
    );

    const animations =
      reelAnimations.map(
        (anim, index) =>
          Animated.sequence([
            Animated.delay(
              index * 170
            ),

            Animated.timing(
              anim,
              {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }
            ),

            Animated.timing(
              anim,
              {
                toValue: -1,
                duration: 200,
                useNativeDriver: true,
              }
            ),

            Animated.timing(
              anim,
              {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }
            ),

            Animated.timing(
              anim,
              {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }
            ),
          ])
      );

    Animated.parallel(
      animations
    ).start(callback);
  };

  const spin = () => {
    if (
      spinning ||
      bigWinVisible ||
      paytableVisible ||
      missionsVisible ||
      shopVisible ||
      !loaded
    ) {
      return;
    }

    if (
      freeSpins <= 0 &&
      balance < bet
    ) {
      setMessage(
        "NOT ENOUGH CREDITS"
      );

      setAutoSpin(false);
      return;
    }

    setSpinning(true);

    setWinningIndexes([]);
    setDisplayWin(0);

    setMessage(
      "SPINNING..."
    );

    let currentBalance =
      balance;

    let currentJackpot =
      jackpot;

    const usingFreeSpin =
      freeSpins > 0;

    if (usingFreeSpin) {
      setFreeSpins(
        (value) =>
          Math.max(
            0,
            value - 1
          )
      );
    } else {
      currentBalance -=
        bet;

      currentJackpot +=
        Math.max(
          1,
          Math.floor(
            bet * 0.05
          )
        );

      addXp(
        vip
          ? 15
          : 10
      );

      setMissionSpins(
        (value) =>
          Math.min(
            20,
            value + 1
          )
      );
    }

    runReelAnimations(
      () => {
        const newReels =
          createReels();

        setReels(
          newReels
        );

        const result =
          checkWins(
            newReels,
            bet
          );

        const globes =
          newReels.filter(
            (symbol) =>
              symbol === GLOBE
          ).length;

        const diamonds =
          newReels.filter(
            (symbol) =>
              symbol === JACKPOT
          ).length;

        let awardedFreeSpins =
          0;

        let jackpotWin =
          0;

        if (globes === 3) {
          awardedFreeSpins =
            8;
        } else if (
          globes === 4
        ) {
          awardedFreeSpins =
            12;
        } else if (
          globes >= 5
        ) {
          awardedFreeSpins =
            20;
        }

        if (
          diamonds >= 3
        ) {
          jackpotWin =
            currentJackpot;

          currentJackpot =
            5000;
        }

        if (
          awardedFreeSpins > 0
        ) {
          setFreeSpins(
            (value) =>
              value +
              awardedFreeSpins
          );
        }

        const totalPaid =
          result.totalWin +
          jackpotWin;

        currentBalance +=
          totalPaid;

        setBalance(
          currentBalance
        );

        setJackpot(
          currentJackpot
        );

        setWinningIndexes(
          result.winningIndexes
        );

        animateWinCounter(
          totalPaid
        );

        if (
          result.totalWin > 0 ||
          jackpotWin > 0
        ) {
          setMissionWins(
            (value) =>
              Math.min(
                5,
                value + 1
              )
          );
        }

        if (
          jackpotWin > 0
        ) {
          Vibration.vibrate([
            0,
            200,
            100,
            300,
            100,
            500,
          ]);

          runWinAnimation();

          setMessage(
            `💎 JACKPOT ${jackpotWin}!
