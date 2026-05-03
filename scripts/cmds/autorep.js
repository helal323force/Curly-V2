const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "autoreply_data.json");

// Load saved memory
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
    aliases: ["atrep"],
    version: "4.0",
    author: "Helal",
    countDown: 3,
    role: 0,
    category: "utility",
    shortDescription: {
      en: "Advanced Auto Reply"
    }
  },

  onStart: async function ({ message, args, event }) {
    const sub = args[0]?.toLowerCase();

    // Help Menu
    if (!sub) {
      return message.reply(
        "⚙️ AutoReply Commands:\n\n" +
        "/ar add <trigger> | <reply>\n" +
        "/ar remove <trigger>\n" +
        "/ar list\n" +
        "/ar clear\n\n" +
        "✅ Multiline Supported\n\n" +
        "Example:\n" +
        "/ar add ip |\n" +
        "IP\n\n" +
        "191.96.231.21"
      );
    }

    // ADD
    if (sub === "add") {

      // Full raw message
      const raw = event.body;

      // Remove "/ar add "
      const content = raw
        .replace(/^[\/~!.\-]?(ar|autoreply)\s+add\s+/i, "")
        .trim();

      if (!content.includes("|")) {
        return message.reply(
          "❗ Use `|` to separate trigger & reply.\n\n" +
          "Example:\n" +
          "/ar add hello | Hi!"
        );
      }

      // Split only first |
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
      const trigger = args
        .slice(1)
        .join(" ")
        .toLowerCase();

      if (!trigger) {
        return message.reply(
          "❌ Usage:\n/ar remove <trigger>"
        );
      }

      if (!memory[trigger]) {
        return message.reply(
          "⚠️ Trigger not found!"
        );
      }

      delete memory[trigger];

      saveData();

      return message.reply(
        `🗑️ Removed '${trigger}'`
      );
    }

    // LIST
    if (sub === "list") {
      const data = Object.entries(memory);

      if (!data.length) {
        return message.reply(
          "📭 No AutoReply found!"
        );
      }

      let msg =
        "🧠 AutoReply List\n" +
        "━━━━━━━━━━━━━━\n";

      for (const [key, val] of data) {
        msg += `\n🔹 ${key}\n💬 ${val}\n`;
      }

      return message.reply(msg);
    }

    // CLEAR
    if (sub === "clear") {
      memory = {};

      saveData();

      return message.reply(
        "🧹 Cleared all AutoReplies!"
      );
    }
  },

  onChat: async function ({ event, message, api }) {

    // Ignore bot's own messages
    if (event.senderID == api.getCurrentUserID()) return;

    const text = (event.body || "").toLowerCase();

    if (!text) return;

    const keys = Object.keys(memory);

    if (!keys.length) return;

    // Match trigger
    const found = keys.find(trigger =>
      text.includes(trigger.toLowerCase())
    );

    if (!found) return;

    const reply = memory[found];

    return message.reply(reply);
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
    console.error(
      "❌ Failed to save data:",
      err
    );
  }
}