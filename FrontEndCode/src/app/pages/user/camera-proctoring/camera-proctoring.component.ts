import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import * as faceapi from 'face-api.js';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-camera-proctoring',
  templateUrl: './camera-proctoring.component.html',
  styleUrls: ['./camera-proctoring.component.css']
})
export class CameraProctoringComponent implements OnInit, AfterViewInit, OnDestroy {


  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  private mediaStream: MediaStream | null = null;
  @Output() multipleFacesDetected = new EventEmitter<boolean>();
  quizId: string = ''; // Declare quizId property

  private detectionInterval: any;

  constructor(private _router: Router, private _route: ActivatedRoute) { }

  ngOnInit(): void {
    this._route.params.subscribe(params => {
      this.quizId = params['qid']; // Assign qid to quizId property
    });
    this.loadModels();
  }

  ngAfterViewInit(): void {
    this.startCamera();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopCamera();
  }

  private async loadModels(): Promise<void> {
    const MODEL_URL = '/assets/models'; // Assuming models are in src/assets/models
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
    ]);
    console.log('Face-API models loaded successfully.');
  }

  private async startCamera(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement.nativeElement.srcObject = this.mediaStream;
      this.videoElement.nativeElement.play();

      this.videoElement.nativeElement.addEventListener('play', () => {
        this.setupCanvas();
        this.detectionInterval = setInterval(() => this.detectFaces(), 100);
        // Navigate to the quiz start page after a short delay to allow proctoring to initialize
        setTimeout(() => {
          this._router.navigate(['/start', this.quizId]);
        }, 3000); // 3-second delay

      });
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not start camera. Please ensure you have a webcam and grant permissions.');
    }
  }

  private stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
    }
  }

  private setupCanvas(): void {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    faceapi.matchDimensions(canvas, video);
  }

  private async detectFaces(): Promise<void> {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const displaySize = { width: video.width, height: video.height };

    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    }

    // Logic for alerting multiple faces
    if (detections.length > 1) {
      console.warn('Multiple faces detected!');
      this.multipleFacesDetected.emit(true);
    } else {
      this.multipleFacesDetected.emit(false);
    }
  }
}
