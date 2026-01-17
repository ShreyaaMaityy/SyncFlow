const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema({
  workspaceId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    default: 'Untitled Workspace'
  },
  nodes: {
    type: Array,
    default: []
  },
  edges: {
    type: Array,
    default: []
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // Add user reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for backward compatibility with old data
  }
});

module.exports = mongoose.model('Workspace', WorkspaceSchema);
