import React, { useRef, useState, useEffect } from "react";
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

import AsyncStorage from "@react-native-async-storage/async-storage";

const SAVE_KEY = "world_flags_slot_save_v1";

const countryCodes = [
  "AF","AL","DZ","AD","AO","AG","AR","AM","AU","AT",
  "AZ","BS","BH","BD","BB","BY","BE","BZ","BJ","BT",
  "BO","BA","BW","BR","BN","BG","BF","BI","CV","KH",
  "CM","CA","CF","TD","CL","CN","CO","KM","CG","CD",
  "CR","CI","HR","CU","CY","CZ","DK","DJ","DM","DO",
  "EC","EG","SV","GQ","ER","EE","SZ","ET","FJ","FI",
  "FR","GA","GM","GE","DE","GH","GR","GD","GT","GN",
  "GW","GY","HT","HN","HU","IS","IN","ID","IR","IQ",
  "IE","IL","IT","JM","JP","JO","KZ","KE","KI","KP",
  "KR","KW","KG","LA","LV","LB","LS","LR","LY","LI",
  "LT","LU","MG","MW","MY","MV","ML","MT","MH","MR",
  "MU","MX","FM","MD","MC","MN","ME","MA","MZ","MM",
  "NA","NR","NP","NL","NZ","NI","NE","NG","MK","NO",
  "OM","PK","PW","PA","PG","PY","PE","PH","PL","PT",
  "QA","RO","RU","RW","KN","LC","VC","WS","SM","ST",
  "SA","SN","RS","SC","SL","SG","SK","SI","SB","SO",
  "ZA","SS","ES","LK","SD","SR","SE","CH","SY","TJ",
  "TZ","TH","TL","TG","TO","TT","TN","TR","TM","TV",
  "UG","UA","AE","GB","US","UY","UZ","VU","VE","VN",
  "YE","ZM","ZW"
];

function flagEmoji(code) {
  return code
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt())
    );
}

const flags = countryCodes.map(flagEmoji);

const GLOBE = "🌐";
const WILD = "⭐";
const JACKPOT = "💎";

const PREMIUM_CODES = [
  "US","GB","FR","DE","IT","JP","CN","BR","IN","CA"
];

const MID_CODES = [
  "RS","ES","PT","NL","BE","CH","AT","SE","NO","DK",
  "FI","GR","TR","AU","NZ","MX","AR","KR","SA","AE"
];

const PAYOUTS = {
  normal: { 3: 3, 4: 8, 5: 20 },
  mid: { 3: 4, 4: 12, 5: 30 },
  premium: { 3: 5, 4: 15, 5: 40 },
};

const PAYLINES = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [0, 6, 12, 8, 4],
  [10, 6, 2, 8, 14],
];

function randomFlag() {
  return flags[Math.floor(Math.random() * flags.length)];
}

function getCodeFromFlag(flag) {
  const index = flags.indexOf(flag);
  if (index === -1) return null;
  return countryCodes[index];
}

function getFlagTier(flag) {
  const code = getCodeFromFlag(flag);

  if (!code) return "normal";
  if (PREMIUM_CODES.includes(code)) return "premium";
  if (MID_CODES.includes(code)) return "mid";

  return "normal";
}

function randomSymbol() {
  const roll = Math.random();

  if (roll < 0.02) return JACKPOT;
  if (roll < 0.06) return GLOBE;
  if (roll < 0.10) return WILD;

  return randomFlag();
}

function createReels() {
  const reels = Array.from(
    { length: 15 },
    () => randomSymbol()
  );

  if (Math.random() < 0.25) {
    const line =
      PAYLINES[Math.floor(Math.random() * PAYLINES.length)];

    const flag = randomFlag();
    const roll = Math.random();

    let count = 3;

    if (roll > 0.85) {
      count = 5;
    } else if (roll > 0.60) {
      count = 4;
    }

    for (let i = 0; i < count; i++) {
      reels[line[i]] = flag;
    }

    if (Math.random() < 0.30) {
      const wildPosition =
        1 + Math.floor(Math.random() * (count - 1));

      reels[line[wildPosition]] = WILD;
    }
  }

  return reels;
}

