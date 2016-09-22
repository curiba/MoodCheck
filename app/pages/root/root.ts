import { Component } from '@angular/core';
import { PopoverController, ToastController, AlertController, LoadingController, Platform, Loading, Alert, Events } from 'ionic-angular';
import { Camera, SocialSharing } from 'ionic-native';
import * as TWEEN from 'tween.js';

import { AdminPage } from '../admin/admin';
import { Utils} from '../../providers/utils';
import { Settings } from '../../providers/settings';
import { EmotionService } from '../../providers/emotion-service';
import { base64Image, base64Image2, base64Image3 } from '../../constants';

const canvasWidth: number = 500;
const canvasHeight: number = 750;

@Component({
    templateUrl: 'build/pages/root/root.html'
})
export class RootPage {

    private canvas: any;
    private context: any;
    private image: any = new Image();

    private xPos: number = 10;
    private yPos: number = 10;

    base64Image: string = null; //base64Image;

    private loading: Loading;
    private drawScanning: boolean = false;
    private scanningLoops: number = 0;
    private animationEndX: number;

    private tweenArray: Array<TWEEN.Tween> = [];
    private tweenPositionArray: Array<{ x: number, y: number, width: number, height: number }> = [];
    private tweenActive: boolean = false

    private tweenBarWidths: Array<{
        id: number, x: number, y: number,
        width: number, endWidth: number, height: number, percentageLabel: string, labelAlignment: string
    }> = [];

    private faceIndex: number = 0;

    constructor(private platform: Platform, private popoverCtrl: PopoverController,
        private alertCtrl: AlertController, private toastCtrl: ToastController,
        private loadingCtrl: LoadingController, private emotionService: EmotionService,
        private utils: Utils, private settings: Settings, private events: Events) {

        this.image.onload = () => {
            this.drawImageToCanvas();
            this.callService();
        }
        this.image.onerror = (error) => {
            AdminPage.addLog("Can't load image: " + error);
        }
    }

    ionViewLoaded() {
        AdminPage.addLog("ionViewLoaded()");

        this.canvas = document.getElementById("canvas");
        this.context = this.canvas.getContext('2d');

        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.animationEndX = (this.canvas.width / 2) - 5;

        // Event listener setup
        this.events.subscribe('emotionDataAvailable', this.emotionDataAvailableHandler);
        this.events.subscribe('scanAnimationEnded', this.scanAnimationEndedHandler);
        this.events.subscribe('faceAnimationEnded', this.faceAnimationEndedHandler);

        // click handling
        this.canvas.onclick = (e) => {
            if (this.emotionService.emotionData) {
                this.faceIndex = this.faceIndex < this.emotionService.emotionData.length - 1 ? this.faceIndex + 1 : 0;
                this.drawImageToCanvas(true);
            }
        };
    }

    ionViewDidUnload() {
        AdminPage.addLog("ionViewDidUnload()");

        // Unregister event listener
        this.events.unsubscribe('emotionDataAvailable', this.emotionDataAvailableHandler);
        this.events.unsubscribe('scanAnimationEnded', this.scanAnimationEndedHandler);
        this.events.unsubscribe('faceAnimationEnded', this.faceAnimationEndedHandler);
    }

    ionViewDidEnter() {
        AdminPage.addLog("ionViewDidEnter()");
    }

    ionViewDidLeave() {
        AdminPage.addLog("ionViewDidLeave()");
    }

    useBase64Image(event): void {
        this.base64Image = base64Image2;
        this.image.src = this.base64Image;
    }

    takePicture(event): void {
        AdminPage.addLog("takePicture()");
        AdminPage.addLog("saveMode: " + this.settings.saveToPhotoAlbum);

        let cameraOptions = {
            sourceType: Camera.PictureSourceType.CAMERA,
            destinationType: Camera.DestinationType.DATA_URL,
            quality: 50,
            targetWidth: 500,
            targetHeight: 500,
            encodingType: Camera.EncodingType.JPEG,
            cameraDirection: Camera.Direction.FRONT,
            saveToPhotoAlbum: this.settings.saveToPhotoAlbum,
            correctOrientation: false
        }

        Camera.getPicture(cameraOptions).then((imageData) => {
            this.base64Image = "data:image/jpeg;base64," + imageData;
            this.image.src = this.base64Image;
        }, (err) => {
            AdminPage.addLog("Error: " + err);
            this.utils.createDefaultApologize();
        });
    }

