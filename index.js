// Requires the Discord.js module
const Discord = require("discord.js");
// Defines "bot" as the Discord Client
const bot = new Discord.Client({
    disableEveryone: true,
    disabledEvents: [
        'START_TYPING',
        'STOP_TYPING',
        'RELATIONSHIP_ADD',
        'RELATIONSHIP_REMOVE',
        'USER_SETTINGS_UPDATE',
        'USER_NOTE_UPDATE',
        'GUILD_SYNC'
    ]
});
// Requires array-utility, which adds useful methods to arrays.
require('array-utility');
// Gets the variables from .env and puts it in process.env
require('dotenv').config();
// Defines the client class
const client = class {
    constructor() {
        // Defines "prefix" as the default prefix. This may or may not be updated in the "message" event.
        this.prefix = '?';
        // Requires fs
        this.fs = require('fs');
        // Defines "commands" and "events" as objects.
        this.commands = {};
        this.events = {};
        // Reads the folders "commands" and "events"
        this.funCommandsList = this.fs.readdirSync('./commands/fun');
        this.miscCommandsList = this.fs.readdirSync('./commands/misc');
        this.modCommandsList = this.fs.readdirSync('./commands/moderation');
        this.musicCommandsList = this.fs.readdirSync('./commands/music');
        this.commandsList = [];
        this.eventList = this.fs.readdirSync('./events');

        const categories = {
            fun: this.funCommandsList,
            misc: this.miscCommandsList,
            moderation: this.modCommandsList,
            music: this.musicCommandsList
        };
        const categNames = Object.keys(categories);
        for (let i = 0; i < categNames.length; i++) { // Creates a loop
            for (let i2 = 0; i2 < categories[categNames[i]].length; i2++) {
                let item = categories[categNames[i]][i2]; // Defines each of the file as item
                if (item.match(/\.js$/)) { // only take js files
                    delete require.cache[require.resolve(`./commands/${categNames[i]}/${item}`)]; // delete the cache of the require, useful in case you wanna reload the command again
                    this.commands[item.slice(0, -3)] = require(`./commands/${categNames[i]}/${item}`); // and put the require inside the client.commands object
                    this.commandsList.push(item.slice(0, -3));
                }
            }
        }

        for (let i = 0; i < this.eventList.length; i++) { // Creates a loop
            let item = this.eventList[i]; // Defines each of the file as item
            if (item.match(/\.js$/)) { // only take js files
                delete require.cache[require.resolve(`./events/${item}`)]; // delete the cache of the require, useful in case you wanna reload the command again
                this.events[item.slice(0, -3)] = require(`./events/${item}`); // and put the require inside the client.commands object
            }
        }

        // Requires rollbar for error handling
        this.rollbar = new (require('rollbar'))(process.env.ROLLBAR_ACCESS_TOKEN);
        // Requires the osu! API
        this.osu = new (require('node-osu')).Api(process.env.OSU_KEY);
        // Requires canvas for welcoming messages
        this.canvas = require('canvas');
        // Requires node-fetch for welcoming messages
        this.fetch = require('node-fetch');
        // Requires dateformat
        this.dateFormat = require('dateformat');
        // Requires fuzzball
        this.fuzz = require('fuzzball');
        // Defines client.cooldown as 
        this.cooldown = new Set();
        // Defines "msgEdit" as an object, this is used for editing features.
        this.msgEdit = {};
        // Requires the music functions
        this.musicfn = require('./functions/music.js');
        // Requires the postgres module
        this.sql = new (require('pg')).Client({
            user: process.env.SQL_USER,
            password: process.env.SQL_PASS,
            database: process.env.SQL_DB,
            port: process.env.SQL_PORT,
            host: process.env.SQL_HOST,
            ssl: true
        });

        this.bot = bot;
    }

    capFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    getFuzz(str) {
        let ordered = [];
        this.commandsList.forEach(cmd => {
            ordered.push([cmd, this.fuzz.ratio(str, cmd)]);
        });
        ordered.sort((a, b) => b[1] - a[1]);
        return ordered.slice(0, 3);
    }
}

// Defines "Client" as the client object.
const Client = new client();

// Starts an event listener "ready", this is emitted when the bot is ready.
bot.on('ready', () => require('./events/ready.js')(Client, bot));

// Starts an event listener "message", this is emitted when a message is sent.
bot.on('message', message => require('./events/message.js')(Client, message));

// Emitted whenever the client's WebSocket encounters a connection error.
bot.on('error', console.error);

// Emitted when the process encounters a warning.
bot.on('warn', i => {
    console.warn(i);
    Client.rollbar.warn(i);
});

process.on('unhandledRejection', error => {
    console.error(error);
    Client.rollbar.error(error);
});

// Logs the bot in.
bot.login(process.env.BOT_TOKEN);