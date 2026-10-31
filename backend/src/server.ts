
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

async function main() {
  try {
    await connectDB();

    app.listen(env.PORT, () => {
      console.log("=================================");
      console.log("  GOCELONE BACKEND IS RUNNING");
      console.log("=================================");
      console.log(`Port: ${env.PORT}`);
      console.log(`API: http://localhost:${env.PORT}`);
      console.log(`Database: gocelone`);
    });
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
}

main();
