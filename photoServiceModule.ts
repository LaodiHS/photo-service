import { Injectable } from "@angular/core";
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from "@capacitor/camera";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";
import { Platform } from "@ionic/angular";
import { Capacitor } from "@capacitor/core";
import { DocumentScanner } from "capacitor-document-scanner";
import * as Tesseract from "tesseract.js";
import { EventService } from "src/environments/environment";
import {
  OCR,
  OCRResult,
  OCRSourceType,
} from "@awesome-cordova-plugins/ocr/ngx";

export const PHOTO_STORAGE = "photos";

export interface UserPhoto {
  filepath: string;
  webviewPath: string;
}

@Injectable({
  providedIn: "root",
})
export class PhotoService {
  private platform: Platform;
  private documentScanner: any = DocumentScanner;
  private scheduler: Tesseract.Scheduler;
  private ocr: OCR = new OCR();

  constructor(private sanitizer: DomSanitizer) {
    this.scheduler = Tesseract.createScheduler();
    this.initializeScheduler();
  }

  async initializeScheduler() {
    for (let i = 0; i < 4; i++) {
      const worker = Tesseract.createWorker();
      await worker.load();
      await worker.loadLanguage("eng");
      await worker.initialize("eng");
      this.scheduler.addWorker(worker);
    }
  }

  async recognizeImage(
    data: Tesseract.ImageLike
  ): Promise<
    Tesseract.ConfigResult | Tesseract.RecognizeResult | Tesseract.DetectResult
  > {
    const result:
      | Tesseract.ConfigResult
      | Tesseract.RecognizeResult
      | Tesseract.DetectResult = await this.scheduler.addJob("recognize", data);
    return result;
  }

  async scanDocument() {
    if (!this.platform.is("hybrid")) {
      console.log("Scan in progress...");
      try {
        const { scannedImages } = await DocumentScanner.scanDocument({
          letUserAdjustCrop: false,
        });
        console.log("Number of scanned images:", scannedImages.length);
      } catch (error) {
        console.log("Error:", JSON.stringify(error));
      }
    }
  }

  async recognizeText(data: string): Promise<OCRResult> {
    try {
      const result: OCRResult = await this.ocr.recText(
        OCRSourceType.BASE64,
        data
      );
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public async addNewPhotoToGallery() {
    const capturedPhoto: Photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100,
    });

    const savedImageFile: UserPhoto = await this.savePhoto(capturedPhoto);
    EventService.get("photo-added").dispatch(savedImageFile);

    photos.unshift(savedImageFile);

    Preferences.set({
      key: PHOTO_STORAGE,
      value: JSON.stringify(photos),
    });
  }

  public async loadSavedPhotos() {
    const photoList = await Preferences.get({ key: PHOTO_STORAGE });
    const storedPhotos = JSON.parse(photoList.value) || [];

    if (!Capacitor.isNativePlatform()) {
      for (const photo of storedPhotos) {
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data,
        });

        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }

    return storedPhotos;
  }

  private async savePhoto(photo: Photo): Promise<UserPhoto> {
    const base64Data = await this.convertPhotoToBase64(photo);
    const fileName = new Date().getTime() + ".jpeg";

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    if (Capacitor.isNativePlatform()) {
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else {
      return {
        filepath: fileName,
        webviewPath: photo.webPath,
      };
    }
  }

  private async convertPhotoToBase64(photo: Photo): Promise<string> {
    if (Capacitor.isNativePlatform()) {
      const file = await Filesystem.readFile({
        path: photo.path,
      });
      return file.data;
    } else {
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();
      return await this.convertBlobToBase64(blob);
    }
  }

  private convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  }
}
