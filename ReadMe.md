# Photo Service

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/your-username/photo-service)
[![Platform](https://img.shields.io/badge/platform-Ionic-brightgreen.svg)](https://ionicframework.com/)

Photo Service is an Angular service for capturing and managing photos using Capacitor plugins. It provides functionality for capturing photos, saving them, recognizing text from images using OCR, and managing photo storage.

![Photo Service Demo](demo.gif)

## Features

- Capture photos using the device camera
- Save photos to the local filesystem
- Recognize text from images using OCR
- Manage photo storage and retrieval

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/photo-service.git

cd photo-service
npm install
ionic serve
import { PhotoService, UserPhoto } from './photo-service.module';
constructor(private photoService: PhotoService) {}
// Capture a new photo and save it
this.photoService.addNewPhotoToGallery();

// Load saved photos from storage
const photos: UserPhoto[] = await this.photoService.loadSavedPhotos();

// Recognize text from an image
const result = await this.photoService.recognizeText(imageData);
console.log('OCR result:', result);
Dependencies

    @angular/core
    @angular/platform-browser
    @capacitor/camera
    @capacitor/core
    @capacitor/filesystem
    @capacitor/preferences
    @ionic/angular
    capacitor-document-scanner
    tesseract.js
    @awesome-cordova-plugins/ocr

License

This project is licensed under the MIT License.
