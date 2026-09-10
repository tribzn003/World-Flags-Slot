import AsyncStorage from "@react-native-async-storage/async-storage";

export const SAVE_KEY = "world_flags_slot_save_v2";

export async function loadGameData() {
  try {
    const raw = await AsyncStorage.getItem(SAVE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.log("LOAD ERROR:", error);
    return null;
  }
}

export async function saveGameData(data) {
  try {
    await AsyncStorage.setItem(
      SAVE_KEY,
      JSON.stringify(data)
    );
  } catch (error) {
    console.log("SAVE ERROR:", error);
  }
}
