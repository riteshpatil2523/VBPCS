import { Schema, model } from 'mongoose';

const audioRecordingSchema = new Schema({
  fileName: String,
  filePath: String,
  uploadDate: {
    type: Date,
    default: Date.now
  },
  patientName: String,
  transcription: String,
  priority: String,
  problem: String
});

const patientSchema = new Schema({
  patientId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  dateofBirth: {
    type: String,
    required: true,
  },

  mobile: {
    type: String,
    required: true,
  },
  diagnosis: {
    type: String,
    required: true,
  },
  wardBedNo: {
    type: String,
    required: true,
  },
  admitDate: {
    type: Date,
    required: true,
  },
  audioRecordings: [audioRecordingSchema]
});

const Patient = model('Patient', patientSchema);
export default Patient;
