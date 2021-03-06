/**
 * @param {import('../../structures/client.js')} Client
 * @param {import('discord.js').Message} message
 * @param {String[]} args
*/
module.exports = async (Client, message, args) => {
  if (!await Client.checkPerms('set', 'level', message.member)) return Client.functions.get('noCustomPerm')(message, 'level.set');

  if (!args[1]) return Client.functions.get('argMissing')(message.channel, 1, 'a member to set the level of');
  const member = await Client.getObj(args[1], { guild: message.guild, type: 'member' });
  if (!member) return Client.functions.get('argFix')(Client, message.channel, 1, 'Did not find a member with that query.');
  if (member === message.member && message.member !== message.guild.owner) return message.reply('You cannot set a level for yourself!');
  if (member.roles.highest.position >= message.member.roles.highest.position && message.member !== message.guild.owner) return message.reply('Your role position is not high enough for that member!');
  if (member === message.guild.owner && message.member !== message.guild.owner) return message.reply('You cannot set a level for the owner!');

  const amt = args[2];
  if (!amt) return Client.functions.get('argMissing')(message.channel, 2, 'an amount to set the level with');
  if (isNaN(amt)) return Client.functions.get('argFix')(Client, message.channel, 2, 'The amount was not a number.');
  if (amt < 1) return Client.functions.get('argFix')(Client, message.channel, 2, 'The amount cannot be lower than 1.');
  if (amt > 1000) return Client.functions.get('argFix')(Client, message.channel, 2, 'The amount may not exceed 1,000.');
  if (amt.includes('.')) return Client.functions.get('argFix')(Client, message.channel, 2, 'The amount may not include a decimal.');

  const exists = (await Client.sql.query('SELECT * FROM scores WHERE userid = $1 AND guildid = $2', [member.id, message.guild.id])).rows[0];
  if (exists) Client.sql.query('UPDATE scores SET level = $1, points = $2 WHERE userid = $3 AND guildid = $4', [amt, Math.pow(amt / 0.2, 2), member.id, message.guild.id]);
  else Client.sql.query('INSERT INTO scores (guildid, userid, level, points) VALUES ($1, $2, $3, $4)', [message.guild.id, member.id, amt, Math.pow(amt / 0.2, 2)]);

  return message.channel.send(`Successfully changed ${member.user.tag}'s level to ${amt}, which resulted in ${Math.pow(amt / 0.2, 2)} points.`);
};

module.exports.help = {
  name: 'setlevel',
  desc: 'Sets the level of a member!',
  category: 'moderation',
  usage: '?setlevel <Member> <New Level>',
  aliases: []
};
