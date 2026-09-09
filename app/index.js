import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
} from "react-native";

// 193 UN MEMBER STATES
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

const PAYOUTS = {
  3: 3,
  4: 8,
  5: 20,
};

function randomFlag() {
  return flags[Math.floor(Math.random() * flags.length)];
}

function randomSymbol() {
  if (Math.random() < 0.055) {
    return GLOBE;
  }

  return randomFlag();
}

function createReels() {
  const reels = Array.from(
    { length: 15 },
    () => randomSymbol()
  );

  // Beta test win frequency
  if (Math.random() < 0.22) {
    const row = Math.floor(Math.random() * 3);
    const flag = randomFlag();

    const roll = Math.random();

    let count = 3;

    if (roll > 0.85) {
      count = 5;
    } else if (roll > 0.60) {
      count = 4;
    }

    const start = row * 5;

    for (let i = 0; i < count; i++) {
      reels[start + i] = flag;
    }
  }

  return reels;
}

function getRows(reels) {
  return [
    reels.slice(0, 5),
    reels.slice(5, 10),
    reels.slice(10, 15),
  ];
}

function checkWins(reels, bet) {
  const rows = getRows(reels);

  let totalWin = 0;
  const winningIndexes = [];

  rows.forEach((row, rowIndex) => {
    const first = row[0];

    if (first === GLOBE) {
      return;
    }

    let count = 1;

    for (let i = 1; i < row.length; i++) {
      if (row[i] === first) {
        count++;
      } else {
        break;
      }
    }

    if (count >= 3) {
      totalWin += bet * PAYOUTS[count];

      const rowStart = rowIndex * 5;

      for (let i = 0; i < count; i++) {
        winningIndexes.push(rowStart + i);
      }
    }
  });

  return {
    totalWin,
    winningIndexes,
  };
}

export default function HomeScreen() {
  const [reels, setReels] = useState(createReels());
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);
  const [freeSpins, setFreeSpins] = useState(0);

  const [message, setMessage] =
    useState("WORLD FLAGS SLOT");

  const [spinning, setSpinning] = useState(false);

  const [winningIndexes, setWinningIndexes] =
    useState([]);

  const spinAnim = useRef(
    new Animated.Value(0)
  ).current;

  const runSpinAnimation = (callback) => {
    spinAnim.setValue(0);

    Animated.sequence([
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),

      Animated.timing(spinAnim, {
        toValue: -1,
        duration: 180,
        useNativeDriver: true,
      }),

      Animated.timing(spinAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const spin = () => {
    if (spinning) {
      return;
    }

    if (freeSpins <= 0 && balance < bet) {
      setMessage("NOT ENOUGH CREDITS");
      return;
    }

    setSpinning(true);
    setWinningIndexes([]);
    setMessage("SPINNING...");

    let currentBalance = balance;

    const usingFreeSpin = freeSpins > 0;

    if (usingFreeSpin) {
      setFreeSpins((value) =>
        Math.max(0, value - 1)
      );
    } else {
      currentBalance -= bet;
    }

    runSpinAnimation(() => {
      const newReels = createReels();

      setReels(newReels);

      const result = checkWins(
        newReels,
        bet
      );

      const globes = newReels.filter(
        (symbol) => symbol === GLOBE
      ).length;

      let awardedFreeSpins = 0;

      if (globes === 3) {
        awardedFreeSpins = 8;
      } else if (globes === 4) {
        awardedFreeSpins = 12;
      } else if (globes >= 5) {
        awardedFreeSpins = 20;
      }

      if (awardedFreeSpins > 0) {
        setFreeSpins(
          (value) =>
            value + awardedFreeSpins
        );
      }

      currentBalance += result.totalWin;

      setBalance(currentBalance);

      setWinningIndexes(
        result.winningIndexes
      );

      if (
        result.totalWin > 0 &&
        awardedFreeSpins > 0
      ) {
        setMessage(
          `WIN ${result.totalWin} + ${awardedFreeSpins} FREE SPINS!`
        );
      } else if (result.totalWin > 0) {
        setMessage(
          `WIN ${result.totalWin}!`
        );
      } else if (awardedFreeSpins > 0) {
        setMessage(
          `${awardedFreeSpins} FREE SPINS!`
        );
      } else if (usingFreeSpin) {
        setMessage("FREE SPIN");
      } else {
        setMessage("GOOD LUCK!");
      }

      setSpinning(false);
    });
  };

  const decreaseBet = () => {
    if (spinning) {
      return;
    }

    setBet((value) =>
      Math.max(5, value - 5)
    );
  };

  const increaseBet = () => {
    if (spinning) {
      return;
    }

    setBet((value) =>
      Math.min(100, value + 5)
    );
  };

  const animatedStyle = {
    transform: [
      {
        translateY: spinAnim.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-20, 0, 20],
        }),
      },
      {
        scale: spinAnim.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [0.96, 1, 0.96],
        }),
      },
    ],
    opacity: spinAnim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [0.55, 1, 0.55],
    }),
  };

  return (
    <SafeAreaView style={styles.container}>

      <Text style={styles.title}>
        🌍 WORLD FLAGS SLOT 🌍
      </Text>

      <Text style={styles.subtitle}>
        193 UN MEMBER STATES
      </Text>

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
            FREE
          </Text>

          <Text style={styles.infoValue}>
            {freeSpins}
          </Text>
        </View>

      </View>

      <Animated.View
        style={[
          styles.slot,
          animatedStyle,
        ]}
      >

        {reels.map((symbol, index) => {
          const isWinner =
            winningIndexes.includes(index);

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

            </View>
          );
        })}

      </Animated.View>

      <Text style={styles.message}>
        {message}
      </Text>

      <View style={styles.paytable}>

        <Text style={styles.payText}>
         