    selectPicture(event): void {
        let cameraOptions = {
            sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
            destinationType: Camera.DestinationType.DATA_URL,
            quality: 100,
            targetWidth: 500,
            targetHeight: 500,
            encodingType: Camera.EncodingType.JPEG,
            correctOrientation: true
        }

        Camera.getPicture(cameraOptions).then((imageData) => {
            this.base64Image = "data:image/jpeg;base64," + imageData;
            this.image.src = this.base64Image;
        }, (err) => {
            AdminPage.addLog("Error: " + err);
            this.utils.createDefaultApologize();
        });
    }

    callService(): void {
        this.startScanAnimation();
        this.emotionService.getEmotions(this.base64Image).subscribe(
            data => {
                this.emotionService.emotionData = data;
                this.faceIndex = 0;
            },
            error => {
                this.emotionService.emotionData = null;
                this.utils.createDefaultApologize();
            },
            () => {
                this.stopScanAnimation();
                this.events.publish("emotionDataAvailable");
            }
        );
    }

    drawEmotions(): void {
        AdminPage.addLog("drawEmotions()");

        if (this.emotionService.emotionData == null)
            throw new Error("emotionData must not be null!");

        if (this.emotionService.emotionData.length == 0)
            this.drawNoFacesFound();

        this.emotionService.emotionData.forEach((element, i) => {
            if (i == this.faceIndex) {
                this.drawFaceMarker(element, i);
            } else {
                this.drawFaceMarkerInactive(element, i);
            }
        });

        // if (this.emotionService.emotionData.length > 1) {
        //     this.context.fillStyle = "#ffffff";
        //     this.context.font = "bold 16px Arial";
        //     this.context.textAlign = "right";
        //     this.context.textBaseline = "alphabetic";
        //     this.context.fillText("Tap to run through", 490, 450);
        // }
        this.drawWatermark();
    }

    private drawImageToCanvas(drawEmotions: boolean = false): void {
        AdminPage.addLog("drawImageToCanvas() " + drawEmotions);

        let targetSize = this.utils.scaleImage(this.image.width, this.image.height, canvasWidth, canvasWidth)
        //AdminPage.addLog("targetSize: " + targetSize.width + " : " + targetSize.height + " (" + this.image.width + " : " + this.image.height + ")");

        this.context.fillStyle = "#dddddd";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        //this.context.drawImage(this.image, 0, 0, this.image.width, this.image.height, 0, 0, targetSize.width, targetSize.height);
        this.context.drawImage(this.image, 0, 0, this.image.width, this.image.height);

        if (drawEmotions)
            this.drawEmotions();
    }

    private startScanAnimation(): void {
        this.drawScanning = true;
        this.scanningLoops = 0;
        this.drawScanAnimation();
    }

    private stopScanAnimation(): void {
        this.drawScanning = false;
    }

    private drawScanAnimation = () => {
        this.context.strokeStyle = "#ffffff";
        this.context.fillStyle = "#ffffff";
        this.context.lineWidth = 5;

        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.drawImage(this.image, 0, 0);

        this.context.strokeRect(this.xPos, this.xPos, this.canvas.width - 2 * this.xPos, this.canvas.width - 2 * this.xPos);
        this.context.globalAlpha = 0.75;
        this.context.fillStyle = "#444444";
        this.context.fillRect(this.xPos + 3, this.xPos + 3, this.canvas.width - 2 * this.xPos - 6, this.canvas.width - 2 * this.xPos - 6);
        this.context.globalAlpha = 1;

        if (this.xPos < this.animationEndX - 50) {
            this.context.fillStyle = "#ffffff";
            this.context.fillRect(this.xPos - 2, this.xPos - 30, 100, 30);
            if (this.xPos % 30 > 10) {
                this.context.textAlign = "left";
                this.context.textBaseline = "alphabetic";
                this.context.fillStyle = "#666666";
                this.context.font = "bold 16px Arial";
                this.context.fillText("Scanning...", this.xPos, this.xPos - 10);
            }
        }

        if (this.xPos < this.animationEndX) {
            this.xPos = this.xPos + 1;
        } else {
            this.xPos = 0;
            this.scanningLoops++;
        }

        if (this.drawScanning || this.scanningLoops == 0) {
            window.requestAnimationFrame(this.drawScanAnimation);
        } else {
            this.events.publish("scanAnimationEnded");
        }
    }

