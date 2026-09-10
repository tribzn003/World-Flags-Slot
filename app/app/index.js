import React, { useEffect, useRef, useState } from "react";

import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Animated,
  Modal,
  ScrollView,
} from "react-native";

import { useAudioPlayer } from "expo-audio";

import {
  createReels,
  checkWins,
  randomSymbol,
  flags,
  GLOBE,
  WILD,
  JACKPOT,
} from "./gameData";

import {
  loadGameData,
  saveGameData,
} from "./storage";

const XP_PER_LEVEL = 100;

const SOUND_BASE = [
  "https:",
  "",
  "raw.githubusercontent.com",
  "yahayuta",
  "swing_slot",
  "main",
  "sounds",
].join("/");

const SPIN_SOUND = `${SOUND_BASE}/spin.wav`;
const STOP_SOUND = `${SOUND_BASE}/stop.wav`;
const WIN_SOUND = `${SOUND_BASE}/win.wav`;
const JACKPOT_SOUND = `${SOUND_BASE}/jackpot.wav`;

const defaultStats = {
  totalSpins: 0,
  totalWins: 0,
  biggestWin: 0,
  jackpotsWon: 0,
  biggestJackpot: 0,
};

export default function HomeScreen() {
  const [reels, setReels] = useState(createReels());
  const [displayReels, setDisplayReels] = useState(reels);

  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);
  const [freeSpins, setFreeSpins] = useState(0);
  const [jackpot, setJackpot] = useState(5000);
  const [win, setWin] = useState(0);

  const [message, setMessage] = useState("GOOD LUCK!");
  const [spinning, setSpinning] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);

  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [highestLevel, setHighestLevel] = useState(1);

  const [dailyStreak, setDailyStreak] = useState(1);
  const [lastDailyClaim, setLastDailyClaim] = useState(null);

  const [vip, setVip] = useState(false);

  const [stats, setStats] = useState(defaultStats);

  const [missionSpins, setMissionSpins] = useState(0);
  const [missionWins, setMissionWins] = useState(0);

  const [spinMissionClaimed, setSpinMissionClaimed] =
    useState(false);

  const [winMissionClaimed, setWinMissionClaimed] =
    useState(false);

  const [collectedFlags, setCollectedFlags] = useState([]);

  const [modal, setModal] = useState(null);
  const [bigWinText, setBigWinText] = useState(null);

  const [winningIndexes, setWinningIndexes] = useState([]);

  const spinPlayer = useAudioPlayer(SPIN_SOUND, {
    downloadFirst: true,
  });

  const stopPlayer = useAudioPlayer(STOP_SOUND, {
    downloadFirst: true,
  });

  const winPlayer = useAudioPlayer(WIN_SOUND, {
    downloadFirst: true,
  });

  const jackpotPlayer = useAudioPlayer(JACKPOT_SOUND, {
    downloadFirst: true,
  });

  const columnAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const winPulse = useRef(new Animated.Value(0)).current;

  const timers = useRef([]);

  const playSound = async (player) => {
    if (!soundEnabled || !player) return;

    try {
      await player.seekTo(0);
      player.play();
    } catch (error) {
      console.log("SOUND ERROR:", error);
    }
  };

  const stopSpinSound = () => {
    try {
      spinPlayer.pause();
      spinPlayer.seekTo(0);
    } catch (error) {
      console.log("SPIN SOUND STOP ERROR:", error);
    }
  };

  const animateWin = () => {
    winPulse.setValue(0);

    Animated.sequence([
      Animated.timing(winPulse, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),

      Animated.timing(winPulse, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),

      Animated.timing(winPulse, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),

      Animated.timing(winPulse, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),

      Animated.timing(winPulse, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),

      Animated.timing(winPulse, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    async function load() {
      const data = await loadGameData();

      if (data) {
        setBalance(data.balance ?? 1000);
        setBet(data.bet ?? 10);
        setFreeSpins(data.freeSpins ?? 0);
        setJackpot(data.jackpot ?? 5000);

        setSoundEnabled(data.soundEnabled ?? true);

        setLevel(data.level ?? 1);
        setXp(data.xp ?? 0);
        setHighestLevel(data.highestLevel ?? 1);

        setDailyStreak(data.dailyStreak ?? 1);
        setLastDailyClaim(data.lastDailyClaim ?? null);

        setVip(data.vip ?? false);

        setStats({
          ...defaultStats,
          ...(data.stats || {}),
        });

        setMissionSpins(data.missionSpins ?? 0);
        setMissionWins(data.missionWins ?? 0);

        setSpinMissionClaimed(
          data.spinMissionClaimed ?? false
        );

        setWinMissionClaimed(
          data.winMissionClaimed ?? false
        );

        setCollectedFlags(
          data.collectedFlags ?? []
        );
      }

      setLoaded(true);
    }

    load();

    return () => {
      timers.current.forEach((timer) =>
        clearTimeout(timer)
      );
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;

    saveGameData({
      balance,
      bet,
      freeSpins,
      jackpot,
      soundEnabled,

      level,
      xp,
      highestLevel,

      dailyStreak,
      lastDailyClaim,

      vip,
      stats,

      missionSpins,
      missionWins,

      spinMissionClaimed,
      winMissionClaimed,

      collectedFlags,
    });
  }, [
    loaded,
    balance,
    bet,
    freeSpins,
    jackpot,
    soundEnabled,
    level,
    xp,
    highestLevel,
    dailyStreak,
    lastDailyClaim,
    vip,
    stats,
    missionSpins,
    missionWins,
    spinMissionClaimed,
    winMissionClaimed,
    collectedFlags,
  ]);

  useEffect(() => {
    if (!soundEnabled) {
      try {
        spinPlayer.pause();
        stopPlayer.pause();
        winPlayer.pause();
        jackpotPlayer.pause();
      } catch (error) {
        console.log("MUTE ERROR:", error);
      }
    }
  }, [soundEnabled]);

  const randomizeColumn = (current, column) => {
    const next = [...current];

    for (let row = 0; row < 3; row++) {
      next[row * 5 + column] = randomSymbol();
    }

    return next;
  };

  const animateColumn = (column, duration) => {
    const anim = columnAnimations[column];

    anim.setValue(0);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),

        Animated.timing(anim, {
          toValue: -1,
          duration: 80,
          useNativeDriver: true,
        }),

        Animated.timing(anim, {
          toValue: 0,
          duration: 80,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    const timer = setTimeout(() => {
      loop.stop();

      Animated.spring(anim, {
        toValue: 0,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }, duration);

    timers.current.push(timer);
  };

  const startSpinAnimation = (
    finalReels,
    finished
  ) => {
    const stopTimes = [
      600,
      800,
      1000,
      1200,
      1400,
    ];

    const active = [
      true,
      true,
      true,
      true,
      true,
    ];

    for (let column = 0; column < 5; column++) {
      animateColumn(
        column,
        stopTimes[column]
      );
    }

    const interval = setInterval(() => {
      setDisplayReels((current) => {
        let next = [...current];

        for (
          let column = 0;
          column < 5;
          column++
        ) {
          if (active[column]) {
            next = randomizeColumn(
              next,
              column
            );
          }
        }

        return next;
      });
    }, 75);

    stopTimes.forEach((time, column) => {
      const timer = setTimeout(() => {
        active[column] = false;

        playSound(stopPlayer);

        setDisplayReels((current) => {
          const next = [...current];

          for (let row = 0; row < 3; row++) {
            const index =
              row * 5 + column;

            next[index] =
              finalReels[index];
          }

          return next;
        });

        if (column === 4) {
          clearInterval(interval);

          stopSpinSound();

          setDisplayReels(finalReels);

          finished();
        }
      }, time);

      timers.current.push(timer);
    });
  };

  const addXp = () => {
    const amount = vip ? 15 : 10;

    let newXp = xp + amount;
    let newLevel = level;

    while (newXp >= XP_PER_LEVEL) {
      newXp -= XP_PER_LEVEL;
      newLevel += 1;
    }

    setXp(newXp);
    setLevel(newLevel);

    if (newLevel > highestLevel) {
      setHighestLevel(newLevel);
    }
  };

  const collectWinningFlags = (
    finalReels,
    winningIndexesList
  ) => {
    const newFlags = [];

    winningIndexesList.forEach((index) => {
      const symbol = finalReels[index];

      if (
        flags.includes(symbol) &&
        !collectedFlags.includes(symbol) &&
        !newFlags.includes(symbol)
      ) {
        newFlags.push(symbol);
      }
    });

    if (newFlags.length > 0) {
      setCollectedFlags((current) => [
        ...current,
        ...newFlags,
      ]);
    }
  };

  const spin = () => {
    if (spinning || !loaded) return;

    const usingFreeSpin =
      freeSpins > 0;

    if (
      !usingFreeSpin &&
      balance < bet
    ) {
      setMessage(
        "NOT ENOUGH CREDITS"
      );

      setAutoSpin(false);
      return;
    }

    setSpinning(true);
    setWin(0);
    setWinningIndexes([]);

    setMessage(
      usingFreeSpin
        ? "FREE SPIN..."
        : "SPINNING..."
    );

    playSound(spinPlayer);

    let nextBalance = balance;
    let nextJackpot = jackpot;

    if (usingFreeSpin) {
      setFreeSpins((value) =>
        Math.max(0, value - 1)
      );
    } else {
      nextBalance -= bet;

      nextJackpot += Math.max(
        1,
        Math.floor(bet * 0.05)
      );
    }

    const finalReels =
      createReels();

    startSpinAnimation(
      finalReels,
      () => {
        const result =
          checkWins(finalReels, bet);

        const globes =
          finalReels.filter(
            (symbol) =>
              symbol === GLOBE
          ).length;

        const diamonds =
          finalReels.filter(
            (symbol) =>
              symbol === JACKPOT
          ).length;

        let freeAward = 0;
        let jackpotWin = 0;

        if (globes === 3) {
          freeAward = 8;
        } else if (globes === 4) {
          freeAward = 12;
        } else if (globes >= 5) {
          freeAward = 20;
        }

        if (freeAward > 0) {
          setFreeSpins(
            (value) =>
              value + freeAward
          );
        }

        if (diamonds >= 3) {
          jackpotWin =
            nextJackpot;

          nextJackpot = 5000;
        }

        const totalWin =
          result.totalWin +
          jackpotWin;

        nextBalance += totalWin;

        setReels(finalReels);
        setDisplayReels(
          finalReels
        );

        setBalance(nextBalance);
        setJackpot(nextJackpot);
        setWin(totalWin);

        let highlightIndexes = [
          ...result.winningIndexes,
        ];

        if (jackpotWin > 0) {
          finalReels.forEach(
            (symbol, index) => {
              if (
                symbol === JACKPOT &&
                !highlightIndexes.includes(index)
              ) {
                highlightIndexes.push(index);
              }
            }
          );
        }

        if (
          freeAward > 0 &&
          highlightIndexes.length === 0
        ) {
          finalReels.forEach(
            (symbol, index) => {
              if (
                symbol === GLOBE
              ) {
                highlightIndexes.push(index);
              }
            }
          );
        }

        if (highlightIndexes.length > 0) {
          setWinningIndexes(
            highlightIndexes
          );

          animateWin();
        }

        if (!usingFreeSpin) {
          addXp();

          setMissionSpins(
            (value) =>
              Math.min(
                20,
                value + 1
              )
          );

          setStats(
            (current) => ({
              ...current,

              totalSpins:
                current.totalSpins +
                1,
            })
          );
        }

        if (totalWin > 0) {
          setMissionWins(
            (value) =>
              Math.min(
                5,
                value + 1
              )
          );

          setStats(
            (current) => ({
              ...current,

              totalWins:
                current.totalWins +
                1,

              biggestWin:
                Math.max(
                  current.biggestWin,
                  totalWin
                ),

              jackpotsWon:
                current.jackpotsWon +
                (jackpotWin > 0
                  ? 1
                  : 0),

              biggestJackpot:
                Math.max(
                  current.biggestJackpot,
                  jackpotWin
                ),
            })
          );

          collectWinningFlags(
            finalReels,
            result.winningIndexes
          );
        }

        if (jackpotWin > 0) {
          playSound(
            jackpotPlayer
          );

          setMessage(
            `💎 JACKPOT ${jackpotWin}`
          );

          setBigWinText(
            `💎 JACKPOT\n${jackpotWin}`
          );

          Vibration.vibrate(400);
        } else if (
          totalWin >= bet * 20
        ) {
          playSound(winPlayer);

          setMessage(
            `🔥 MEGA WIN ${totalWin}`
          );

          setBigWinText(
            `🔥 MEGA WIN\n${totalWin}`
          );

          Vibration.vibrate(250);
        } else if (
          totalWin >= bet * 10
        ) {
          playSound(winPlayer);

          setMessage(
            `🏆 BIG WIN ${totalWin}`
          );

          setBigWinText(
            `🏆 BIG WIN\n${totalWin}`
          );

          Vibration.vibrate(180);
        } else if (
          totalWin > 0
        ) {
          playSound(winPlayer);

          setMessage(
            `🏆 WIN ${totalWin}`
          );

          Vibration.vibrate(120);
        } else if (
          freeAward > 0
        ) {
          setMessage(
            `🌐 ${freeAward} FREE SPINS`
          );
        } else {
          setMessage(
            "GOOD LUCK!"
          );
        }

        setSpinning(false);
      }
    );
  };

  useEffect(() => {
    if (
      !autoSpin ||
      spinning ||
      !loaded ||
      modal ||
      bigWinText
    ) {
      return;
    }

    const timer =
      setTimeout(spin, 900);

    return () =>
      clearTimeout(timer);
  }, [
    autoSpin,
    spinning,
    balance,
    bet,
    freeSpins,
    jackpot,
    loaded,
    modal,
    bigWinText,
  ]);

  const claimDaily = () => {
    const today =
      new Date().toDateString();

    if (
      lastDailyClaim === today
    ) {
      setMessage(
        "DAILY BONUS ALREADY CLAIMED"
      );

      return;
    }

    let streak = dailyStreak;

    if (lastDailyClaim) {
      const last =
        new Date(lastDailyClaim);

      const now =
        new Date();

      const difference =
        Math.round(
          (now - last) /
            86400000
        );

      if (difference === 1) {
        streak = Math.min(
          7,
          dailyStreak + 1
        );
      } else if (
        difference > 1
      ) {
        streak = 1;
      }
    }

    let reward =
      250 +
      level * 50 +
      streak * 50;

    if (vip) {
      reward *= 2;
    }

    setBalance(
      (value) =>
        value + reward
    );

    setDailyStreak(streak);
    setLastDailyClaim(today);

    setMessage(
      `🎁 DAILY BONUS +${reward}`
    );

    setModal(null);
  };

  const claimSpinMission = () => {
    if (
      missionSpins >= 20 &&
      !spinMissionClaimed
    ) {
      setBalance(
        (value) =>
          value + 500
      );

      setSpinMissionClaimed(
        true
      );

      setMessage(
        "MISSION +500"
      );
    }
  };

  const claimWinMission = () => {
    if (
      missionWins >= 5 &&
      !winMissionClaimed
    ) {
      setBalance(
        (value) =>
          value + 750
      );

      setWinMissionClaimed(
        true
      );

      setMessage(
        "MISSION +750"
      );
    }
  };

  const activateVip = () => {
    if (vip) return;

    setVip(true);

    setBalance(
      (value) =>
        value + 10000
    );

    setMessage(
      "👑 VIP ACTIVATED +10000"
    );
  };

  const buyTestCredits = (
    amount
  ) => {
    setBalance(
      (value) =>
        value + amount
    );

    setMessage(
      `TEST CREDITS +${amount}`
    );
  };

  const achievements = [
    {
      title:
        "ROOKIE SPINNER",
      unlocked:
        stats.totalSpins >= 100,
    },
    {
      title: "WINNER",
      unlocked:
        stats.totalWins >= 25,
    },
    {
      title:
        "JACKPOT HUNTER",
      unlocked:
        stats.jackpotsWon >= 1,
    },
    {
      title: "BIG MONEY",
      unlocked:
        stats.biggestWin >= 1000,
    },
    {
      title:
        "WORLD TRAVELER",
      unlocked:
        collectedFlags.length >= 50,
    },
    {
      title:
        "MASTER COLLECTOR",
      unlocked:
        collectedFlags.length >= 193,
    },
  ];

  const getColumn = (
    column
  ) => [
    displayReels[column],
    displayReels[5 + column],
    displayReels[10 + column],
  ];

  const winScale =
    winPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.12],
    });

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={
          styles.page
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <Text
          style={styles.title}
        >
          🌍 WORLD FLAGS SLOT 🌍
        </Text>

        <Text
          style={styles.subtitle}
        >
          193 UN MEMBER STATES
        </Text>

        <View
          style={styles.topInfo}
        >
          <Text
            style={styles.level}
          >
            LEVEL {level}
          </Text>

          <Text
            style={styles.xp}
          >
            XP {xp}/{XP_PER_LEVEL}
          </Text>

          {vip && (
            <Text
              style={styles.vip}
            >
              👑 VIP
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.soundButton,
            !soundEnabled &&
              styles.soundOff,
          ]}
          onPress={() =>
            setSoundEnabled(
              (value) => !value
            )
          }
        >
          <Text
            style={
              styles.soundText
            }
          >
            {soundEnabled
              ? "🔊 SOUND ON"
              : "🔇 SOUND OFF"}
          </Text>
        </TouchableOpacity>

        <View
          style={
            styles.jackpotBox
          }
        >
          <Text
            style={
              styles.jackpotTitle
            }
          >
            💎 JACKPOT
          </Text>

          <Text
            style={
              styles.jackpotValue
            }
          >
            {jackpot}
          </Text>
        </View>

        <View
          style={
            styles.statsRow
          }
        >
          <Stat
            title="BALANCE"
            value={balance}
          />

          <Stat
            title="BET"
            value={bet}
          />

          <Stat
            title="WIN"
            value={win}
          />
        </View>

        <View
          style={styles.slot}
        >
          {[0, 1, 2, 3, 4].map(
            (column) => {
              const move =
                columnAnimations[
                  column
                ].interpolate({
                  inputRange: [
                    -1,
                    0,
                    1,
                  ],

                  outputRange: [
                    -22,
                    0,
                    22,
                  ],
                });

              return (
                <Animated.View
                  key={column}
                  style={[
                    styles.column,
                    {
                      transform: [
                        {
                          translateY:
                            move,
                        },
                      ],
                    },
                  ]}
                >
                  {getColumn(
                    column
                  ).map(
                    (
                      symbol,
                      row
                    ) => {
                      const index =
                        row * 5 +
                        column;

                      const isWinner =
                        winningIndexes.includes(
                          index
                        );

                      return (
                        <Animated.View
                          key={row}
                          style={[
                            styles.cell,
                            isWinner &&
                              styles.winningCell,
                            {
                              transform: [
                                {
                                  scale:
                                    isWinner
                                      ? winScale
                                      : 1,
                                },
                              ],
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.symbol,
                              isWinner &&
                                styles.winningSymbol,
                            ]}
                          >
                            {symbol}
                          </Text>

                          {symbol ===
                            WILD && (
                            <Text
                              style={
                                styles.label
                              }
                            >
                              WILD
                            </Text>
                          )}

                          {symbol ===
                            GLOBE && (
                            <Text
                              style={
                                styles.label
                              }
                            >
                              SCATTER
                            </Text>
                          )}

                          {symbol ===
                            JACKPOT && (
                            <Text
                              style={
                                styles.label
                              }
                            >
                              JACKPOT
                            </Text>
                          )}
                        </Animated.View>
                      );
                    }
                  )}
                </Animated.View>
              );
            }
          )}
        </View>

        <Text
          style={styles.message}
        >
          {loaded
            ? message
            : "LOADING..."}
        </Text>

        <Text
          style={styles.free}
        >
          FREE SPINS: {freeSpins}
        </Text>

        <View
          style={styles.betRow}
        >
          <SmallButton
            text="BET -"
            onPress={() => {
              if (!spinning) {
                setBet(
                  (value) =>
                    Math.max(
                      5,
                      value - 5
                    )
                );
              }
            }}
          />

          <SmallButton
            text="BET +"
            onPress={() => {
              if (!spinning) {
                setBet(
                  (value) =>
                    Math.min(
                      100,
                      value + 5
                    )
                );
              }
            }}
          />

          <SmallButton
            text="MAX"
            onPress={() => {
              if (!spinning) {
                setBet(100);
              }
            }}
          />
        </View>

        <View
          style={
            styles.actionRow
          }
        >
          <TouchableOpacity
            style={[
              styles.autoButton,
              autoSpin &&
                styles.autoActive,
            ]}
            onPress={() =>
              setAutoSpin(
                (value) => !value
              )
            }
          >
            <Text
              style={
                styles.buttonText
              }
            >
              {autoSpin
                ? "STOP AUTO"
                : "AUTO SPIN"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.spinButton,
              spinning &&
                styles.disabled,
            ]}
            disabled={spinning}
            onPress={spin}
          >
            <Text
              style={
                styles.spinText
              }
            >
              {spinning
                ? "SPINNING"
                : "SPIN"}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={
            styles.menuGrid
          }
        >
          <MenuButton
            text="💰 PAYTABLE"
            onPress={() => {
              setAutoSpin(false);
              setModal("paytable");
            }}
          />

          <MenuButton
            text="🎯 MISSIONS"
            onPress={() =>
              setModal("missions")
            }
          />

          <MenuButton
            text="🎁 DAILY"
            onPress={() =>
              setModal("daily")
            }
          />

          <MenuButton
            text="👤 PROFILE"
            onPress={() =>
              setModal("profile")
            }
          />

          <MenuButton
            text="🌍 COLLECTION"
            onPress={() =>
              setModal("collection")
            }
          />

          <MenuButton
            text="🏆 RANK"
            onPress={() =>
              setModal("rank")
            }
          />

          <MenuButton
            text="🏅 ACHIEVEMENTS"
            onPress={() =>
              setModal("achievements")
            }
          />

          <MenuButton
            text="🛒 SHOP / VIP"
            onPress={() =>
              setModal("shop")
            }
          />
        </View>

        <Text
          style={
            styles.testNotice
          }
        >
          TEST VERSION — VIRTUAL CREDITS ONLY
        </Text>
      </ScrollView>

      <GameModal
        visible={!!modal}
        onClose={() =>
          setModal(null)
        }
      >
        {modal === "paytable" && (
          <>
            <ModalTitle text="💰 PAYTABLE" />

            <Card>
              <CardTitle text="STANDARD FLAGS" />
              <Info text="3 = ×3   •   4 = ×8   •   5 = ×20" />
            </Card>

            <Card>
              <CardTitle text="MID FLAGS" />
              <Info text="3 = ×4   •   4 = ×12   •   5 = ×30" />
            </Card>

            <Card>
              <CardTitle text="PREMIUM FLAGS" />
              <Info text="3 = ×5   •   4 = ×15   •   5 = ×40" />
            </Card>

            <Card>
              <CardTitle text="⭐ WILD" />
              <Info text="Substitutes for flags on winning paylines." />
            </Card>

            <Card>
              <CardTitle text="🌐 FREE SPINS" />
              <Info text="3 = 8   •   4 = 12   •   5+ = 20" />
            </Card>

            <Card>
              <CardTitle text="💎 JACKPOT" />
              <Info text="3 or more diamonds anywhere win the full progressive jackpot." />
            </Card>

            <Card>
              <CardTitle text="5 PAYLINES" />
              <Info text="Top • Middle • Bottom • V • Inverted V" />
            </Card>
          </>
        )}

        {modal === "missions" && (
          <>
            <ModalTitle text="🎯 MISSIONS" />

            <Card>
              <CardTitle text="SPIN 20 TIMES" />

              <Info
                text={`${missionSpins}/20 • Reward 500`}
              />

              <ClaimButton
                disabled={
                  missionSpins < 20 ||
                  spinMissionClaimed
                }
                text={
                  spinMissionClaimed
                    ? "CLAIMED"
                    : "CLAIM 500"
                }
                onPress={
                  claimSpinMission
                }
              />
            </Card>

            <Card>
              <CardTitle text="WIN 5 TIMES" />

              <Info
                text={`${missionWins}/5 • Reward 750`}
              />

              <ClaimButton
                disabled={
                  missionWins < 5 ||
                  winMissionClaimed
                }
                text={
                  winMissionClaimed
                    ? "CLAIMED"
                    : "CLAIM 750"
                }
                onPress={
                  claimWinMission
                }
              />
            </Card>
          </>
        )}

        {modal === "daily" && (
          <>
            <ModalTitle text="🎁 DAILY BONUS" />

            <Card>
              <CardTitle
                text={`STREAK ${dailyStreak}/7`}
              />

              <Info
                text={`Reward today: ${
                  (250 +
                    level * 50 +
                    dailyStreak * 50) *
                  (vip ? 2 : 1)
                } credits`}
              />

              {vip && (
                <Info text="👑 VIP ×2 DAILY BONUS" />
              )}

              <ClaimButton
                text="CLAIM DAILY BONUS"
                onPress={
                  claimDaily
                }
              />
            </Card>
          </>
        )}

        {modal === "profile" && (
          <>
            <ModalTitle text="👤 PROFILE" />

            <Card>
              <Info
                text={`Level: ${level}`}
              />

              <Info
                text={`XP: ${xp}/100`}
              />

              <Info
                text={`Total spins: ${stats.totalSpins}`}
              />

              <Info
                text={`Total wins: ${stats.totalWins}`}
              />

              <Info
                text={`Biggest win: ${stats.biggestWin}`}
              />

              <Info
                text={`Jackpots won: ${stats.jackpotsWon}`}
              />

              <Info
                text={`Flags: ${collectedFlags.length}/193`}
              />

              <Info
                text={`VIP: ${
                  vip
                    ? "ACTIVE"
                    : "NO"
                }`}
              />

              <Info
                text={`Sound: ${
                  soundEnabled
                    ? "ON"
                    : "OFF"
                }`}
              />
            </Card>
          </>
        )}

        {modal === "collection" && (
          <>
            <ModalTitle
              text={`🌍 FLAG COLLECTION ${collectedFlags.length}/193`}
            />

            <View
              style={
                styles.flagGrid
              }
            >
              {flags.map(
                (
                  flag,
                  index
                ) => {
                  const unlocked =
                    collectedFlags.includes(
                      flag
                    );

                  return (
                    <View
                      key={index}
                      style={
                        styles.flagCell
                      }
                    >
                      <Text
                        style={
                          styles.flagIcon
                        }
                      >
                        {unlocked
                          ? flag
                          : "🔒"}
                      </Text>
                    </View>
                  );
                }
              )}
            </View>
          </>
        )}

        {modal === "rank" && (
          <>
            <ModalTitle text="🏆 LOCAL RANK" />

            <Card>
              <Info
                text={`Highest level: ${highestLevel}`}
              />

              <Info
                text={`Biggest win: ${stats.biggestWin}`}
              />

              <Info
                text={`Biggest jackpot: ${stats.biggestJackpot}`}
              />

              <Info
                text={`Flags collected: ${collectedFlags.length}/193`}
              />

              <Info
                text={`Total wins: ${stats.totalWins}`}
              />

              <Info
                text={`Total spins: ${stats.totalSpins}`}
              />
            </Card>

            <Info text="Local statistics only — online leaderboard comes later." />
          </>
        )}

        {modal === "achievements" && (
          <>
            <ModalTitle text="🏅 ACHIEVEMENTS" />

            {achievements.map(
              (item) => (
                <Card
                  key={
                    item.title
                  }
                >
                  <CardTitle
                    text={
                      item.unlocked
                        ? `🏆 ${item.title}`
                        : `🔒 ${item.title}`
                    }
                  />
                </Card>
              )
            )}
          </>
        )}

        {modal === "shop" && (
          <>
            <ModalTitle text="🛒 TEST SHOP" />

            <Text
              style={
                styles.warning
              }
            >
              NO REAL MONEY — TEST CREDITS ONLY
            </Text>

            <ShopButton
              text="+5,000 TEST CREDITS"
              onPress={() =>
                buyTestCredits(
                  5000
                )
              }
            />

            <ShopButton
              text="+15,000 TEST CREDITS"
              onPress={() =>
                buyTestCredits(
                  15000
                )
              }
            />

            <ShopButton
              text="+50,000 TEST CREDITS"
              onPress={() =>
                buyTestCredits(
                  50000
                )
              }
            />

            <Card>
              <CardTitle text="👑 VIP TEST" />

              <Info text="+10,000 credits on activation" />
              <Info text="+50% XP" />
              <Info text="×2 Daily Bonus" />

              <ClaimButton
                disabled={vip}
                text={
                  vip
                    ? "VIP ACTIVE"
                    : "ACTIVATE TEST VIP"
                }
                onPress={
                  activateVip
                }
              />
            </Card>
          </>
        )}
      </GameModal>

      <Modal
        visible={!!bigWinText}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setBigWinText(null)
        }
      >
        <TouchableOpacity
          activeOpacity={1}
          style={
            styles.bigWinOverlay
          }
          onPress={() =>
            setBigWinText(null)
          }
        >
          <View
            style={
              styles.bigWinBox
            }
          >
            <Text
              style={
                styles.bigWinStars
              }
            >
              ✨ ⭐ ✨
            </Text>

            <Text
              style={
                styles.bigWinText
              }
            >
              {bigWinText}
            </Text>

            <Text
              style={
                styles.bigWinStars
              }
            >
              ✨ ⭐ ✨
            </Text>
          </View>

          <Text
            style={styles.tapText}
          >
            TAP TO CONTINUE
          </Text>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({
  title,
  value,
}) {
  return (
    <View style={styles.stat}>
      <Text
        style={
          styles.statTitle
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.statValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

function SmallButton({
  text,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={
        styles.smallButton
      }
      onPress={onPress}
    >
      <Text
        style={
          styles.buttonText
        }
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
}

function MenuButton({
  text,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={
        styles.menuButton
      }
      onPress={onPress}
    >
      <Text
        style={styles.menuText}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
}

function GameModal({
  visible,
  onClose,
  children,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={
        onClose
      }
    >
      <View
        style={
          styles.modalBackground
        }
      >
        <View
          style={
            styles.modalBox
          }
        >
          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
          >
            {children}

            <TouchableOpacity
              style={
                styles.closeButton
              }
              onPress={onClose}
            >
              <Text
                style={
                  styles.closeText
                }
              >
                CLOSE
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ModalTitle({
  text,
}) {
  return (
    <Text
      style={
        styles.modalTitle
      }
    >
      {text}
    </Text>
  );
}

function Card({
  children,
}) {
  return (
    <View style={styles.card}>
      {children}
    </View>
  );
}

function CardTitle({
  text,
}) {
  return (
    <Text
      style={
        styles.cardTitle
      }
    >
      {text}
    </Text>
  );
}

function Info({ text }) {
  return (
    <Text
      style={styles.info}
    >
      {text}
    </Text>
  );
}

function ClaimButton({
  text,
  onPress,
  disabled,
}) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.claimButton,
        disabled &&
          styles.disabled,
      ]}
    >
      <Text
        style={
          styles.claimText
        }
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
}

function ShopButton({
  text,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={
        styles.shopButton
      }
      onPress={onPress}
    >
      <Text
        style={
          styles.shopText
        }
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#07111f",
    },

    page: {
      alignItems: "center",
      padding: 10,
      paddingBottom: 40,
    },

    title: {
      color: "white",
      fontSize: 22,
      fontWeight: "bold",
      textAlign: "center",
    },

    subtitle: {
      color: "#8fa8c5",
      fontSize: 11,
      marginBottom: 8,
    },

    topInfo: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 7,
    },

    level: {
      color: "#ffd54a",
      fontWeight: "bold",
    },

    xp: {
      color: "#7fd6e4",
      fontWeight: "bold",
    },

    vip: {
      color: "#ffd54a",
      fontWeight: "bold",
    },

    soundButton: {
      backgroundColor:
        "#1d6645",
      paddingVertical: 7,
      paddingHorizontal: 18,
      borderRadius: 20,
      marginBottom: 8,
    },

    soundOff: {
      backgroundColor:
        "#5a2630",
    },

    soundText: {
      color: "white",
      fontSize: 11,
      fontWeight: "bold",
    },

    jackpotBox: {
      backgroundColor:
        "#241b07",
      borderColor:
        "#e7b51c",
      borderWidth: 2,
      borderRadius: 12,
      paddingVertical: 7,
      paddingHorizontal: 40,
      alignItems: "center",
      marginBottom: 10,
    },

    jackpotTitle: {
      color: "#ffd54a",
      fontWeight: "bold",
    },

    jackpotValue: {
      color: "white",
      fontSize: 22,
      fontWeight: "bold",
    },

    statsRow: {
      width: "100%",
      maxWidth: 420,
      flexDirection: "row",
      justifyContent:
        "space-between",
      marginBottom: 8,
    },

    stat: {
      width: "31%",
      backgroundColor:
        "#14243a",
      padding: 8,
      borderRadius: 8,
      alignItems: "center",
    },

    statTitle: {
      color: "#8fa8c5",
      fontSize: 10,
    },

    statValue: {
      color: "white",
      fontSize: 18,
      fontWeight: "bold",
    },

    slot: {
      width: "100%",
      maxWidth: 420,
      height: 235,
      flexDirection: "row",
      backgroundColor:
        "#14243a",
      padding: 5,
      borderRadius: 12,
      overflow: "hidden",
    },

    column: {
      width: "20%",
    },

    cell: {
      height: 75,
      backgroundColor:
        "white",
      borderColor:
        "#14243a",
      borderWidth: 2,
      borderRadius: 7,
      alignItems: "center",
      justifyContent:
        "center",
    },

    winningCell: {
      backgroundColor:
        "#fff3b0",
      borderColor:
        "#ffd000",
      borderWidth: 4,
      zIndex: 20,
      elevation: 10,
    },

    symbol: {
      fontSize: 34,
    },

    winningSymbol: {
      fontSize: 39,
    },

    label: {
      fontSize: 7,
      fontWeight: "bold",
    },

    message: {
      color: "#ffd54a",
      fontSize: 16,
      fontWeight: "bold",
      marginTop: 8,
      minHeight: 23,
      textAlign: "center",
    },

    free: {
      color: "#7fd6e4",
      marginBottom: 8,
    },

    betRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 10,
    },

    smallButton: {
      backgroundColor:
        "#253e5e",
      paddingVertical: 9,
      paddingHorizontal: 20,
      borderRadius: 10,
    },

    actionRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 14,
    },

    autoButton: {
      backgroundColor:
        "#253e5e",
      minWidth: 125,
      paddingVertical: 15,
      borderRadius: 30,
      alignItems: "center",
    },

    autoActive: {
      backgroundColor:
        "#8b2635",
    },

    spinButton: {
      backgroundColor:
        "#e7b51c",
      width: 150,
      paddingVertical: 15,
      borderRadius: 30,
      alignItems: "center",
    },

    spinText: {
      color: "#07111f",
      fontSize: 20,
      fontWeight: "bold",
    },

    buttonText: {
      color: "white",
      fontWeight: "bold",
    },

    disabled: {
      opacity: 0.45,
    },

    menuGrid: {
      width: "100%",
      maxWidth: 420,
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent:
        "space-between",
    },

    menuButton: {
      width: "48.5%",
      backgroundColor:
        "#14243a",
      borderRadius: 10,
      paddingVertical: 12,
      marginBottom: 8,
      alignItems: "center",
    },

    menuText: {
      color: "white",
      fontSize: 12,
      fontWeight: "bold",
    },

    testNotice: {
      color: "#70849c",
      fontSize: 10,
      marginTop: 8,
    },

    modalBackground: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.88)",
      justifyContent:
        "center",
      padding: 18,
    },

    modalBox: {
      maxHeight: "88%",
      backgroundColor:
        "#101f33",
      borderColor:
        "#e7b51c",
      borderWidth: 2,
      borderRadius: 18,
      padding: 18,
    },

    modalTitle: {
      color: "#ffd54a",
      fontSize: 23,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 15,
    },

    card: {
      backgroundColor:
        "#192d48",
      padding: 12,
      borderRadius: 10,
      marginBottom: 9,
    },

    cardTitle: {
      color: "white",
      fontWeight: "bold",
      marginBottom: 5,
    },

    info: {
      color: "#c7d5e5",
      marginVertical: 2,
    },

    claimButton: {
      backgroundColor:
        "#e7b51c",
      padding: 10,
      borderRadius: 20,
      alignItems: "center",
      marginTop: 10,
    },

    claimText: {
      color: "#07111f",
      fontWeight: "bold",
    },

    shopButton: {
      backgroundColor:
        "#253e5e",
      padding: 13,
      borderRadius: 10,
      marginBottom: 8,
      alignItems: "center",
    },

    shopText: {
      color: "white",
      fontWeight: "bold",
    },

    warning: {
      color: "#ffd54a",
      textAlign: "center",
      fontWeight: "bold",
      marginBottom: 15,
    },

    flagGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },

    flagCell: {
      width: "20%",
      height: 52,
      alignItems: "center",
      justifyContent:
        "center",
      backgroundColor:
        "#192d48",
      borderWidth: 1,
      borderColor:
        "#101f33",
    },

    flagIcon: {
      fontSize: 25,
    },

    closeButton: {
      backgroundColor:
        "#e7b51c",
      paddingVertical: 13,
      borderRadius: 25,
      alignItems: "center",
      marginTop: 15,
    },

    closeText: {
      color: "#07111f",
      fontWeight: "bold",
    },

    bigWinOverlay: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.94)",
      alignItems: "center",
      justifyContent:
        "center",
    },

    bigWinBox: {
      borderWidth: 3,
      borderColor:
        "#ffd54a",
      borderRadius: 25,
      paddingVertical: 30,
      paddingHorizontal: 28,
      backgroundColor:
        "#241b07",
      alignItems: "center",
    },

    bigWinStars: {
      fontSize: 28,
      marginVertical: 8,
    },

    bigWinText: {
      color: "#ffd54a",
      fontSize: 38,
      fontWeight: "bold",
      textAlign: "center",
    },

    tapText: {
      color: "white",
      marginTop: 30,
      fontSize: 12,
    },
  });
