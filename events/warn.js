/**
 * @param {import('../structures/client.js')} Client
 */
module.exports = Client => {
  return Client.bot.on('warn', i => {
    console.warn(i);
    return Client.rollbar.warn(i);
  });
};
