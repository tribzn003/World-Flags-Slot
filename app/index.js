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

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function createReels() {
  return Array.from({ length: 15 }, () => randomSymbol());
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

    if (freeSpins > 0) {
      setFreeSpins((v) => v - 1);
    } else {
      setBalance((v) => v - bet);
    }

    const newReels = createReels();
    setReels(newReels);

    const globes = newReels.filter((x) => x === "🌐").length;

    if (globes >= 3) {
      let awarded = 8;

      if (globes === 4) awarded = 12;
      if (globes >= 5) awarded = 20;

      setFreeSpins((v) => v + awarded);
      setMessage(`${awarded} FREE SPINS!`);
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

      <View style={styles.betRow}>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => setBet((b) => Math.max(1, b - 5))}
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
    gap: 18,
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
    marginVertical: 20,
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
