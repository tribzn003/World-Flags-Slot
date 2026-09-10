import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Animated,
} from "react-native";

import {
  createReels,
  checkWins,
  GLOBE,
  WILD,
  JACKPOT,
} from "./gameData";

import {
  loadGameData,
  saveGameData,
} from "./storage";

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

  const [win, setWin] =
    useState(0);

  const [message, setMessage] =
    useState("GOOD LUCK!");

  const [spinning, setSpinning] =
    useState(false);

  const [autoSpin, setAutoSpin] =
    useState(false);

  const [loaded, setLoaded] =
    useState(false);

  const reelAnim = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    async function load() {
      const data =
        await loadGameData();

      if (data) {
        setBalance(
          data.balance ?? 1000
        );

        setBet(
          data.bet ?? 10
        );

        setFreeSpins(
          data.freeSpins ?? 0
        );

        setJackpot(
          data.jackpot ?? 5000
        );
      }

      setLoaded(true);
    }

    load();
  }, []);

  useEffect(() => {
    if (!loaded) return;

    saveGameData({
      balance,
      bet,
      freeSpins,
      jackpot,
    });
  }, [
    loaded,
    balance,
    bet,
    freeSpins,
    jackpot,
  ]);

  const animateReels = (done) => {
    reelAnim.setValue(0);

    Animated.sequence([
      Animated.timing(
        reelAnim,
        {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        reelAnim,
        {
          toValue: -1,
          duration: 180,
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        reelAnim,
        {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        reelAnim,
        {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }
      ),
    ]).start(done);
  };

  const spin = () => {
    if (
      spinning ||
      !loaded
    ) {
      return;
    }

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

    setMessage(
      usingFreeSpin
        ? "FREE SPIN..."
        : "SPINNING..."
    );

    let nextBalance =
      balance;

    let nextJackpot =
      jackpot;

    if (usingFreeSpin) {
      setFreeSpins(
        (value) =>
          Math.max(
            0,
            value - 1
          )
      );
    } else {
      nextBalance -= bet;

      nextJackpot +=
        Math.max(
          1,
          Math.floor(
            bet * 0.05
          )
        );
    }

    animateReels(() => {
      const nextReels =
        createReels();

      const result =
        checkWins(
          nextReels,
          bet
        );

      const globes =
        nextReels.filter(
          (symbol) =>
            symbol === GLOBE
        ).length;

      const diamonds =
        nextReels.filter(
          (symbol) =>
            symbol === JACKPOT
        ).length;

      let freeAward = 0;
      let jackpotWin = 0;

      if (globes === 3) {
        freeAward = 8;
      } else if (
        globes === 4
      ) {
        freeAward = 12;
      } else if (
        globes >= 5
      ) {
        freeAward = 20;
      }

      if (freeAward > 0) {
        setFreeSpins(
          (value) =>
            value +
            freeAward
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

      nextBalance +=
        totalWin;

      setReels(nextReels);

      setBalance(
        nextBalance
      );

      setJackpot(
        nextJackpot
      );

      setWin(
        totalWin
      );

      if (jackpotWin > 0) {
        setMessage(
          `💎 JACKPOT ${jackpotWin}`
        );

        Vibration.vibrate(
          300
        );
      } else if (
        totalWin > 0
      ) {
        setMessage(
          `🏆 WIN ${totalWin}`
        );

        Vibration.vibrate(
          150
        );
      } else if (
        freeAward > 0
      ) {
        setMessage(
          `🌐 ${freeAward} FREE SPINS`
        );
      } else if (
        usingFreeSpin
      ) {
        setMessage(
          "FREE SPIN"
        );
      } else {
        setMessage(
          "GOOD LUCK!"
        );
      }

      setSpinning(false);
    });
  };

  useEffect(() => {
    if (
      !autoSpin ||
      spinning ||
      !loaded
    ) {
      return;
    }

    const timer =
      setTimeout(
        spin,
        1000
      );

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
  ]);

  const reelMove =
    reelAnim.interpolate({
      inputRange:
        [-1, 0, 1],

      outputRange:
        [-18, 0, 18],
    });

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <Text
        style={
          styles.title
        }
      >
        🌍 WORLD FLAGS SLOT 🌍
      </Text>

      <Text
        style={
          styles.subtitle
        }
      >
        193 UN MEMBER STATES
      </Text>

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
          styles.stats
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

      <Animated.View
        style={[
          styles.slot,
          {
            transform: [
              {
                translateY:
                  reelMove,
              },
            ],
          },
        ]}
      >
        {reels.map(
          (
            symbol,
            index
          ) => (
            <View
              key={index}
              style={
                styles.cell
              }
            >
              <Text
                style={
                  styles.symbol
                }
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
            </View>
          )
        )}
      </Animated.View>

      <Text
        style={
          styles.message
        }
      >
        {loaded
          ? message
          : "LOADING..."}
      </Text>

      <Text
        style={
          styles.free
        }
      >
        FREE SPINS:{" "}
        {freeSpins}
      </Text>

      <View
        style={
          styles.betRow
        }
      >
        <TouchableOpacity
          style={
            styles.smallButton
          }
          onPress={() =>
            setBet(
              (value) =>
                Math.max(
                  5,
                  value - 5
                )
            )
          }
        >
          <Text
            style={
              styles.buttonText
            }
          >
            BET -
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.smallButton
          }
          onPress={() =>
            setBet(
              (value) =>
                Math.min(
                  100,
                  value + 5
                )
            )
          }
        >
          <Text
            style={
              styles.buttonText
            }
          >
            BET +
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.smallButton
          }
          onPress={() =>
            setBet(100)
          }
        >
          <Text
            style={
              styles.buttonText
            }
          >
            MAX
          </Text>
        </TouchableOpacity>
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
              (value) =>
                !value
            )
          }
        >
          <Text
            style={
              styles.autoText
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
          onPress={spin}
          disabled={spinning}
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
    </SafeAreaView>
  );
}

