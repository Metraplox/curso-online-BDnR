const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  coursesProgress: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    status: {
      type: String,
      enum: ['INICIADO', 'EN_CURSO', 'COMPLETADO'],
      default: 'INICIADO'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);