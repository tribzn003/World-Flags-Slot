import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
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
    } else if (roll > 0.6) {
      count = 4;
    }

    for (let i = 0; i < count; i++) {
      reels[line[i]] = flag;
    }

    if (Math.random() < 0.3) {
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
    const result = evaluateLine(
      reels,
      line,
      bet
    );

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
    use
