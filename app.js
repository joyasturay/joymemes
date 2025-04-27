require('dotenv').config();
const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
const express = require('express');


const app = express();
const port = process.env.PORT || 8080;
const webhookUrl = `${process.env.DOMAIN}/webhook/${process.env.BOT_TOKEN}`;

// Set up webhook
app.use(express.json());

// Set webhook path
app.post(`/webhook/${process.env.BOT_TOKEN}`, (req, res) => {
    bot.handleUpdate(req.body, res);
});

// Health check route
app.get('/', (req, res) => {
    res.send('Bot is running! 🚀');
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

const userCooldowns = new Map();
const COOLDOWN_PERIOD = 30000; 

const bot = new Telegraf(process.env.BOT_TOKEN);
const GIPHY_API_KEY = process.env.GIPHY_API_KEY;

const memes = [
    'https://i.imgur.com/9dbsm8C.jpg', 
    'https://i.imgur.com/FdxjWm2.jpg',
    'https://i.imgur.com/64mRaWm.jpg',
];


const quotes = [
    "Believe you can and you're halfway there. 💪",
    "Push yourself, because no one else is going to do it for you. 🚀",
    "Dream it. Wish it. Do it. ✨",
    "Success doesn’t just find you. You have to go out and get it. 🔥",
    "Great things never come from comfort zones. 🛡️",
];

bot.start((ctx) => ctx.reply('Welcome to Joy Meme Bot! Send /meme to get a random meme 😂'));
const sendRandomMemeOrQuote = (ctx) => {
    const randomChoice = Math.random() > 0.5 ? 'meme' : 'quote'; // 50% chance

    if (randomChoice === 'meme') {
        const randomMeme = memes[Math.floor(Math.random() * memes.length)];
        ctx.replyWithPhoto(randomMeme, { caption: "Here's a meme for you! 😂" });
    } else {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        ctx.reply(randomQuote);
    }
};
bot.command('meme', async (ctx) => {
    try {
      const response = await fetch('https://meme-api.com/gimme');
      const data = await response.json();
      
      if (data.url.endsWith('.jpg') || data.url.endsWith('.png') || data.url.endsWith('.jpeg')) {
        await ctx.replyWithPhoto({ url: data.url }, { caption: data.title });
      } else {
        await ctx.reply('Aree bhai, meme mein kuch gadbad thi. Ek aur try kar le! 🔄');
      }
    } catch (error) {
      console.error(error);
      ctx.reply('Sorry bhai, kuch gadbad ho gayi. Try again later 😔');
    }
  });
  bot.command('motivate', async (ctx) => {
    try {
        // Using type.fit API instead of quotable
        const response = await fetch('https://type.fit/api/quotes');
        const quotes = await response.json();
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        
        // Get motivational GIF from Giphy
        const giphyResponse = await fetch(`https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=motivation,inspiration,success&rating=g`);
        const giphyData = await giphyResponse.json();
        
        if (giphyData.data && giphyData.data.images && giphyData.data.images.original) {
            const gifUrl = giphyData.data.images.original.url;
            await ctx.replyWithAnimation(
                { url: gifUrl }, 
                { caption: `${randomQuote.text}\n\n- ${randomQuote.author || 'Unknown'} 💫` }
            );
        } else {
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            await ctx.reply(`${randomQuote.text}\n\n- ${randomQuote.author || 'Unknown'} 💫`);
        }
    } catch (error) {
        console.error(error);
        ctx.reply('Kuch gadbad ho gayi bhai 😔 Firse try kar.');
    }
});
  
  bot.on('message', async (ctx) => {
      const userId = ctx.from.id;
      const now = Date.now();
      const lastUsage = userCooldowns.get(userId) || 0;
  
      if (now - lastUsage < COOLDOWN_PERIOD) {
          const timeLeft = Math.ceil((COOLDOWN_PERIOD - (now - lastUsage)) / 1000);
          return ctx.reply(`Please wait ${timeLeft} seconds before requesting again! 😊`);
      }
  
      userCooldowns.set(userId, now);
  
      try {
          
          const response = await fetch(`https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&rating=g`);
          const data = await response.json();
          
          if (data.data && data.data.images && data.data.images.original) {
              const gifUrl = data.data.images.original.url;
              await ctx.replyWithAnimation({ url: gifUrl }, { caption: "Here's something fun! 😄" });
          } else {
             
              try {
                  const memeResponse = await fetch('https://meme-api.com/gimme');
                  const memeData = await memeResponse.json();
                  if (memeData.url) {
                      await ctx.replyWithPhoto({ url: memeData.url }, { caption: memeData.title || "Here's a meme! 😂" });
                  } else {
                      throw new Error('No meme available');
                  }
              } catch {
                  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                  await ctx.reply(randomQuote);
              }
          }
      } catch (error) {
          console.error(error);
          const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
          await ctx.reply(randomQuote);
      }
  });
setInterval(() => {
    const now = Date.now();
    for (const [userId, timestamp] of userCooldowns.entries()) {
        if (now - timestamp > COOLDOWN_PERIOD) {
            userCooldowns.delete(userId);
        }
    }
}, 3600000); 
// Replace bot.launch() with webhook setup
if (process.env.NODE_ENV === 'production') {
    // Use webhooks in production (Render)
    bot.telegram.setWebhook(`${DOMAIN}/webhook/${process.env.BOT_TOKEN}`);
    console.log('Bot is running on webhooks 🚀');
} else {
    // Use polling in development (local)
    bot.launch();
    console.log('Bot is running on polling 🚀');
}


process.once('SIGINT', () => {
    bot.stop('SIGINT');
    process.exit(0);
});
process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    process.exit(0);
});

console.log('Bot is running... 🚀');
