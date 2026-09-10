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

      const result = checkWins(
        nextReels,
        bet
      );

      if (result.totalWin > 0) {
        const wonFlags =
          result.winningIndexes
            .map((index) => nextReels[index])
            .filter((symbol) =>
              flags.includes(symbol)
            );

        if (wonFlags.length > 0) {
          setCollectedFlags((old) => [
            ...new Set([
              ...old,
              ...wonFlags,
            ]),
          ]);
        }
      }

      const globes =
        nextReels.filter(
          (symbol) => symbol === GLOBE
        ).length;

      const diamonds =
        nextReels.filter(
          (symbol) => symbol === JACKPOT
        ).length;

      let awardedFreeSpins = 0;
      let jackpotWin = 0;

      if (globes === 3) {
        awardedFreeSpins = 8;
      }

      if (globes === 4) {
        awardedFreeSpins = 12;
      }

      if (globes >= 5) {
        awardedFreeSpins = 20;
      }

      if (diamonds >= 3) {
        jackpotWin = newJackpot;
        newJackpot = 5000;

        setJackpotsWon(
          (value) => value + 1
        );

        setBiggestJackpot((value) =>
          Math.max(
            value,
            jackpotWin
          )
        );
      }

      if (awardedFreeSpins > 0) {
        setFreeSpins(
          (value) =>
            value +
            awardedFreeSpins
        );
      }

      const totalWin =
        result.totalWin +
        jackpotWin;

      newBalance += totalWin;

      setBalance(newBalance);
      setJackpot(newJackpot);
      setReels(nextReels);
      setWinningIndexes(
        result.winningIndexes
      );
      setDisplayWin(totalWin);

      if (totalWin > 0) {
        setTotalWins(
          (value) => value + 1
        );

        setBiggestWin((value) =>
          Math.max(
            value,
            totalWin
          )
        );

        setMissionWins((value) =>
          Math.min(
            5,
            value + 1
          )
        );

        pulse();
        Vibration.vibrate(150);
      }

      if (jackpotWin > 0) {
        setAutoSpin(false);

        setMessage(
          `💎 JACKPOT ${jackpotWin}`
        );

        showBigWin(
          "JACKPOT",
          jackpotWin
        );
      } else if (
        result.totalWin >=
        bet * 20
      ) {
        setAutoSpin(false);

        setMessage(
          `MEGA WIN ${result.totalWin}`
        );

        showBigWin(
          "MEGA WIN",
          result.totalWin
        );
      } else if (
        result.totalWin >=
        bet * 10
      ) {
        setMessage(
          `BIG WIN ${result.totalWin}`
        );
      } else if (
        result.totalWin > 0
      ) {
        setMessage(
          `WIN ${result.totalWin}`
        );
      } else if (
        awardedFreeSpins > 0
      ) {
        setMessage(
          `${awardedFreeSpins} FREE SPINS`
        );
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

    const timer = setTimeout(
      spin,
      1200
    );

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
    {
      icon: "🌍",
      title: "WORLD TRAVELER",
      text: "Collect 50 flags",
      unlocked:
        collectedFlags.length >= 50,
    },
    {
      icon: "🌎",
      title: "MASTER COLLECTOR",
      text: "Collect all 193 flags",
      unlocked:
        collectedFlags.length >= 193,
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
            transform: [
              {
                scale: bigWinAnim,
              },
            ],
          }}
        >
          <Text style={styles.bigEmoji}>
            {bigWinTitle === "JACKPOT"
              ? "💎"
              : "🏆"}
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
        visible={modal === "leaderboard"}
        onClose={() => setModal(null)}
        title="🏆 LEADERBOARD"
      >
        <LeaderboardRow
          rank="1"
          icon="💰"
          title="BIGGEST WIN"
          value={biggestWin}
        />

        <LeaderboardRow
          rank="2"
          icon="💎"
          title="BIGGEST JACKPOT"
          value={biggestJackpot}
        />

        <LeaderboardRow
          rank="3"
          icon="⭐"
          title="HIGHEST LEVEL"
          value={highestLevel}
        />

        <LeaderboardRow
          rank="4"
          icon="🌍"
          title="FLAGS COLLECTED"
          value={`${collectedFlags.length}/193`}
        />

        <LeaderboardRow
          rank="5"
          icon="🏆"
          title="TOTAL WINS"
          value={totalWins}
        />

        <LeaderboardRow
          rank="6"
          icon="🎰"
          title="TOTAL SPINS"
          value={totalSpins}
        />
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

        <Card>
          <Text style={styles.bigEmoji}>
            🌍
          </Text>

          <Text style={styles.cardTitle}>
            FLAG COLLECTION
          </Text>

          <Text style={styles.profileValue}>
            {collectedFlags.length} / 193
          </Text>

          <GoldButton
            text="OPEN COLLECTION"
            onPress={() =>
              setModal("collection")
            }
          />
        </Card>

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
              {item.unlocked
                ? item.icon
                : "🔒"}
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
              {item.unlocked
                ? "✓"
                : ""}
            </Text>
          </View>
        ))}
      </GameModal>

      <GameModal
        visible={modal === "collection"}
        onClose={() => setModal("profile")}
        title="🌍 FLAG COLLECTION"
      >
        <Text style={styles.profileValue}>
          {collectedFlags.length} / 193
        </Text>

        <Text style={styles.text}>
          Win with a country's flag to unlock it.
        </Text>

        <View style={styles.collectionGrid}>
          {flags.map((flag) => {
            const unlocked =
              collectedFlags.includes(flag);

            return (
              <View
                key={flag}
                style={[
                  styles.collectionCell,
                  !unlocked &&
                    styles.collectionLocked,
                ]}
              >
                <Text style={styles.collectionFlag}>
                  {unlocked
                    ? flag
                    : "🔒"}
                </Text>
              </View>
            );
          })}
        </View>
      </GameModal>

      <GameModal
        visible={modal === "shop"}
        onClose={() => setModal(null)}
        title="🛒 SHOP"
      >
        {[5000, 15000, 50000].map(
          (amount) => (
            <Card key={amount}>
              <Text style={styles.cardTitle}>
                🪙 {amount.toLocaleString()} CREDITS
              </Text>

              <GoldButton
                text="TEST BUY"
                onPress={() =>
                  buyCredits(amount)
                }
              />
            </Card>
          )
        )}

        <Card>
          <Text style={styles.bigEmoji}>
            👑
          </Text>

          <Text style={styles.cardTitle}>
            VIP
          </Text>

          <Text style={styles.text}>
            +10,000 credits
          </Text>

          <Text style={styles.text}>
            +50% XP
          </Text>

          <Text style={styles.text}>
            ×2 Daily Bonus
          </Text>

          <GoldButton
            text={
              vip
                ? "VIP ACTIVE"
                : "ACTIVATE VIP"
            }
            onPress={activateVip}
          />
        </Card>

        <Text style={styles.note}>
          TEST SHOP — NO REAL MONEY
        </Text>
      </GameModal>

      <GameModal
        visible={modal === "missions"}
        onClose={() => setModal(null)}
        title="🎯 MISSIONS"
      >
        <Mission
          title="SPIN 20 TIMES"
          value={`${missionSpins}/20`}
          reward="500"
          claimed={spinMissionClaimed}
          disabled={missionSpins < 20}
          onPress={() =>
            claimMission("spin")
          }
        />

        <Mission
          title="WIN 5 TIMES"
          value={`${missionWins}/5`}
          reward="750"
          claimed={winMissionClaimed}
          disabled={missionWins < 5}
          onPress={() =>
            claimMission("win")
          }
        />
      </GameModal>

      <GameModal
        visible={modal === "info"}
        onClose={() => setModal(null)}
        title="🌍 PAYTABLE"
      >
        <Text style={styles.ruleTitle}>
          PREMIUM FLAGS
        </Text>

        <Text style={styles.flags}>
          {PREMIUM_CODES
            .map(flagEmoji)
            .join(" ")}
        </Text>

        <Text style={styles.text}>
          3 = ×5 • 4 = ×15 • 5 = ×40
        </Text>

        <Text style={styles.ruleTitle}>
          MID VALUE FLAGS
        </Text>

        <Text style={styles.flags}>
          {MID_CODES
            .map(flagEmoji)
            .join(" ")}
        </Text>

        <Text style={styles.text}>
          3 = ×4 • 4 = ×12 • 5 = ×30
        </Text>

        <Text style={styles.ruleTitle}>
          ALL OTHER FLAGS
        </Text>

        <Text style={styles.text}>
          3 = ×3 • 4 = ×8 • 5 = ×20
        </Text>

        <Text style={styles.bigEmoji}>
          ⭐ 🌐 💎
        </Text>

        <Text style={styles.text}>
          WILD • FREE SPINS • JACKPOT
        </Text>
      </GameModal>

      <Text style={styles.title}>
        🌍 WORLD FLAGS SLOT 🌍
      </Text>

      <Text style={styles.subtitle}>
        193 UN MEMBER STATES
      </Text>

      {vip && (
        <Text style={styles.vip}>
          👑 VIP PLAYER
        </Text>
      )}

      <View style={styles.playerRow}>
        <Stat
          label="LEVEL"
          value={level}
        />

        <Stat
          label="XP"
          value={`${xp}/100`}
        />

        <Stat
          label="STREAK"
          value={`🔥 ${dailyStreak}`}
        />
      </View>

      <View style={styles.buttonRow}>
        <SmallButton
          text="👤 PROFILE"
          onPress={() =>
            setModal("profile")
          }
        />

        <SmallButton
          text="🏆 RANK"
          onPress={() =>
            setModal("leaderboard")
          }
        />

        <SmallButton
          text="🎁 DAILY"
          onPress={claimDailyBonus}
        />
      </View>

      <View style={styles.buttonRow}>
        <SmallButton
          text="🎯 MISSIONS"
          onPress={() =>
            setModal("missions")
          }
        />

        <SmallButton
          text="🛒 SHOP"
          onPress={() =>
            setModal("shop")
          }
        />

        <SmallButton
          text="INFO"
          onPress={() =>
            setModal("info")
          }
        />
      </View>

      <View style={styles.jackpot}>
        <Text style={styles.gold}>
          💎 JACKPOT
        </Text>

        <Text style={styles.jackpotValue}>
          {jackpot}
        </Text>
      </View>

      <View style={styles.playerRow}>
        <Stat
          label="BALANCE"
          value={balance}
        />

        <Stat
          label="BET"
          value={bet}
        />

        <Stat
          label="WIN"
          value={displayWin}
        />
      </View>

      <View style={styles.slot}>
        {Array.from({
          length: 5,
        }).map((_, column) => {
          const animation =
            reelAnimations[column];

          return (
            <Animated.View
              key={column}
              style={[
                styles.reel,
                {
                  transform: [
                    {
                      translateY:
                        animation.interpolate({
                          inputRange: [-1, 0, 1],
                          outputRange: [-25, 0, 25],
                        }),
                    },
                  ],
                },
              ]}
            >
              {[0, 1, 2].map((row) => {
                const index =
                  row * 5 +
                  column;

                const symbol =
                  reels[index];

                return (
                  <View
                    key={index}
                    style={[
                      styles.cell,
                      winningIndexes.includes(
                        index
                      ) &&
                        styles.winCell,
                    ]}
                  >
                    <Text style={styles.symbol}>
                      {symbol}
                    </Text>

                    {[
                      WILD,
                      GLOBE,
                      JACKPOT,
                    ].includes(symbol) && (
                      <Text style={styles.symbolLabel}>
                        {symbol === WILD
                          ? "WILD"
                          : symbol === GLOBE
                          ? "SCATTER"
                          : "JACKPOT"}
                      </Text>
                    )}
                  </View>
                );
              })}
            </Animated.View>
          );
        })}
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

      <Text style={styles.free}>
        FREE SPINS: {freeSpins}
      </Text>

      <View style={styles.buttonRow}>
        <SmallButton
          text="BET -"
          onPress={() =>
            setBet((value) =>
              Math.max(
                5,
                value - 5
              )
            )
          }
        />

        <SmallButton
          text="BET +"
          onPress={() =>
            setBet((value) =>
              Math.min(
                100,
                value + 5
              )
            )
          }
        />

        <SmallButton
          text="MAX"
          onPress={() =>
            setBet(100)
          }
        />
      </View>

      <View style={styles.actionRow}>
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
          <Text style={styles.buttonText}>
            {autoSpin
              ? "STOP AUTO"
              : "AUTO SPIN"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.spinButton}
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