function evaluateLine(reels, line, bet) {
  const lineSymbols = line.map(
    (index) => reels[index]
  );

  let baseSymbol = null;

  for (const symbol of lineSymbols) {
    if (
      symbol !== WILD &&
      symbol !== GLOBE &&
      symbol !== JACKPOT
    ) {
      baseSymbol = symbol;
      break;
    }
  }

  if (!baseSymbol) {
    return { win: 0, indexes: [] };
  }

  let count = 0;

  for (let i = 0; i < lineSymbols.length; i++) {
    const symbol = lineSymbols[i];

    if (
      symbol === baseSymbol ||
      symbol === WILD
    ) {
      count++;
    } else {
      break;
    }
  }

  if (count >= 3) {
    const tier = getFlagTier(baseSymbol);

    return {
      win: bet * PAYOUTS[tier][count],
      indexes: line.slice(0, count),
    };
  }

  return { win: 0, indexes: [] };
}

function checkWins(reels, bet) {
  let totalWin = 0;
  const winningIndexes = [];

  PAYLINES.forEach((line) => {
    const result = evaluateLine(reels, line, bet);

    totalWin += result.win;

    result.indexes.forEach((index) => {
      if (!winningIndexes.includes(index)) {
        winningIndexes.push(index);
      }
    });
  });

  return { totalWin, winningIndexes };
}

