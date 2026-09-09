import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Animated, Vibration, Modal, ScrollView
} from "react-native";

import {
  createReels, checkWins, GLOBE, WILD, JACKPOT,
  PREMIUM_CODES, MID_CODES, flagEmoji
} from "./gameData";

import { loadGameData, saveGameData } from "./storage";

const DAY = 86400000;

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
  const [spinMissionClaimed, setSpinMissionClaimed] = useState(false);
  const [winMissionClaimed, setWinMissionClaimed] = useState(false);
  const [vip, setVip] = useState(false);

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

  const dailyBonusReady = Date.now() - lastDailyBonus >= DAY;

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
        setLastDailyBonus(data.lastDailyBonus ?? 0);
        setDailyStreak(data.dailyStreak ?? 0);
        setMissionSpins(data.missionSpins ?? 0);
        setMissionWins(data.missionWins ?? 0);
        setSpinMissionClaimed(data.spinMissionClaimed ?? false);
        setWinMissionClaimed(data.winMissionClaimed ?? false);
        setVip(data.vip ?? false);
      }

      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;

    saveGameData({
      balance, bet, freeSpins, jackpot, level, xp,
      lastDailyBonus, dailyStreak,
      missionSpins, missionWins,
      spinMissionClaimed, winMissionClaimed, vip
    });
  }, [
    loaded, balance, bet, freeSpins, jackpot, level, xp,
    lastDailyBonus, dailyStreak,
    missionSpins, missionWins,
    spinMissionClaimed, winMissionClaimed, vip
  ]);

  const pulse = () => {
    winAnim.setValue(1);

    Animated.sequence([
      Animated.timing(winAnim, { toValue: 1.18, duration: 150, useNativeDriver: true }),
      Animated.timing(winAnim, { toValue: 1, duration: 150, useNativeDriver: true })
    ]).start();
  };

  const showBigWin = (title, amount) => {
    setBigWinTitle(title);
    setBigWinAmount(amount);
    setModal("bigwin");
    bigWinAnim.setValue(0);

    Animated.spring(bigWinAnim, {
      toValue: 1,
      useNativeDriver: true
    }).start();
  };

  const addXp = (amount) => {
    setXp(old => {
      let next = old + amount;

      if (next >= 100) {
        setLevel(l => l + 1);
        next -= 100;
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
      lastDailyBonus && now - lastDailyBonus < DAY * 2
        ? Math.min(dailyStreak + 1, 7)
        : 1;

    let bonus = 250 + level * 50 + streak * 50;
    if (vip) bonus *= 2;

    setBalance(v => v + bonus);
    setDailyStreak(streak);
    setLastDailyBonus(now);
    setMessage(`DAILY BONUS +${bonus}`);
    Vibration.vibrate(150);
  };

  const claimMission = (type) => {
    if (type === "spin" && missionSpins >= 20 && !spinMissionClaimed) {
      setBalance(v => v + 500);
      setSpinMissionClaimed(true);
      setMessage("MISSION +500");
    }

    if (type === "win" && missionWins >= 5 && !winMissionClaimed) {
      setBalance(v => v + 750);
      setWinMissionClaimed(true);
      setMessage("MISSION +750");
    }
  };

  const buyCredits = amount => {
    setBalance(v => v + amount);
    setMessage(`SHOP +${amount}`);
  };

  const activateVip = () => {
    if (vip) return;

    setVip(true);
    setBalance(v => v + 10000);
    setMessage("👑 VIP ACTIVATED");
  };

  const animateReels = callback => {
    reelAnimations.forEach(a => a.setValue(0));

    Animated.parallel(
      reelAnimations.map((anim, i) =>
        Animated.sequence([
          Animated.delay(i * 130),
          Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }),
          Animated.timing(anim, { toValue: -1, duration: 220, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true })
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

    const usingFreeSpin = freeSpins > 0;

    let newBalance = balance;
    let newJackpot = jackpot;

    if (usingFreeSpin) {
      setFreeSpins(v => Math.max(0, v - 1));
    } else {
      newBalance -= bet;
      newJackpot += Math.max(1, Math.floor(bet * 0.05));

      addXp(vip ? 15 : 10);
      setMissionSpins(v => Math.min(20, v + 1));
    }

    animateReels(() => {
      const nextReels = createReels();
      const result = checkWins(nextReels, bet);

      const globes = nextReels.filter(x => x === GLOBE).length;
      const diamonds = nextReels.filter(x => x === JACKPOT).length;

      let awardedFreeSpins = 0;
      let jackpotWin = 0;

      if (globes === 3) awardedFreeSpins = 8;
      if (globes === 4) awardedFreeSpins = 12;
      if (globes >= 5) awardedFreeSpins = 20;

      if (diamonds >= 3) {
        jackpotWin = newJackpot;
        newJackpot = 5000;
      }

      if (awardedFreeSpins) {
        setFreeSpins(v => v + awardedFreeSpins);
      }

      const totalWin = result.totalWin + jackpotWin;

      newBalance += totalWin;

      setBalance(newBalance);
      setJackpot(newJackpot);
      setReels(nextReels);
      setWinningIndexes(result.winningIndexes);
      setDisplayWin(totalWin);

      if (totalWin > 0) {
        setMissionWins(v => Math.min(5, v + 1));
        pulse();
        Vibration.vibrate(150);
      }

      if (jackpotWin) {
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
      } else if (awardedFreeSpins) {
        setMessage(`${awardedFreeSpins} FREE SPINS`);
      } else {
        setMessage(usingFreeSpin ? "FREE SPIN" : "GOOD LUCK!");
      }

      setSpinning(false);
    });
  };

  useEffect(() => {
    if (!autoSpin || spinning || modal || !loaded) return;

    const timer = setTimeout(spin, 1200);
    return () => clearTimeout(timer);
  }, [autoSpin, spinning, modal, balance, freeSpins, bet, loaded]);

  return (
    <SafeAreaView style={styles.container}>

      <GameModal visible={modal === "bigwin"} onClose={() => setModal(null)}>
        <Animated.View style={{ transform: [{ scale: bigWinAnim }], alignItems: "center" }}>
          <Text style={styles.bigEmoji}>{bigWinTitle === "JACKPOT" ? "💎" : "🏆"}</Text>
          <Text style={styles.bigTitle}>{bigWinTitle}</Text>
          <Text style={styles.bigAmount}>{bigWinAmount}</Text>
        </Animated.View>
      </GameModal>

      <GameModal visible={modal === "shop"} onClose={() => setModal(null)} title="🛒 SHOP">
        {[5000, 15000, 50000].map(amount => (
          <Card key={amount}>
            <Text style={styles.cardTitle}>🪙 {amount.toLocaleString()} CREDITS</Text>
            <GoldButton text="TEST BUY" onPress={() => buyCredits(amount)} />
          </Card>
        ))}

        <Card>
          <Text style={styles.bigEmoji}>👑</Text>
          <Text style={styles.cardTitle}>VIP</Text>
          <Text style={styles.text}>+10,000 credits • +50% XP • ×2 Daily Bonus</Text>
          <GoldButton
            text={vip ? "VIP ACTIVE" : "ACTIVATE VIP"}
            onPress={activateVip}
          />
        </Card>

        <Text style={styles.note}>TEST SHOP — NO REAL MONEY</Text>
      </GameModal>

      <GameModal visible={modal === "missions"} onClose={() => setModal(null)} title="🎯 MISSIONS">
        <Mission
          title="SPIN 20 TIMES"
          value={`${missionSpins}/20`}
          reward="500"
          claimed={spinMissionClaimed}
          disabled={missionSpins < 20}
          onPress={() => claimMission("spin")}
        />

        <Mission
          title="WIN 5 TIMES"
          value={`${missionWins}/5`}
          reward="750"
          claimed={winMissionClaimed}
          disabled={missionWins < 5}
          onPress={() => claimMission("win")}
        />
      </GameModal>

      <GameModal visible={modal === "info"} onClose={() => setModal(null)} title="🌍 PAYTABLE">
        <Text style={styles.ruleTitle}>PREMIUM FLAGS</Text>
        <Text style={styles.flags}>{PREMIUM_CODES.map(flagEmoji).join(" ")}</Text>
        <Text style={styles.text}>3 = ×5 • 4 = ×15 • 5 = ×40</Text>

        <Text style={styles.ruleTitle}>MID VALUE FLAGS</Text>
        <Text style={styles.flags}>{MID_CODES.map(flagEmoji).join(" ")}</Text>
        <Text style={styles.text}>3 = ×4 • 4 = ×12 • 5 = ×30</Text>

        <Text style={styles.ruleTitle}>ALL OTHER FLAGS</Text>
        <Text style={styles.text}>3 = ×3 • 4 = ×8 • 5 = ×20</Text>

        <Text style={styles.bigEmoji}>⭐ 🌐 💎</Text>
        <Text style={styles.text}>WILD • FREE SPINS • JACKPOT</Text>
      </GameModal>

      <Text style={styles.title}>🌍 WORLD FLAGS SLOT 🌍</Text>
      <Text style={styles.subtitle}>193 UN MEMBER STATES</Text>

      {vip && <Text style={styles.vip}>👑 VIP PLAYER</Text>}

      <View style={styles.playerRow}>
        <Stat label="LEVEL" value={level} />
        <Stat label="XP" value={`${xp}/100`} />
        <Stat label="STREAK" value={`🔥 ${dailyStreak}`} />
      </View>

      <View style={styles.buttonRow}>
        <SmallButton text="🎁 DAILY" onPress={claimDailyBonus} />
        <SmallButton text="🎯 MISSIONS" onPress={() => setModal("missions")} />
        <SmallButton text="🛒 SHOP" onPress={() => setModal("shop")} />
        <SmallButton text="INFO" onPress={() => setModal("info")} />
      </View>

      <View style={styles.jackpot}>
        <Text style={styles.gold}>💎 JACKPOT</Text>
        <Text style={styles.jackpotValue}>{jackpot}</Text>
      </View>

      <View style={styles.playerRow}>
        <Stat label="BALANCE" value={balance} />
        <Stat label="BET" value={bet} />
        <Stat label="WIN" value={displayWin} />
      </View>

      <View style={styles.slot}>
        {Array.from({ length: 5 }).map((_, col) => {
          const anim = reelAnimations[col];

          return (
            <Animated.View
              key={col}
              style={[
                styles.reel,
                {
                  transform: [{
                    translateY: anim.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [-25, 0, 25]
                    })
                  }]
                }
              ]}
            >
              {[0, 1, 2].map(row => {
                const index = row * 5 + col;
                const symbol = reels[index];

                return (
                  <View
                    key={index}
                    style={[
                      styles.cell,
                      winningIndexes.includes(index) && styles.winCell
                    ]}
                  >
                    <Text style={styles.symbol}>{symbol}</Text>
                    {[WILD, GLOBE, JACKPOT].includes(symbol) && (
                      <Text style={styles.symbolLabel}>
                        {symbol === WILD ? "WILD" : symbol === GLOBE ? "SCATTER" : "JACKPOT"}
                      </Text>
                    )}
                  </View>
                );
              })}
            </Animated.View>
          );
        })}
      </View>

      <Animated.Text style={[styles.message, { transform: [{ scale: winAnim }] }]}>
        {loaded ? message : "LOADING..."}
      </Animated.Text>

      <Text style={styles.free}>FREE SPINS: {freeSpins}</Text>

      <View style={styles.buttonRow}>
        <SmallButton text="BET -" onPress={() => setBet(v => Math.max(5, v - 5))} />
        <SmallButton text="BET +" onPress={() => setBet(v => Math.min(100, v + 5))} />
        <SmallButton text="MAX" onPress={() => setBet(100)} />
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.autoButton, autoSpin && styles.autoActive]}
          onPress={() => setAutoSpin(v => !v)}
        >
          <Text style={styles.buttonText}>
            {autoSpin ? "STOP AUTO" : "AUTO SPIN"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.spinButton}
          onPress={spin}
          disabled={spinning}
        >
          <Text style={styles.spinText}>
            {spinning ? "SPINNING" : "SPIN"}
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function SmallButton({ text, onPress }) {
  return (
    <TouchableOpacity style={styles.smallButton} onPress={onPress}>
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  );
}

function GoldButton({ text, onPress }) {
  return (
    <TouchableOpacity style={styles.goldButton} onPress={onPress}>
      <Text style={styles.darkText}>{text}</Text>
    </TouchableOpacity>
  );
}

function Card({ children }) {
  return <View style={styles.card}>{children}</View>;
}

function Mission({ title, value, reward, claimed, disabled, onPress }) {
  return (
    <Card>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.progress}>{value}</Text>
      <Text style={styles.text}>REWARD: {reward} CREDITS</Text>
      <GoldButton
        text={claimed ? "CLAIMED" : disabled ? "LOCKED" : "CLAIM"}
        onPress={onPress}
      />
    </Card>
  );
}

function GameModal({ visible, onClose, title, children }) {
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modal}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          {title && <Text style={styles.modalTitle}>{title}</Text>}
          {children}
          <GoldButton text="BACK" onPress={onClose} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111f",
    alignItems: "center",
    justifyContent: "center",
    padding: 9
  },

  title: {
    color: "white",
    fontSize: 21,
    fontWeight: "bold"
  },

  subtitle: {
    color: "#8fa8c5",
    fontSize: 10,
    marginBottom: 4
  },

  vip: {
    color: "#ffd54a",
    fontWeight: "bold"
  },

  playerRow: {
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6
  },

  stat: {
    width: "31%",
    backgroundColor: "#14243a",
    borderRadius: 8,
    padding: 7,
    alignItems: "center"
  },

  label: {
    color: "#8fa8c5",
    fontSize: 9
  },

  statValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold"
  },

  buttonRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 6
  },

  smallButton: {
    backgroundColor: "#253e5e",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 9
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 10
  },

  jackpot: {
    backgroundColor: "#241b07",
    borderWidth: 2,
    borderColor: "#e7b51c",
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 30,
    alignItems: "center",
    marginBottom: 6
  },

  gold: {
    color: "#ffd54a",
    fontWeight: "bold"
  },

  jackpotValue: {
    color: "white",
    fontSize: 19,
    fontWeight: "bold"
  },

  slot: {
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    backgroundColor: "#14243a",
    borderRadius: 14,
    padding: 6
  },

  reel: {
    width: "20%"
  },

  cell: {
    height: 74,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#14243a",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },

  winCell: {
    backgroundColor: "#ffe585",
    borderColor: "#ffbd00"
  },

  symbol: {
    fontSize: 35
  },

  symbolLabel: {
    fontSize: 7,
    fontWeight: "bold"
  },

  message: {
    color: "#ffd54a",
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 7
  },

  free: {
    color: "#7fd6e4",
    fontSize: 10,
    marginBottom: 6
  },

  actionRow: {
    flexDirection: "row",
    gap: 10
  },

  autoButton: {
    backgroundColor: "#253e5e",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 30
  },

  autoActive: {
    backgroundColor: "#9b2f2f"
  },

  spinButton: {
    width: 150,
    backgroundColor: "#e7b51c",
    paddingVertical: 14,
    borderRadius: 35,
    alignItems: "center"
  },

  spinText: {
    color: "#07111f",
    fontSize: 21,
    fontWeight: "bold"
  },

  modal: {
    flex: 1,
    backgroundColor: "#07111f"
  },

  modalContent: {
    alignItems: "center",
    padding: 20,
    paddingBottom: 50
  },

  modalTitle: {
    color: "#ffd54a",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20
  },

  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#14243a",
    borderRadius: 15,
    padding: 16,
    marginBottom: 14,
    alignItems: "center"
  },

  cardTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold"
  },

  progress: {
    color: "#ffd54a",
    fontSize: 26,
    fontWeight: "bold",
    marginVertical: 8
  },

  text: {
    color: "white",
    textAlign: "center",
    marginVertical: 4
  },

  note: {
    color: "#8fa8c5",
    marginTop: 10
  },

  goldButton: {
    backgroundColor: "#e7b51c",
    paddingVertical: 11,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 12
  },

  darkText: {
    color: "#07111f",
    fontWeight: "bold"
  },

  bigEmoji: {
    fontSize: 50
  },

  bigTitle: {
    color: "#ffd54a",
    fontSize: 34,
    fontWeight: "bold"
  },

  bigAmount: {
    color: "white",
    fontSize: 40,
    fontWeight: "bold"
  },

  flags: {
    fontSize: 27,
    lineHeight: 38,
    textAlign: "center"
  },

  ruleTitle: {
    color: "#ffd54a",
    fontWeight: "bold",
    fontSize: 17,
    marginTop: 15
  }
});
