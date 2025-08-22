const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminLogSchema = new Schema({
  admin: {
    type: Schema.Types.ObjectId,
    ref: 'User', // The admin who performed the action
    required: true
  },
  action: {
    type: String, // e.g., 'POST_DELETED', 'USER_BANNED'
    required: true
  },
  details: {
    type: String, // A human-readable description of the event
    required: true
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

const AdminLog = mongoose.model('AdminLog', adminLogSchema);

module.exports = AdminLog;