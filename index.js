require("dotenv").config();

const express = require("express");
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const app = express();
app.use(express.json());

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const WALLET = "Bpp5rHJSkaL2mzPNSXa6tPRcMrP382imKFczPPzp7mdJ";

// remembers tokens already alerted for buys
const seenBuyTokens = new Set();

client.once("ready", () => {
    console.log(`✅ ${client.user.tag} is online`);
});

app.post("/webhook", async (req, res) => {
    try {
        const data = req.body;
        const channel = await client.channels.fetch(process.env.CHANNEL_ID);

        for (const tx of data) {
            if (!tx.tokenTransfers) continue;

            for (const transfer of tx.tokenTransfers) {
                const tokenName = transfer.tokenSymbol || "Unknown";
                const ca = transfer.mint;

                // BUY — only first buy per token
                if (transfer.toUserAccount === WALLET) {
                    if (seenBuyTokens.has(ca)) continue;

                    seenBuyTokens.add(ca);

                    const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setTitle("🕵️ Wallet Buy Detected")
                        .setDescription(
                            `Wallet bought: **$${tokenName}**\nCA: \`${ca}\``
                        );

                    await channel.send({ embeds: [embed] });
                }

                // SELL — no CA, no $
                if (transfer.fromUserAccount === WALLET) {
                    const cleanName = tokenName.replace("$", "");

                    const embed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("🕵️ Wallet Sell Detected")
                        .setDescription(
                            `Sold token: **${cleanName}**`
                        );

                    await channel.send({ embeds: [embed] });
                }
            }
        }

        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("🚀 Webhook running");
});

client.login(process.env.TOKEN);