function Stat({
  label,
  value,
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.label}>
        {label}
      </Text>

      <Text style={styles.statValue}>
        {value}
      </Text>
    </View>
  );
}

function ProfileStat({
  icon,
  title,
  value,
}) {
  return (
    <Card>
      <Text style={styles.profileIcon}>
        {icon}
      </Text>

      <Text style={styles.label}>
        {title}
      </Text>

      <Text style={styles.profileValue}>
        {value}
      </Text>
    </Card>
  );
}

function LeaderboardRow({
  rank,
  icon,
  title,
  value,
}) {
  return (
    <View style={styles.leaderRow}>
      <Text style={styles.rank}>
        #{rank}
      </Text>

      <Text style={styles.leaderIcon}>
        {icon}
      </Text>

      <View style={{ flex: 1 }}>
        <Text style={styles.leaderTitle}>
          {title}
        </Text>
      </View>

      <Text style={styles.leaderValue}>
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
      style={styles.smallButton}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

function GoldButton({
  text,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.goldButton}
      onPress={onPress}
    >
      <Text style={styles.darkText}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

function Card({ children }) {
  return (
    <View style={styles.card}>
      {children}
    </View>
  );
}

function Mission({
  title,
  value,
  reward,
  claimed,
  disabled,
  onPress,
}) {
  return (
    <Card>
      <Text style={styles.cardTitle}>
        {title}
      </Text>

      <Text style={styles.progress}>
        {value}
      </Text>

      <Text style={styles.text}>
        REWARD: {reward} CREDITS
      </Text>

      <GoldButton
        text={
          claimed
            ? "CLAIMED"
            : disabled
            ? "LOCKED"
            : "CLAIM"
        }
        onPress={onPress}
      />
    </Card>
  );
}

function GameModal({
  visible,
  onClose,
  title,
  children,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
    >
      <SafeAreaView style={styles.modal}>
        <ScrollView
          contentContainerStyle={
            styles.modalContent
          }
        >
          {title && (
            <Text style={styles.modalTitle}>
              {title}
            </Text>
          )}

          {children}

          <GoldButton
            text="BACK"
            onPress={onClose}
          />
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
    padding: 8,
  },

  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#8fa8c5",
    fontSize: 10,
    marginBottom: 3,
  },

  vip: {
    color: "#ffd54a",
    fontWeight: "bold",
    marginBottom: 3,
  },

  playerRow: {
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },

  stat: {
    width: "31%",
    backgroundColor: "#14243a",
    borderRadius: 8,
    padding: 6,
    alignItems: "center",
  },

  label: {
    color: "#8fa8c5",
    fontSize: 9,
  },

  statValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  buttonRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 5,
  },

  smallButton: {
    backgroundColor: "#253e5e",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 9,
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 10,
  },

  jackpot: {
    backgroundColor: "#241b07",
    borderWidth: 2,
    borderColor: "#e7b51c",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 30,
    alignItems: "center",
    marginBottom: 5,
  },

  gold: {
    color: "#ffd54a",
    fontWeight: "bold",
  },

  jackpotValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  slot: {
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    backgroundColor: "#14243a",
    borderRadius: 14,
    padding: 5,
  },

  reel: {
    width: "20%",
  },

  cell: {
    height: 70,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#14243a",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  winCell: {
    backgroundColor: "#ffe585",
    borderColor: "#ffbd00",
  },

  symbol: {
    fontSize: 34,
  },

  symbolLabel: {
    fontSize: 7,
    fontWeight: "bold",
  },

  message: {
    color: "#ffd54a",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 6,
    minHeight: 23,
  },

  free: {
    color: "#7fd6e4",
    fontSize: 10,
    marginBottom: 5,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
  },

  autoButton: {
    backgroundColor: "#253e5e",
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 30,
  },

  autoActive: {
    backgroundColor: "#9b2f2f",
  },

  spinButton: {
    width: 145,
    backgroundColor: "#e7b51c",
    paddingVertical: 13,
    borderRadius: 35,
    alignItems: "center",
  },

  spinText: {
    color: "#07111f",
    fontSize: 20,
    fontWeight: "bold",
  },

  modal: {
    flex: 1,
    backgroundColor: "#07111f",
  },

  modalContent: {
    alignItems: "center",
    padding: 20,
    paddingBottom: 50,
  },

  modalTitle: {
    color: "#ffd54a",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },

  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#14243a",
    borderRadius: 15,
    padding: 16,
    marginBottom: 14,
    alignItems: "center",
  },

  cardTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  progress: {
    color: "#ffd54a",
    fontSize: 26,
    fontWeight: "bold",
    marginVertical: 8,
  },

  text: {
    color: "white",
    textAlign: "center",
    marginVertical: 4,
  },

  note: {
    color: "#8fa8c5",
    marginTop: 10,
  },

  goldButton: {
    backgroundColor: "#e7b51c",
    paddingVertical: 11,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 12,
  },

  darkText: {
    color: "#07111f",
    fontWeight: "bold",
  },

  bigEmoji: {
    fontSize: 50,
  },

  bigTitle: {
    color: "#ffd54a",
    fontSize: 34,
    fontWeight: "bold",
  },

  bigAmount: {
    color: "white",
    fontSize: 40,
    fontWeight: "bold",
  },

  profileLevel: {
    color: "#ffd54a",
    fontSize: 25,
    fontWeight: "bold",
  },

  profileIcon: {
    fontSize: 38,
  },

  profileValue: {
    color: "white",
    fontSize: 27,
    fontWeight: "bold",
    marginTop: 5,
  },

  leaderRow: {
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#14243a",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  rank: {
    color: "#ffd54a",
    fontSize: 18,
    fontWeight: "bold",
    width: 38,
  },

  leaderIcon: {
    fontSize: 28,
    marginRight: 10,
  },

  leaderTitle: {
    color: "#8fa8c5",
    fontSize: 11,
    fontWeight: "bold",
  },

  leaderValue: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },

  achievementHeading: {
    color: "#ffd54a",
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 14,
  },

  achievementCard: {
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#173322",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },

  achievementLocked: {
    backgroundColor: "#14243a",
    opacity: 0.5,
  },

  achievementIcon: {
    fontSize: 30,
    marginRight: 12,
  },

  achievementTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },

  achievementText: {
    color: "#8fa8c5",
    fontSize: 11,
    marginTop: 3,
  },

  achievementStatus: {
    color: "#ffd54a",
    fontSize: 24,
    fontWeight: "bold",
  },

  collectionGrid: {
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 15,
  },

  collectionCell: {
    width: 52,
    height: 52,
    backgroundColor: "#14243a",
    borderRadius: 9,
    margin: 3,
    alignItems: "center",
    justifyContent: "center",
  },

  collectionLocked: {
    opacity: 0.35,
  },

  collectionFlag: {
    fontSize: 29,
  },

  flags: {
    fontSize: 27,
    lineHeight: 38,
    textAlign: "center",
  },

  ruleTitle: {
    color: "#ffd54a",
    fontWeight: "bold",
    fontSize: 17,
    marginTop: 15,
  },
});