export default function HomeScreen() {
  const [reels, setReels] = useState(createReels());

  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);
  const [freeSpins, setFreeSpins] = useState(0);
  const [jackpot, setJackpot] = useState(5000);

  const [message, setMessage] =
    useState("WORLD FLAGS SLOT");

  const [spinning, setSpinning] = useState(false);
  const [winningIndexes, setWinningIndexes] = useState([]);
  const [autoSpin, setAutoSpin] = useState(false);
  const [displayWin, setDisplayWin] = useState(0);

  const [bigWinVisible, setBigWinVisible] = useState(false);
  const [bigWinTitle, setBigWinTitle] = useState("");
  const [bigWinAmount, setBigWinAmount] = useState(0);

  const [paytableVisible, setPaytableVisible] = useState(false);

  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);

  const [lastDailyBonus, setLastDailyBonus] = useState(0);

  const [loaded, setLoaded] = useState(false);

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

  const dailyBonusReady =
    Date.now() - lastDailyBonus >= 24 * 60 * 60 * 1000;

  const loadGame = async () => {
    try {
      const raw = await AsyncStorage.getItem(SAVE_KEY);

      if (!raw) {
        setLoaded(true);
        return;
      }

      const data = JSON.parse(raw);

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
    } catch (error) {
      console.log("LOAD ERROR:", error);
    }

    setLoaded(true);
  };

  const saveGame = async () => {
    if (!loaded) return;

    try {
      const data = {
        balance,
        bet,
        freeSpins,
        jackpot,
        level,
        xp,
        lastDailyBonus,
      };

      await AsyncStorage.setItem(
        SAVE_KEY,
        JSON.stringify(data)
      );
    } catch (error) {
      console.log("SAVE ERROR:", error);
    }
  };

  useEffect(() => {
    loadGame();
  }, []);

  useEffect(() => {
    saveGame();
  }, [
    balance,
    bet,
    freeSpins,
    jackpot,
    level,
    xp,
    lastDailyBonus,
    loaded,
  ]);

  const addXp = (amount) => {
    setXp((oldXp) => {
      let newXp = oldXp + amount;
      let gainedLevels = 0;

      while (newXp >= 100) {
        newXp -= 100;
        gainedLevels++;
      }

      if (gainedLevels > 0) {
        setLevel((oldLevel) => {
          const newLevel =
            oldLevel + gainedLevels;

          setMessage(
            `LEVEL UP! LEVEL ${newLevel}`
          );

          return newLevel;
        });

        Vibration.vibrate([
          0,
          150,
          100,
          250,
        ]);
      }

      return newXp;
    });
  };

  const claimDailyBonus = () => {
    if (!dailyBonusReady) {
      setMessage(
        "DAILY BONUS AVAILABLE LATER"
      );

      return;
    }

    const bonus =
      250 + level * 50;

    setBalance(
      (value) => value + bonus
    );

    setLastDailyBonus(Date.now());

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

  const showBigWin = (title, amount) => {
    setBigWinTitle(title);
    setBigWinAmount(amount);
    setBigWinVisible(true);

    bigWinAnim.setValue(0);

    Animated.spring(bigWinAnim, {
      toValue: 1,
      friction: 5,
      tension: 70,
      useNativeDriver: true,
    }).start();
  };

  const animateWinCounter = (target) => {
    if (winTimerRef.current) {
      clearInterval(winTimerRef.current);
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
            (target * currentStep) / steps
          );

        setDisplayWin(value);

        if (currentStep >= steps) {
          clearInterval(
            winTimerRef.current
          );

          winTimerRef.current = null;

          setDisplayWin(target);
        }
      }, 35);
  };

  useEffect(() => {
    return () => {
      if (winTimerRef.current) {
        clearInterval(
          winTimerRef.current
        );
      }
    };
  }, []);

  const runReelAnimations = (callback) => {
    reelAnimations.forEach((anim) => {
      anim.setValue(0);
    });

    const animations =
      reelAnimations.map(
        (anim, index) =>
          Animated.sequence([
            Animated.delay(index * 170),

            Animated.timing(anim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),

            Animated.timing(anim, {
              toValue: -1,
              duration: 200,
              useNativeDriver: true,
            }),

            Animated.timing(anim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),

            Animated.timing(anim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
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
    setMessage("SPINNING...");

    let currentBalance = balance;
    let currentJackpot = jackpot;

    const usingFreeSpin =
      freeSpins > 0;

    if (usingFreeSpin) {
      setFreeSpins((value) =>
        Math.max(0, value - 1)
      );
    } else {
      currentBalance -= bet;

      const contribution =
        Math.max(
          1,
          Math.floor(bet * 0.05)
        );

      currentJackpot += contribution;

      addXp(10);
    }

    runReelAnimations(() => {
      const newReels = createReels();

      setReels(newReels);

      const result =
        checkWins(newReels, bet);

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

      let awardedFreeSpins = 0;
      let jackpotWin = 0;

      if (globes === 3) {
        awardedFreeSpins = 8;
      } else if (globes === 4) {
        awardedFreeSpins = 12;
      } else if (globes >= 5) {
        awardedFreeSpins = 20;
      }

      if (diamonds >= 3) {
        jackpotWin =
          currentJackpot;

        currentJackpot = 5000;
      }

      if (awardedFreeSpins > 0) {
        setFreeSpins(
          (value) =>
            value + awardedFreeSpins
        );
      }

      const totalPaid =
        result.totalWin +
        jackpotWin;

      currentBalance += totalPaid;

      setBalance(currentBalance);
      setJackpot(currentJackpot);

      setWinningIndexes(
        result.winningIndexes
      );

      animateWinCounter(totalPaid);

      if (jackpotWin > 0) {
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
          `💎 JACKPOT ${jackpotWin}!`
        );

        setAutoSpin(false);

        showBigWin(
          "JACKPOT",
          jackpotWin
        );
      } else if (
        result.totalWin >=
        bet * 20
      ) {
        Vibration.vibrate([
          0,
          150,
          80,
          150,
          80,
          250,
        ]);

        runWinAnimation();

        setMessage(
          `MEGA WIN ${result.totalWin}!`
        );

        setAutoSpin(false);

        showBigWin(
          "MEGA WIN",
          result.totalWin
        );
      } else if (
        result.totalWin >=
        bet * 10
      ) {
        Vibration.vibrate([
          0,
          150,
          100,
          200,
        ]);

        runWinAnimation();

        setMessage(
          `BIG WIN ${result.totalWin}!`
        );

        setAutoSpin(false);

        showBigWin(
          "BIG WIN",
          result.totalWin
        );
      } else if (
        result.totalWin > 0
      ) {
        Vibration.vibrate(180);

        runWinAnimation();

        setMessage(
          `WIN ${result.totalWin}!`
        );
      } else if (
        awardedFreeSpins > 0
      ) {
        Vibration.vibrate(180);

        runWinAnimation();

        setMessage(
          `${awardedFreeSpins} FREE SPINS!`
        );
      } else if (
        usingFreeSpin
      ) {
        setMessage("FREE SPIN");
      } else {
        setMessage("GOOD LUCK!");
      }

      setSpinning(false);
    });
  };

  useEffect(() => {
    if (!autoSpin) return;
    if (spinning) return;
    if (bigWinVisible) return;
    if (paytableVisible) return;
    if (!loaded) return;

    const timer =
      setTimeout(spin, 800);

    return () =>
      clearTimeout(timer);
  }, [
    autoSpin,
    spinning,
    balance,
    freeSpins,
    bet,
    bigWinVisible,
    paytableVisible,
    loaded,
  ]);

  const decreaseBet = () => {
    if (spinning) return;

    setBet((value) =>
      Math.max(5, value - 5)
    );
  };

  const increaseBet = () => {
    if (spinning) return;

    setBet((value) =>
      Math.min(100, value + 5)
    );
  };

  const maxBet = () => {
    if (spinning) return;
    setBet(100);
  };

  const toggleAutoSpin = () => {
    if (
      spinning &&
      !autoSpin
    ) {
      return;
    }

    setAutoSpin(
      (value) => !value
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        freeSpins > 0 &&
          styles.freeSpinBackground,
      ]}
    >

      <Modal
        visible={bigWinVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalBackground}>
          <Animated.View
            style={[
              styles.bigWinCard,
              {
                transform: [
                  {
                    scale: bigWinAnim,
                  },
                ],
              },
            ]}
          >

            <Text style={styles.bigWinEmoji}>
              {bigWinTitle === "JACKPOT"
                ? "💎"
                : "🏆"}
            </Text>

            <Text style={styles.bigWinTitle}>
              {bigWinTitle}
            </Text>

            <Text style={styles.bigWinAmount}>
              {bigWinAmount}
            </Text>

            <TouchableOpacity
              style={styles.collectButton}
              onPress={() =>
                setBigWinVisible(false)
              }
            >
              <Text style={styles.collectText}>
                COLLECT
              </Text>
            </TouchableOpacity>

          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={paytableVisible}
        animationType="slide"
      >
        <SafeAreaView
          style={styles.paytableScreen}
        >
          <ScrollView
            contentContainerStyle={
              styles.paytableContent
            }
          >

            <Text style={styles.paytableTitle}>
              🌍 PAYTABLE
            </Text>

            <Text style={styles.ruleTitle}>
              PREMIUM FLAGS
            </Text>

            <Text style={styles.flagList}>
              {PREMIUM_CODES
                .map(flagEmoji)
                .join(" ")}
            </Text>

            <Text style={styles.ruleText}>
              3 = ×5 • 4 = ×15 • 5 = ×40
            </Text>

            <Text style={styles.ruleTitle}>
              MID VALUE FLAGS
            </Text>

            <Text style={styles.flagList}>
              {MID_CODES
                .map(flagEmoji)
                .join(" ")}
            </Text>

            <Text style={styles.ruleText}>
              3 = ×4 • 4 = ×12 • 5 = ×30
            </Text>

            <Text style={styles.ruleTitle}>
              ALL OTHER FLAGS
            </Text>

            <Text style={styles.ruleText}>
              3 = ×3 • 4 = ×8 • 5 = ×20
            </Text>

            <View style={styles.ruleBox}>
              <Text style={styles.specialSymbol}>
                ⭐
              </Text>

              <Text style={styles.ruleTitle}>
                WILD
              </Text>

              <Text style={styles.ruleText}>
                Replaces any country flag.
              </Text>
            </View>

            <View style={styles.ruleBox}>
              <Text style={styles.specialSymbol}>
                🌐
              </Text>

              <Text style={styles.ruleTitle}>
                SCATTER
              </Text>

              <Text style={styles.ruleText}>
                3 = 8 FREE SPINS
              </Text>

              <Text style={styles.ruleText}>
                4 = 12 FREE SPINS
              </Text>

              <Text style={styles.ruleText}>
                5+ = 20 FREE SPINS
              </Text>
            </View>

            <View style={styles.ruleBox}>
              <Text style={styles.specialSymbol}>
                💎
              </Text>

              <Text style={styles.ruleTitle}>
                JACKPOT
              </Text>

              <Text style={styles.ruleText}>
                3 or more anywhere = JACKPOT
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closePaytableButton}
              onPress={() =>
                setPaytableVisible(false)
              }
            >
              <Text style={styles.collectText}>
                BACK TO GAME
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Text style={styles.title}>
        🌍 WORLD FLAGS SLOT 🌍
      </Text>

      <Text style={styles.subtitle}>
        193 UN MEMBER STATES
      </Text>

      <View style={styles.playerBar}>

        <View>
          <Text style={styles.playerLabel}>
            LEVEL
          </Text>

          <Text style={styles.playerValue}>
            {level}
          </Text>
        </View>

        <View style={styles.xpArea}>
          <Text style={styles.playerLabel}>
            XP {xp}/100
          </Text>

          <View style={styles.xpTrack}>
            <View
              style={[
                styles.xpFill,
                {
                  width: `${xp}%`,
                },
              ]}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.dailyButton,
            !dailyBonusReady &&
              styles.dailyButtonDisabled,
          ]}
          onPress={claimDailyBonus}
        >
          <Text style={styles.dailyButtonText}>
            🎁 DAILY
          </Text>
        </TouchableOpacity>

      </View>

      <View style={styles.jackpotBox}>
        <Text style={styles.jackpotLabel}>
          💎 JACKPOT
        </Text>

        <Text style={styles.jackpotValue}>
          {jackpot}
        </Text>
      </View>

      <View style={styles.info}>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>
            BALANCE
          </Text>

          <Text style={styles.infoValue}>
            {balance}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>
            BET
          </Text>

          <Text style={styles.infoValue}>
            {bet}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>
            WIN
          </Text>

          <Text
            style={[
              styles.infoValue,
              displayWin > 0 &&
                styles.winValue,
            ]}
          >
            {displayWin}
          </Text>
        </View>

      </View>

      <View style={styles.slot}>

        {Array.from({ length: 5 }).map(
          (_, columnIndex) => {

            const anim =
              reelAnimations[columnIndex];

            const animatedStyle = {
              transform: [
                {
                  translateY:
                    anim.interpolate({
                      inputRange:
                        [-1, 0, 1],

                      outputRange:
                        [-30, 0, 30],
                    }),
                },
              ],

              opacity:
                anim.interpolate({
                  inputRange:
                    [-1, 0, 1],

                  outputRange:
                    [0.35, 1, 0.35],
                }),
            };

            return (
              <Animated.View
                key={columnIndex}
                style={[
                  styles.reelColumn,
                  animatedStyle,
                ]}
              >

                {[0, 1, 2].map(
                  (rowIndex) => {

                    const index =
                      rowIndex * 5 +
                      columnIndex;

                    const symbol =
                      reels[index];

                    const isWinner =
                      winningIndexes.includes(
                        index
                      );

                    return (
                      <View
                        key={index}
                        style={[
                          styles.cell,
                          isWinner &&
                            styles.winningCell,
                        ]}
                      >

                        <Text style={styles.symbol}>
                          {symbol}
                        </Text>

                        {symbol === WILD && (
                          <Text style={styles.wildLabel}>
                            WILD
                          </Text>
                        )}

                        {symbol === GLOBE && (
                          <Text style={styles.scatterLabel}>
                            SCATTER
                          </Text>
                        )}

                        {symbol === JACKPOT && (
                          <Text
                            style={
                              styles.jackpotSymbolLabel
                            }
                          >
                            JACKPOT
                          </Text>
                        )}

                      </View>
                    );
                  }
                )}

              </Animated.View>
            );
          }
        )}

      </View>

      <Animated.Text
        style={[
          styles.message,
          {
            transform: [
              {
                scale: winAnim,
              },
            ],
          },
        ]}
      >
        {loaded
          ? message
          : "LOADING..."}
      </Animated.Text>

      <Text style={styles.freeCounterText}>
        FREE SPINS: {freeSpins}
      </Text>

      <View style={styles.betRow}>

        <TouchableOpacity
          style={styles.smallButton}
          onPress={decreaseBet}
        >
          <Text style={styles.buttonText}>
            BET -
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.smallButton}
          onPress={increaseBet}
        >
          <Text style={styles.buttonText}>
            BET +
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.smallButton}
          onPress={maxBet}
        >
          <Text style={styles.buttonText}>
            MAX
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.smallButton}
          onPress={() =>
            setPaytableVisible(true)
          }
        >
          <Text style={styles.buttonText}>
            INFO
          </Text>
        </TouchableOpacity>

      </View>

      <View style={styles.actionRow}>

        <TouchableOpacity
          style={[
            styles.autoButton,
            autoSpin &&
              styles.autoButtonActive,
          ]}
          onPress={toggleAutoSpin}
        >
          <Text style={styles.buttonText}>
            {autoSpin
              ? "STOP AUTO"
              : "AUTO SPIN"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.spinButton,
            (spinning || !loaded) &&
              styles.spinButtonDisabled,
          ]}
          onPress={spin}
          disabled={
            spinning ||
            !loaded
          }
        >
          <Text style={styles.spinText}>
            {spinning
              ? "SPINNING"
              : "SPIN"}
          </Text>
        </TouchableOpacity>

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#07111f",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },

  freeSpinBackground: {
    backgroundColor: "#08263a",
  },

  title: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },

  subtitle: {
    color: "#8fa8c5",
    fontSize: 11,
    marginTop: 3,
    marginBottom: 7,
  },

  playerBar: {
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#14243a",
    padding: 8,
    borderRadius: 12,
    marginBottom: 8,
  },

  playerLabel: {
    color: "#8fa8c5",
    fontSize: 9,
    fontWeight: "bold",
  },

  playerValue: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "bold",
  },

  xpArea: {
    width: "45%",
  },

  xpTrack: {
    height: 8,
    backgroundColor: "#26394f",
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 4,
  },

  xpFill: {
    height: "100%",
    backgroundColor: "#ffd54a",
  },

  dailyButton: {
    backgroundColor: "#e7b51c",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
  },

  dailyButtonDisabled: {
    opacity: 0.4,
  },

  dailyButtonText: {
    color: "#07111f",
    fontSize: 11,
    fontWeight: "bold",
  },

  jackpotBox: {
    backgroundColor: "#241b07",
    borderWidth: 2,
    borderColor: "#e7b51c",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 28,
    alignItems: "center",
    marginBottom: 8,
  },

  jackpotLabel: {
    color: "#ffd54a",
    fontSize: 10,
    fontWeight: "bold",
  },

  jackpotValue: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },

  info: {
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  infoBox: {
    width: "31%",
    backgroundColor: "#14243a",
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: "center",
  },

  infoLabel: {
    color: "#8fa8c5",
    fontSize: 9,
  },

  infoValue: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },

  winValue: {
    color: "#ffd54a",
  },

  slot: {
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    backgroundColor: "#14243a",
    borderRadius: 16,
    padding: 7,
  },

  reelColumn: {
    width: "20%",
  },

  cell: {
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#14243a",
    borderRadius: 9,
    backgroundColor: "#ffffff",
  },

  winningCell: {
    backgroundColor: "#ffe585",
    borderColor: "#ffbd00",
    borderWidth: 3,
  },

  symbol: {
    fontSize: 37,
  },

  wildLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#7b5600",
  },

  scatterLabel: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#174b80",
  },

  jackpotSymbolLabel: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#7b5600",
  },

  message: {
    minHeight: 27,
    color: "#ffd54a",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 9,
    marginBottom: 3,
    textAlign: "center",
  },

  freeCounterText: {
    color: "#7fd6e4",
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 8,
  },

  betRow: {
    flexDirection: "row",
    gap: 5,
  },

  smallButton: {
    backgroundColor: "#253e5e",
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 10,
  },

  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 12,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  autoButton: {
    backgroundColor: "#253e5e",
    paddingVertical: 15,
    paddingHorizontal: 17,
    borderRadius: 30,
    justifyContent: "center",
  },

  autoButtonActive: {
    backgroundColor: "#9b2f2f",
  },

  spinButton: {
    backgroundColor: "#e7b51c",
    width: 155,
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 40,
  },

  spinButtonDisabled: {
    opacity: 0.55,
  },

  spinText: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#07111f",
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    alignItems: "center",
    justifyContent: "center",
  },

  bigWinCard: {
    width: "84%",
    maxWidth: 380,
    backgroundColor: "#15253b",
    borderWidth: 3,
    borderColor: "#ffd54a",
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
  },

  bigWinEmoji: {
    fontSize: 70,
  },

  bigWinTitle: {
    color: "#ffd54a",
    fontSize: 38,
    fontWeight: "bold",
    marginTop: 8,
  },

  bigWinAmount: {
    color: "#ffffff",
    fontSize: 44,
    fontWeight: "bold",
    marginVertical: 18,
  },

  collectButton: {
    backgroundColor: "#e7b51c",
    paddingVertical: 14,
    paddingHorizontal: 45,
    borderRadius: 30,
  },

  collectText: {
    color: "#07111f",
    fontSize: 17,
    fontWeight: "bold",
  },

  paytableScreen: {
    flex: 1,
    backgroundColor: "#07111f",
  },

  paytableContent: {
    padding: 20,
    alignItems: "center",
    paddingBottom: 50,
  },

  paytableTitle: {
    color: "#ffd54a",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 25,
  },

  ruleBox: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#14243a",
    borderRadius: 15,
    padding: 16,
    alignItems: "center",
    marginTop: 18,
  },

  ruleTitle: {
    color: "#ffd54a",
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },

  ruleText: {
    color: "#ffffff",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 5,
  },

  flagList: {
    fontSize: 30,
    lineHeight: 42,
    textAlign: "center",
    marginBottom: 8,
  },

  specialSymbol: {
    fontSize: 55,
  },

  closePaytableButton: {
    backgroundColor: "#e7b51c",
    marginTop: 30,
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 30,
  },

});
