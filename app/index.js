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
} from "react-native";

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

const PAYOUTS = {
  3: 3,
  4: 8,
  5: 20,
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

  // Beta - povećana šansa za dobitak radi testiranja
  if (Math.random() < 0.25) {
    const line =
      PAYLINES[
        Math.floor(Math.random() * PAYLINES.length)
      ];

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
    return {
      win: 0,
      indexes: [],
    };
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
    return {
      win: bet * PAYOUTS[count],
      indexes: line.slice(0, count),
    };
  }

  return {
    win: 0,
    indexes: [],
  };
}

function checkWins(reels, bet) {
  let totalWin = 0;
  const winningIndexes = [];

  PAYLINES.forEach((line) => {
    const result =
      evaluateLine(reels, line, bet);

    totalWin += result.win;

    result.indexes.forEach((index) => {
      if (!winningIndexes.includes(index)) {
        winningIndexes.push(index);
      }
    });
  });

  return {
    totalWin,
    winningIndexes,
  };
}

export default function HomeScreen() {
  const [reels, setReels] =
    useState(createReels());

  const [balance, setBalance] =
    useState(1000);

  const [bet, setBet] =
    useState(10);

  const [freeSpins, setFreeSpins] =
    useState(0);

  const [jackpot, setJackpot] =
    useState(5000);

  const [message, setMessage] =
    useState("WORLD FLAGS SLOT");

  const [spinning, setSpinning] =
    useState(false);

  const [winningIndexes, setWinningIndexes] =
    useState([]);

  const [autoSpin, setAutoSpin] =
    useState(false);

  const [displayWin, setDisplayWin] =
    useState(0);

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

  const closeBigWin = () => {
    setBigWinVisible(false);
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

    Animated.parallel(animations)
      .start(callback);
  };

  const spin = () => {
    if (spinning || bigWinVisible) return;

    if (
      freeSpins <= 0 &&
      balance < bet
    ) {
      setMessage("NOT ENOUGH CREDITS");
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

      const jackpotContribution =
        Math.max(
          1,
          Math.floor(bet * 0.05)
        );

      currentJackpot +=
        jackpotContribution;
    }

    runReelAnimations(() => {
      const newReels =
        createReels();

      setReels(newReels);

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

      const jackpotSymbols =
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

      if (jackpotSymbols >= 3) {
        jackpotWin =
          currentJackpot;

        currentJackpot = 5000;
      }

      if (awardedFreeSpins > 0) {
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

      if (jackpotWin > 0) {
        Vibration.vibrate([
          0,
          200,
          100,
          300,
          100,
          500
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
        result.totalWin >= bet * 20
      ) {
        Vibration.vibrate([
          0,
          150,
          80,
          150,
          80,
          250
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
        result.totalWin >= bet * 10
      ) {
        Vibration.vibrate([
          0,
          150,
          100,
          200
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
        result.totalWin > 0 &&
        awardedFreeSpins > 0
      ) {
        Vibration.vibrate(180);

        runWinAnimation();

        setMessage(
          `WIN ${result.totalWin} + ${awardedFreeSpins} FREE SPINS!`
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

    const timer =
      setTimeout(() => {
        spin();
      }, 800);

    return () =>
      clearTimeout(timer);
  }, [
    autoSpin,
    spinning,
    balance,
    freeSpins,
    bet,
    bigWinVisible,
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
                    scale:
                      bigWinAnim,
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
              onPress={closeBigWin}
            >
              <Text style={styles.collectText}>
                COLLECT
              </Text>
            </TouchableOpacity>

          </Animated.View>

        </View>
      </Modal>

      <Text style={styles.title}>
        🌍 WORLD FLAGS SLOT 🌍
      </Text>

      <Text style={styles.subtitle}>
        193 UN MEMBER STATES
      </Text>

      <View style={styles.jackpotBox}>

        <Text style={styles.jackpotLabel}>
          💎 JACKPOT
        </Text>

        <Text style={styles.jackpotValue}>
          {jackpot}
        </Text>

      </View>

      {freeSpins > 0 && (
        <View style={styles.freeSpinBanner}>
          <Text style={styles.freeSpinBannerText}>
            🌐 FREE SPINS MODE 🌐
          </Text>
        </View>
      )}

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

        {Array.from({
          length: 5,
        }).map(
          (_, columnIndex) => {

            const anim =
              reelAnimations[
                columnIndex
              ];

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
                          <Text style={styles.jackpotSymbolLabel}>
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
        {message}
      </Animated.Text>

      <Text style={styles.freeCounterText}>
        FREE SPINS: {freeSpins}
      </Text>

      <View style={styles.paytable}>

        <Text style={styles.payText}>
          3 = ×3
        </Text>

        <Text style={styles.payText}>
          4 = ×8
        </Text>

        <Text style={styles.payText}>
          5 = ×20
        </Text>

        <Text style={styles.payText}>
          ⭐ WILD
        </Text>

      </View>

      <Text style={styles.scatterText}>
        🌐 3 = 8 FREE • 4 = 12 FREE • 5+ = 20 FREE
      </Text>

      <Text style={styles.scatterText}>
        💎 3+ = JACKPOT
      </Text>

      <Text style={styles.linesText}>
        5 PAYLINES
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
            spinning &&
              styles.spinButtonDisabled,
          ]}
          onPress={spin}
          disabled={spinning}
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
    padding: 14,
  },

  freeSpinBackground: {
    backgroundColor: "#08263a",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },

  subtitle: {
    color: "#8fa8c5",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },

  jackpotBox: {
    backgroundColor: "#241b07",
    borderWidth: 2,
    borderColor: "#e7b51c",
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 28,
    alignItems: "center",
    marginBottom: 10,
  },

  jackpotLabel: {
    color: "#ffd54a",
    fontSize: 11,
    fontWeight: "bold",
  },

  jackpotValue: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
  },

  freeSpinBanner: {
    backgroundColor: "#