    private drawFaceAnimation = () => {
        let that = this;
        this.tweenArray = [];
        this.tweenPositionArray = [];

        this.emotionService.emotionData.forEach((emotionalData, i) => {
            that.tweenActive = true;
            let tween = new TWEEN.Tween({ id: i, x: this.animationEndX, y: this.animationEndX, width: 10, height: 10 });
            let tweenPosition: any = {};
            tween.to({
                x: emotionalData.faceRectangle.left, y: emotionalData.faceRectangle.top,
                width: emotionalData.faceRectangle.width, height: emotionalData.faceRectangle.height
            }, 1000)
                .easing(TWEEN.Easing.Elastic.Out) //Exponential.Out)
                .onUpdate(function () {
                    tweenPosition.x = this.x;
                    tweenPosition.y = this.y;
                    tweenPosition.width = this.width;
                    tweenPosition.height = this.height;
                })
                .onComplete(function () {
                    console.log("face-tween-end-" + this.id);
                    if (this.id === that.emotionService.emotionData.length - 1) {
                        that.tweenActive = false;
                        console.log("this.tweenActive: " + that.tweenActive);
                    }
                })
                ;//.start();

            setTimeout(function () {
                tween.start();
            }, i * 100);

            this.tweenArray.push(tween);
            this.tweenPositionArray.push(tweenPosition);
        });
        this.faceAnimationLoop();
    }

    private faceAnimationLoop = () => {
        this.context.strokeStyle = "#ffffff";
        this.context.fillStyle = "#ffffff";
        this.context.lineWidth = 5;

        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.drawImage(this.image, 0, 0);

        // Tweened face rectangles
        this.tweenPositionArray.forEach((element) => {
            this.context.strokeRect(element.x, element.y, element.width, element.height);
        });

        TWEEN.update();
        if (this.tweenActive) {
            window.requestAnimationFrame(this.faceAnimationLoop);
        } else {
            TWEEN.removeAll();
            this.events.publish("faceAnimationEnded");
        }
    }

    private drawFaceMarker(emotionalData: any, index: number): void {
        const x: number = emotionalData.faceRectangle.left;
        const y: number = emotionalData.faceRectangle.top;
        const width: number = emotionalData.faceRectangle.width;
        const height: number = emotionalData.faceRectangle.height;
        const barX = 10;
        const barY = canvasWidth + 25;

        this.context.strokeStyle = "#ffffff";
        this.context.lineWidth = 5;

        // Face rectangle
        this.context.strokeRect(x, y, width, height);

        // Bow
        this.context.beginPath();
        this.context.moveTo(x, y + height);
        this.context.quadraticCurveTo(10, 400, barX, barY);
        this.context.stroke();

        // Chart
        this.drawEmotionChart(emotionalData);
    }

    private drawFaceMarkerInactive(emotionalData: any, index: number): void {
        const x: number = emotionalData.faceRectangle.left;
        const y: number = emotionalData.faceRectangle.top;
        const width: number = emotionalData.faceRectangle.width;
        const height: number = emotionalData.faceRectangle.height;

        this.context.strokeStyle = "#BBBBBB";
        this.context.lineWidth = 5;

        // Face rectangle
        this.context.strokeRect(x, y, width, height);
    }

    private drawEmotionChart(emotionalData: any): void {
        const barX = 10;
        const barY = canvasWidth + 25;
        const barWidth = canvasWidth - 25;
        const barHeight = 20;

        // Bar panel
        this.context.fillStyle = "#ffffff";
        this.context.fillRect(barX - 3, barY - 5, barWidth + 10, 220);

        // For each emotion
        let emotionKeys = Object.keys(emotionalData.scores);
        for (let i = 0; i < emotionKeys.length; i++) {
            let emotion = emotionKeys[i];
            let emotionToDisplay = emotion[0].toUpperCase() + emotion.substr(1);
            let startX = barX + 90;
            let startY = barY + (i * 27);
            let endWidth = this.getEmotionWidth(emotionalData.scores[emotion], barWidth - 90);
            let percentageLabel = this.getEmotionPercentage(emotionalData.scores[emotion]);
            let labelAlignment = emotionalData.scores[emotion] > 0.80 ? "right" : "left";

            this.context.fillStyle = "#E0ECF8";
            this.context.lineWidth = 5;
            this.context.fillRect(startX, startY, barWidth - 90, barHeight);

            this.tweenBarWidths[i] = {
                id: i, x: startX, y: startY, width: 0, endWidth: endWidth,
                height: barHeight, percentageLabel: percentageLabel, labelAlignment: labelAlignment
            };

            let that = this;
            let tween = new TWEEN.Tween({
                id: i, x: startX, y: startY, width: 0, endWidth: endWidth,
                height: barHeight, percentageLabel: percentageLabel, labelAlignment: labelAlignment
            });

            tween.to({ width: endWidth }, 750)
                .easing(TWEEN.Easing.Exponential.Out)
                .onUpdate(function () {
                    that.tweenBarWidths[this.id].width = this.width;
                })
                .onComplete(function () {
                    //console.log("bar-tween-end-" + this.id);
                })
                .start();
            this.drawEmotionLabel(emotionToDisplay, startX - 10, startY + 14);
        }
        this.chartAnimationLoop();
    }

