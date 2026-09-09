import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";

const symbols = [
  "🇷🇸", "🇺🇸", "🇬🇧", "🇫🇷", "🇩🇪",
  "🇮🇹", "🇪🇸", "🇧🇷", "🇦🇷", "🇯🇵",
  "🇨🇳", "🇮🇳", "🇨🇦", "🇦🇺", "🇬🇷",
  "🇪🇬", "🇲🇽", "🇿🇦", "🇸🇪", "🇳🇴",
  "🌐"
];

const PAYOUTS = {
  3: 3,
  4: 8,
  5: 20,
};

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function createReels() {
  return Array.from({ length: 15 }, () => randomSymbol());
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

  if (first === "🌐") {
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
  const [message, setMessage] = useState("WORLD FLAGS SLOT");

  const spin = () => {
    if (freeSpins <= 0 && balance < bet) {
      setMessage("Not enough credits");
      return;
    }

    let currentBalance = balance;

    if (freeSpins > 0) {
      setFreeSpins((v) => Math.max(0, v - 1));
    } else {
      currentBalance -= bet;
    }

    const newReels = createReels();
    setReels(newReels);

    const rows = getRows(newReels);

    let win = 0;

    rows.forEach((row) => {
      win += checkLine(row, bet);
    });

    const globes = newReels.filter((x) => x === "🌐").length;

    let awardedFreeSpins = 0;

    if (globes === 3) {
      awardedFreeSpins = 8;
    } else if (globes === 4) {
      awardedFreeSpins = 12;
    } else if (globes >= 5) {
      awardedFreeSpins = 20;
    }

    if (awardedFreeSpins > 0) {
      setFreeSpins((v) => v + awardedFreeSpins);
    }

    currentBalance += win;
    setBalance(currentBalance);

    if (win > 0 && awardedFreeSpins > 0) {
      setMessage(
        `WIN ${win} + ${awardedFreeSpins} FREE SPINS!`
      );
    } else if (win > 0) {
      setMessage(`WIN ${win}!`);
    } else if (awardedFreeSpins > 0) {
      setMessage(`${awardedFreeSpins} FREE SPINS!`);
    } else {
      setMessage("Good luck!");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🌍 WORLD FLAGS SLOT 🌍</Text>

      <View style={styles.info}>
        <Text style={styles.infoText}>Balance: {balance}</Text>
        <Text style={styles.infoText}>Bet: {bet}</Text>
        <Text style={styles.infoText}>Free: {freeSpins}</Text>
      </View>

      <View style={styles.slot}>
        {reels.map((symbol, index) => (
          <View key={index} style={styles.cell}>
            <Text style={styles.symbol}>{symbol}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.message}>{message}</Text>

      <View style={styles.paytable}>
        <Text style={styles.payText}>3 flags = ×3</Text>
        <Text style={styles.payText}>4 flags = ×8</Text>
        <Text style={styles.payText}>5 flags = ×20</Text>
      </View>

      <View style={styles.betRow}>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => setBet((b) => Math.max(5, b - 5))}
        >
          <Text style={styles.buttonText}>BET -</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => setBet((b) => Math.min(100, b + 5))}
        >
          <Text style={styles.buttonText}>BET +</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.spinButton} onPress={spin}>
        <Text style={styles.spinText}>SPIN</Text>
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
    padding: 16,
  },

  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },

  info: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 18,
  },

  infoText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  slot: {
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#14243a",
    borderRadius: 16,
    padding: 8,
  },

  cell: {
    width: "20%",
    height: 85,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#07111f",
    borderRadius: 10,
    backgroundColor: "white",
  },

  symbol: {
    fontSize: 43,
  },

  message: {
    color: "#ffd54a",
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 18,
    textAlign: "center",
  },

  paytable: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },

  payText: {
    color: "#b9c7d8",
    fontSize: 13,
  },

  betRow: {
    flexDirection: "row",
    gap: 12,
  },

  smallButton: {
    backgroundColor: "#253e5e",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
  },

  spinButton: {
    marginTop: 20,
    backgroundColor: "#e7b51c",
    width: 190,
    paddingVertical: 18,
    alignItems: "center",
    borderRadius: 40,
  },

  spinText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#07111f",
  },
});
