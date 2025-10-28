import fs from "fs/promises";
import path from "path";
import express from "express";
import config from "./config.js";
import { connect, writeSession, patch, parseDir, sleep } from "./lib/index.js";
import { getandRequirePlugins } from "./lib/db/plugins.js";

class BotSystem {
   constructor() {
      global.__basedir = path.resolve();
      this.app = express();
      this.port = process.env.PORT || 3000;
   }

   async initialize() {
      try {
         await Promise.all([
            patch(),
            parseDir(path.join(global.__basedir, "/lib/db/")),
            parseDir(path.join(global.__basedir, "/plugins/")),
            this.ensureTempDir(),
            this.createGitignore(),
         ]);

         await sleep(2000);
         console.log("Syncing Database...");
         await config.DATABASE.sync();
         await writeSession();
         await getandRequirePlugins();
         console.log("External Modules Installed ✅");
         return await connect();
      } catch (error) {
         console.error("Initialization error:", error);
      }
   }

   startServer() {
      this.app.get("/", (req, res) => res.send("Bot Running ✅"));
      this.app.listen(this.port, () => console.log(`Server running on port ${this.port}`));
   }

   async ensureTempDir() {
      const dir = path.join(global.__basedir, "temp");
      await fs.mkdir(dir, { recursive: true });
   }

   async createGitignore() {
      const content = `node_modules
.gitignore
session
.env
package-lock.json
database.db
temp`;
      await fs.writeFile(".gitignore", content);
   }

   async main() {
      try {
         await this.initialize();
         this.startServer();
      } catch (error) {
         console.warn("BOT SYSTEM FAILED ⚠️", error);
      }
   }
}

new BotSystem().main();
