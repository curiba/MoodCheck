import {Injectable} from '@angular/core';
import {Alert, AlertController} from 'ionic-angular';

@Injectable()
export class Utils {

    constructor(private alertCtrl: AlertController) { }

    scaleImage(srcwidth, srcheight, targetwidth, targetheight, fLetterBox = true) {
        let result: any = { width: 0, height: 0, fScaleToTargetWidth: true };

        if ((srcwidth <= 0) || (srcheight <= 0) || (targetwidth <= 0) || (targetheight <= 0)) {
            return result;
        }

        // scale to the target width
        let scaleX1 = targetwidth;
        let scaleY1 = (srcheight * targetwidth) / srcwidth;

        // scale to the target height
        let scaleX2 = (srcwidth * targetheight) / srcheight;
        let scaleY2 = targetheight;

        // now figure out which one we should use
        let fScaleOnWidth = (scaleX2 > targetwidth);
        if (fScaleOnWidth) {
            fScaleOnWidth = fLetterBox;
        }
        else {
            fScaleOnWidth = !fLetterBox;
        }

        if (fScaleOnWidth) {
            result.width = Math.floor(scaleX1);
            result.height = Math.floor(scaleY1);
            result.fScaleToTargetWidth = true;
        }
        else {
            result.width = Math.floor(scaleX2);
            result.height = Math.floor(scaleY2);
            result.fScaleToTargetWidth = false;
        }
        result.targetleft = Math.floor((targetwidth - result.width) / 2);
        result.targettop = Math.floor((targetheight - result.height) / 2);

        return result;
    }

    createSimpleAlert(title: string, message: string): void {
        let alert = this.alertCtrl.create({
            title: title,
            message: message,
            buttons: [
                {
                    text: 'Ok'
                }
            ]
        });
        alert.present();
    }

    createDefaultApologize(): void {
        this.createSimpleAlert('Sorry!', 'That should not be happen.<br>Please try again later.');
    }
}