function Stat({
  title,
  value,
}) {
  return (
    <View
      style={
        styles.stat
      }
    >
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

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#07111f",
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 10,
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
      marginBottom: 12,
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
      alignItems:
        "center",
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

    stats: {
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
      alignItems:
        "center",
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
      flexDirection: "row",
      flexWrap: "wrap",
      backgroundColor:
        "#14243a",
      padding: 5,
      borderRadius: 12,
    },

    cell: {
      width: "20%",
      height: 75,
      backgroundColor:
        "white",
      borderColor:
        "#14243a",
      borderWidth: 2,
      borderRadius: 7,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    symbol: {
      fontSize: 34,
    },

    label: {
      fontSize: 7,
      fontWeight: "bold",
    },

    message: {
      color: "#ffd54a",
      fontSize: 17,
      fontWeight: "bold",
      marginTop: 10,
      minHeight: 25,
    },

    free: {
      color: "#7fd6e4",
      marginBottom: 10,
    },

    betRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 14,
    },

    smallButton: {
      backgroundColor:
        "#253e5e",
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 10,
    },

    buttonText: {
      color: "white",
      fontWeight: "bold",
    },

    actionRow: {
      flexDirection: "row",
      gap: 10,
    },

    autoButton: {
      backgroundColor:
        "#253e5e",
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 30,
      justifyContent:
        "center",
    },

    autoActive: {
      backgroundColor:
        "#9b2f2f",
    },

    autoText: {
      color: "white",
      fontWeight: "bold",
    },

    spinButton: {
      backgroundColor:
        "#e7b51c",
      width: 150,
      paddingVertical: 15,
      borderRadius: 30,
      alignItems:
        "center",
    },

    disabled: {
      opacity: 0.6,
    },

    spinText: {
      color: "#07111f",
      fontSize: 20,
      fontWeight: "bold",
    },
  });
