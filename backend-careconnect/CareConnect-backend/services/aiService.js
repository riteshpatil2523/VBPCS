import axios from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import path from 'path';
import fs from 'fs';

const speech_to_text_api = async (audioFilePath) => {
    try {
        const formData = new FormData();

        // Verify file exists and is readable
        if (!fs.existsSync(audioFilePath)) {
            throw new Error('Audio file not found');
        }

        // Read file stats
        const fileStats = fs.statSync(audioFilePath);
        if (fileStats.size === 0) {
            throw new Error('Audio file is empty');
        }

        // Create read stream with proper encoding
        const fileStream = createReadStream(audioFilePath, { encoding: null });

        formData.append('audio_file', fileStream, {
            filename: path.basename(audioFilePath),
            contentType: 'audio/wav',
            knownLength: fileStats.size,
            header: true  // Ensure header is included
        });

        console.log('Sending file:', {
            path: audioFilePath,
            size: fileStats.size,
            filename: path.basename(audioFilePath)
        });

        const response = await axios({
            method: 'post',
            url: 'http://127.0.0.1:8000/audio_to_text/',
            data: formData,
            headers: {
                ...formData.getHeaders(),
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 30000  // 30 second timeout
        });

        if (response.data && response.data.success) {
            return response.data.text;
        } else {
            throw new Error(response.data.error || 'Failed to process audio');
        }
    } catch (error) {
        console.error('Speech to text error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            path: audioFilePath
        });
        throw error;
    }
};

const urgency_classifier_api = async (text) => {
    try {
        const formData = new FormData();
        formData.append('text', text);

        const response = await axios({
            method: 'post',
            url: 'http://127.0.0.1:8000/urgency_classifier/',
            data: formData,
            headers: {
                ...formData.getHeaders(),
                'Content-Type': 'multipart/form-data'
            }
        });

        return {
            priority: response.data.priority,
            problem: response.data.problem
        };
    } catch (error) {
        console.error('Urgency classifier error:', error);
        throw error;
    }
};

export {
    speech_to_text_api,
    urgency_classifier_api
};
