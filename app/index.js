import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
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
  // Globe scatter probability
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

  // Temporary beta win frequency.
  // This makes testing wins much easier.
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

function checkLine(row, bet) {
  const first = row[0];

  if (first === GLOBE) {
    return 0;
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
    return bet * PAYOUTS[count];
  }

  return 0;
}

export default function HomeScreen() {
  const [reels, setReels] = useState(createReels());

  const [balance, setBalance] = useState(1000);

  const [bet, setBet] = useState(10);

  const [freeSpins, setFreeSpins] = useState(0);

  const [message, setMessage] =
    useState("WORLD FLAGS SLOT");

  const spin = () => {
    if (freeSpins <= 0 && balance < bet) {
      setMessage("NOT ENOUGH CREDITS");
      return;
    }

    let currentBalance = balance;

    const usingFreeSpin = freeSpins > 0;

    if (usingFreeSpin) {
      setFreeSpins((value) =>
        Math.max(0, value - 1)
      );
    } else {
      currentBalance -= bet;
    }

    const newReels = createReels();

    setReels(newReels);

    const rows = getRows(newReels);

    let totalWin = 0;

    rows.forEach((row) => {
      totalWin += checkLine(row, bet);
    });

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
        (value) => value + awardedFreeSpins
      );
    }

    currentBalance += totalWin;

    setBalance(currentBalance);

    if (
      totalWin > 0 &&
      awardedFreeSpins > 0
    ) {
      setMessage(
        `WIN ${totalWin} + ${awardedFreeSpins} FREE SPINS!`
      );
    } else if (totalWin > 0) {
      setMessage(`WIN ${totalWin}!`);
    } else if (awardedFreeSpins > 0) {
      setMessage(
        `${awardedFreeSpins} FREE SPINS!`
      );
    } else if (usingFreeSpin) {
      setMessage("FREE SPIN");
    } else {
      setMessage("GOOD LUCK!");
    }
  };

  const decreaseBet = () => {
    setBet((value) =>
      Math.max(5, value - 5)
    );
  };

  const increaseBet = () => {
    setBet((value) =>
      Math.min(100, value + 5)
    );
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

      <View style={styles.slot}>

        {reels.map((symbol, index) => (

          <View
            key={index}
            style={styles.cell}
          >

            <Text style={styles.symbol}>
              {symbol}
            </Text>

          </View>

        ))}

      </View>

      <Text style={styles.message}>
        {message}
      </Text>

      <View style={styles.paytable}>

        <Text style={styles.payText}>
          3 FLAGS = ×3
        </Text>

        <Text style={styles.payText}>
          4 FLAGS = ×8
        </Text>

        <Text style={styles.payText}>
          5 FLAGS = ×20
        </Text>

      </View>

      <Text style={styles.scatterText}>
        🌐 3 = 8 FREE • 4 = 12 FREE • 5+ = 20 FREE
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

      </View>

      <TouchableOpacity
        style={styles.spinButton}
        onPress={spin}
      >

        <Text style={styles.spinText}>
          SPIN
        </Text>

      </TouchableOpacity>

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
    marginBottom: 15,
  },

  info: {
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  infoBox: {
    width: "31%",
    backgroundColor: "#14243a",
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: "center",
  },

  infoLabel: {
    color: "#8fa8c5",
    fontSize: 10,
  },

  infoValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },

  slot: {
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#14243a",
    borderRadius: 16,
    padding: 7,
  },

  cell: {
    width: "20%",
    height: 82,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#14243a",
    borderRadius: 9,
    backgroundColor: "#ffffff",
  },

  symbol: {
    fontSize: 40,
  },

  message: {
    minHeight: 28,
    color: "#ffd54a",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 10,
    textAlign: "center",
  },

  paytable: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 7,
  },

  payText: {
    color: "#d4deea",
    fontSize: 12,
    fontWeight: "600",
  },

  scatterText: {
    color: "#8fa8c5",
    fontSize: 11,
    marginBottom: 16,
    textAlign: "center",
  },

  betRow: {
    flexDirection: "row",
    gap: 12,
  },

  smallButton: {
    backgroundColor: "#253e5e",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
  },

  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },

  spinButton: {
    marginTop: 17,
    backgroundColor: "#e7b51c",
    width: 190,
    paddingVertical: 17,
    alignItems: "center",
    borderRadius: 40,
  },

  spinText: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#07111f",
  },

});
