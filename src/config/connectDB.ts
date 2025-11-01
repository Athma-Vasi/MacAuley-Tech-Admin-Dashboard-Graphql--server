import mongoose from "mongoose";
import type { Config } from "./index.ts";

async function connectDB(mongoURI: Config["MONGO_URI"]) {
  try {
    await mongoose.connect(mongoURI);
  } catch (error) {
    console.error(error);
  }
}

export { connectDB };
