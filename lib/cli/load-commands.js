'use strict';

// Loads commands and assembles them into a hash.

var RSVP = require('rsvp');
var glob = RSVP.denodeify(require('glob'));
var path = require('path');
var camelize = require('../utilities/string').camelize;

module.exports = loadCommands;
function loadCommands() {
  return glob(__dirname + '/../commands/*.js').then(buildHash);
}

function buildHash(files) {
  return files.reduce(function(commands, file) {
    var command = require(file);

    // Set optional properties and check if required properties are set
    command.name = command.name || path.basename(file, '.js');
    command.key = command.key || camelize(command.name);
    command.aliases = command.aliases || [];
    command.options = command.options || [];
    command.works = command.works || 'insideProject';

    if (!['insideProject', 'outsideProject', 'everywhere'].some(function(works) {
      return command.works === works;
    })) {
      throw new Error('The "' + command.name + '" command\'s works field has to ' +
                      'be either "everywhere", "insideProject" or "outsideProject".');
    }

    command.options.forEach(function(option) {
      if (!option.name || !option.type) {
        throw new Error('The command "' + command.name + '" has an option ' +
                        'without the required type and name fields.');
      }

      if (option.name !== option.name.toLowerCase()) {
        throw new Error('The "' + option.name + '" option\'s name of the "' +
                         command.name + '" command contains a capital letter.');
      }

      option.key = camelize(option.name);
      option.required = option.required || false;
    });

    if (!command.run) {
      throw new Error('Command "' + command.name + '" has no run() defined.');
    }

    if (!command.usageInstructions) {
      throw new Error('Command "' + command.name +
                      '" has no usageInstructions() defined.');
    }

    // Add command to commands hash
    commands[command.key] = command;

    return commands;
  }, {});
}