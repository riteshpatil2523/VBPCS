import { Router } from 'express';
import { addPatient, getPatient, deletePatient, loginPatient, uploadAudio, upload } from '../controller/patientController.js';
const router = Router();

router.post('/', addPatient);
router.get('/', getPatient);
router.delete('/:patientId', deletePatient);
router.post('/login', loginPatient);
router.post('/upload-audio', upload, uploadAudio);

export default router;