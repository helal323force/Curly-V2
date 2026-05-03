const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "autoreply_data.json");

// Load memory
let memory = {};

if (fs.existsSync(dataFile)) {
  try {
    memory = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch {
    memory = {};
  }
}

module.exports = {
  config: {
    name: "autoreply",
    aliases: ["ar"],
    version: "5.0",
    author: "Helal",
    countDown: 3,
    role: 0,
    category: "utility",
    shortDescription: {
      en: "Smart Auto Reply (safe word match + multiline support)"
    }
  },

  onStart: async function ({ message, args, event }) {
    const sub = args[0]?.toLowerCase();

    if (!sub) {
      return message.reply(
        "⚙️ AutoReply Commands:\n\n" +
        "/ar add <trigger> | <reply>\n" +
        "/ar remove <trigger>\n" +
        "/ar list\n" +
        "/ar clear\n\n" +
        "✅ Multiline supported\n\n" +
        "Example:\n" +
        "/ar add ip |\nIP\n\n191.96.231.21\n\nPort\n14965"
      );
    }

    // ADD
    if (sub === "add") {
      const raw = event.body;

      const content = raw
        .replace(/^[\/~!.\-]?(ar|autoreply)\s+add\s+/i, "")
        .trim();

      if (!content.includes("|")) {
        return message.reply(
          "❗ Use `|` to separate trigger & reply.\nExample:\n/ar add hello | Hi!"
        );
      }

      const splitIndex = content.indexOf("|");

      const trigger = content
        .slice(0, splitIndex)
        .trim()
        .toLowerCase();

      const reply = content
        .slice(splitIndex + 1)
        .trim();

      if (!trigger || !reply) {
        return message.reply("⚠️ Invalid format!");
      }

      memory[trigger] = reply;
      saveData();

      return message.reply(
        "✅ AutoReply Added!\n\n" +
        `🔑 Trigger: ${trigger}\n` +
        `💬 Reply:\n${reply}`
      );
    }

    // REMOVE
    if (sub === "remove") {
      const trigger = args.slice(1).join(" ").toLowerCase();

      if (!trigger) {
        return message.reply("❌ Usage: /ar remove <trigger>");
      }

      if (!memory[trigger]) {
        return message.reply("⚠️ Trigger not found!");
      }

      delete memory[trigger];
      saveData();

      return message.reply(`🗑️ Removed '${trigger}'`);
    }

    // LIST
    if (sub === "list") {
      const data = Object.entries(memory);

      if (!data.length) {
        return message.reply("📭 No AutoReply found!");
      }

      let msg = "🧠 AutoReply List\n━━━━━━━━━━━━━━\n";

      for (const [k, v] of data) {
        msg += `\n🔹 ${k}\n💬 ${v}\n`;
      }

      return message.reply(msg);
    }

    // CLEAR
    if (sub === "clear") {
      memory = {};
      saveData();
      return message.reply("🧹 Cleared all AutoReplies!");
    }
  },

  onChat: async function ({ event, message, api }) {

    // ignore bot itself
    if (event.senderID == api.getCurrentUserID()) return;

    const text = (event.body || "").toLowerCase();
    if (!text) return;

    const keys = Object.keys(memory);
    if (!keys.length) return;

    // SAFE WORD MATCH (FIXED)
    const found = keys.find(trigger => {
      const safe = trigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${safe}\\b`, "i");
      return regex.test(text);
    });

    if (!found) return;

    return message.reply(memory[found]);
  }
};

// Save function
function saveData() {
  try {
    fs.writeFileSync(
      dataFile,
      JSON.stringify(memory, null, 2)
    );
  } catch (err) {
    console.error("❌ Save error:", err);
  }
}