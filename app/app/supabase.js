import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  "https://tboxehpanbcnlskodkua.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_Ed2yEcoHwj-QUeBN5XI39Q_WtbsvP7C";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export async function ensurePlayerSession() {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (session?.user) {
      return {
        user: session.user,
        error: null,
      };
    }

    const { data, error } =
      await supabase.auth.signInAnonymously();

    if (error) {
      throw error;
    }

    return {
      user: data.user,
      error: null,
    };
  } catch (error) {
    console.log("SUPABASE AUTH ERROR:", error);

    return {
      user: null,
      error,
    };
  }
}

export async function updateOnlineStats({
  userId,
  playerName,
  highestLevel,
  biggestWin,
  biggestJackpot,
  flagsCollected,
  totalWins,
  totalSpins,
}) {
  try {
    const cleanName =
      playerName.trim().slice(0, 20) ||
      `PLAYER-${userId.slice(0, 4).toUpperCase()}`;

    const { error } = await supabase
      .from("slot_leaderboard")
      .upsert(
        {
          user_id: userId,
          player_name: cleanName,
          highest_level: highestLevel,
          biggest_win: biggestWin,
          biggest_jackpot: biggestJackpot,
          flags_collected: flagsCollected,
          total_wins: totalWins,
          total_spins: totalSpins,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.log("ONLINE SAVE ERROR:", error);

    return { error };
  }
}

export async function getOnlineLeaderboard() {
  try {
    const { data, error } = await supabase
      .from("slot_leaderboard")
      .select(
        "user_id,player_name,highest_level,biggest_win,biggest_jackpot,flags_collected,total_wins,total_spins"
      )
      .order("biggest_win", {
        ascending: false,
      })
      .order("biggest_jackpot", {
        ascending: false,
      })
      .order("highest_level", {
        ascending: false,
      })
      .limit(50);

    if (error) {
      throw error;
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.log("LEADERBOARD ERROR:", error);

    return {
      data: [],
      error,
    };
  }
}