    private chartAnimationLoop = () => {
        let animationComplete = true;

        this.tweenBarWidths.forEach((element, i) => {
            this.context.fillStyle = "#58ACFA";
            this.context.fillRect(element.x, element.y, element.width, element.height);
            animationComplete = animationComplete && (element.width >= element.endWidth);
            if (element.width >= element.endWidth)
                this.drawPercentageLabel(element.percentageLabel, element.labelAlignment, element.endWidth + 90 + 15, element.y + 16);
        });
        TWEEN.update();
        if (!animationComplete)
            window.requestAnimationFrame(this.chartAnimationLoop);
        else {
            TWEEN.removeAll();
            //console.log("bar-animation-complete");
        }
    }

    private drawWatermark(): void {
        const width = 100;
        const height = 25;
        const paddingX = 5;
        const paddingY = 7;

        this.context.fillStyle = "#58ACFA";
        this.context.fillRect(canvasWidth - width, canvasWidth - height, width, height);

        this.context.fillStyle = "#ffffff";
        this.context.font = "bold 16px Arial";
        this.context.textAlign = "left";
        this.context.textBaseline = "alphabetic";
        this.context.fillText("MoodCheck", canvasWidth - width + paddingX, canvasWidth - paddingY);
    }

    private drawNoFacesFound(): void {
        this.context.fillStyle = '#444444';
        this.context.globalAlpha = 0.75;
        this.context.fillRect(100, 100, 300, 300);
        this.context.fillStyle = "#ffffff";
        this.context.globalAlpha = 1;
        this.context.font = "bold 250px Arial";
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.fillText("?", canvasWidth / 2, canvasWidth / 2);
        this.context.font = "bold 25px Arial";
        this.context.fillText("No Faces detected", canvasWidth / 2, canvasWidth / 2 + 100);
    }

    private drawEmotionLabel(label, x, y): void {
        this.context.fillStyle = "#666666";
        this.context.font = "bold 16px Arial";
        this.context.textAlign = "right";
        this.context.textBaseline = "alphabetic";
        this.context.fillText(label, x, y);
    }

    private drawPercentageLabel(label, textAlign, x, y): void {
        this.context.fillStyle = textAlign == "right" ? "#ffffff" : "#666666";
        this.context.font = "bold 16px Arial";
        this.context.textBaseline = "alphabetic";
        this.context.textAlign = textAlign;
        this.context.fillText(label, textAlign == "right" ? x - 10 : x, y);
    }

    private getEmotionWidth(raw: number, totalWidth: number): number {
        return raw * totalWidth;
    }

    private getEmotionPercentage(raw: number): string {
        return (raw * 100).toFixed(2) + " %";
    }

    private faceAnimationEndedHandler = () => {
        AdminPage.addLog("faceAnimationEnded");
        if (this.emotionService.emotionData != null)
            this.drawImageToCanvas(true);
    }

    private scanAnimationEndedHandler = () => {
        AdminPage.addLog("scanAnimationEnded");
        this.drawFaceAnimation();
    }

    private emotionDataAvailableHandler = () => {
        AdminPage.addLog("emotionDataAvailable");
    }

    private onInstagramClicked(): void {
        let toast = this.toastCtrl.create({
            message: 'Todo: Instagram',
            duration: 3000
        });
        toast.present();
    }

    private onFacebookClicked(): void {
        let toast = this.toastCtrl.create({
            message: 'Todo: Facebook',
            duration: 3000
        });
        toast.present();
    }

    private onDownloadClicked(): void {
        let toast = this.toastCtrl.create({
            message: 'Todo: Download',
            duration: 3000
        });
        toast.present();
    }

    private onShareClicked(): void {
        SocialSharing.share("That's my feeling...", "MoodCheck", this.base64Image);
    }
}
