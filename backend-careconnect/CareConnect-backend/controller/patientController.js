import Patient from "../model/patientModel.js";
import jwt from "jsonwebtoken";
import multer from 'multer';
import path from 'path';
import { speech_to_text_api, urgency_classifier_api } from '../services/aiService.js';

// Configure multer for audio file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/audio'); // Audio files will be stored in uploads/audio directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only audio files
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['audio/wav'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
  }
}).single('audio_file');

// add patients
const addPatient = async (req, res) => {
  const { patientId, name, dateofBirth, mobile, diagnosis, wardBedNo, admitDate } = req.body;

  try {
    const newPatient = new Patient({ patientId, name, dateofBirth, mobile, diagnosis, wardBedNo, admitDate });
    await newPatient.save();
    res.status(201).json({ message: 'Patient added successfully', patient: newPatient });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Patient ID must be unique' });
    } else {
      res.status(500).json({ message: 'Failed to add patient', error: error.message });
    }
  }
};

// get patients
const getPatient = async (req, res) => {
  try {
    const patients = await Patient.find();
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve patients', error: error.message });
  }
};

// delete a patient
const deletePatient = async (req, res) => {
  const { patientId } = req.params;

  try {
    const deletedPatient = await Patient.findOneAndDelete({ patientId });
    if (deletedPatient) {
      res.status(200).json({ message: 'Patient deleted successfully' });
    } else {
      res.status(404).json({ error: 'Patient not found' });
    }
  }
  catch (err) {
    res.status(400).json({ error: 'Error deleting patient' });
  }
}

// Login patient
const loginPatient = async (req, res) => {
  const key = 'Patient_huun_mai';
  const { id, password } = req.body;

  try {
    // Find the patient by ID and Date of Birth
    const patient = await Patient.findOne({ patientId: id });
    if (patient) {
      const isPasswordValid = password === patient.dateofBirth;
      if (isPasswordValid) {
        //generate token on successful login
        const patienttoken = jwt.sign({ uniqueId: patient.id }, key, { expiresIn: '7d' });

        res.status(200).json({ message: 'Login successful', patienttoken, patient });
      } else {
        res.status(401).json({ message: 'Invalid Patient ID or Date of Birth' });
      }
    }
    else {
      res.status(404).json({ message: 'Patient not found' });
    }
  }
  catch (error) {
    res.status(500).json({ message: 'Failed to log in', error: error.message });
  }
}

// Handle audio upload
const uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file uploaded' });
    }

    const patientId = req.headers['patient-id'];
    const { patientName } = req.body;

    if (!patientId || !patientName) {
      return res.status(400).json({ message: 'Patient information missing' });
    }

    // Get the path of the uploaded file
    const audioFilePath = req.file.path;

    try {
      // Save basic audio record first
      const basicAudioRecord = await Patient.findOneAndUpdate(
        { patientId: patientId },
        {
          $push: {
            audioRecordings: {
              fileName: req.file.filename,
              filePath: audioFilePath,
              uploadDate: new Date(),
              patientName: patientName
            }
          }
        },
        { new: true }
      );

      if (!basicAudioRecord) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      // Return success response for the upload
      res.status(200).json({
        message: 'Audio uploaded successfully',
        audioRecord: basicAudioRecord.audioRecordings[basicAudioRecord.audioRecordings.length - 1]
      });

      // Process AI features after sending response
      try {
        const transcribedText = await speech_to_text_api(audioFilePath);
        const { priority, problem } = await urgency_classifier_api(transcribedText);

        // Update the record with AI results
        await Patient.findOneAndUpdate(
          {
            patientId: patientId,
            'audioRecordings.fileName': req.file.filename
          },
          {
            $set: {
              'audioRecordings.$.transcription': transcribedText,
              'audioRecordings.$.priority': priority,
              'audioRecordings.$.problem': problem
            }
          }
        );
      } catch (aiError) {
        console.error('AI Processing Error:', aiError);
        // AI processing errors don't affect the upload success
      }

    } catch (dbError) {
      console.error('Database Error:', dbError);
      return res.status(500).json({
        message: 'Database error',
        error: dbError.message
      });
    }

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({
      message: 'Failed to process upload',
      error: error.message
    });
  }
};

export {
  addPatient,
  getPatient,
  deletePatient,
  loginPatient,
  uploadAudio,
  upload,
};
