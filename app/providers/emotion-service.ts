import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';
import 'rxjs/add/operator/map';

@Injectable()
export class EmotionService {

    public emotionData: any = null;
    private emotionUrl = 'https://api.projectoxford.ai/emotion/v1.0/recognize';

    constructor(private http: Http) {}

    /**
     * Calls the MS emotion endpoint with the supplied base64 encoded image.
     */
    getEmotions(base64Image: string): any {
        if (base64Image == null)
            throw new Error("base64Image must not be null!");

        let headers = new Headers();
        headers.append('Accept', 'application/json');
        headers.append('Content-Type', 'application/octet-stream');
        headers.append('Ocp-Apim-Subscription-Key', '7a4b6bc9d94c4e02b5246021321853a0');

        return this.http.post(this.emotionUrl, this.makeBlob(base64Image), { headers: headers })
            .map(response => response.json())
            .catch(this.handleError);
    }

    /**
     * Convert BASE64 encoded image to BLOB
     */
    private makeBlob(dataURL): any {
        let BASE64_MARKER = ';base64,';
        if (dataURL.indexOf(BASE64_MARKER) == -1) {
            let parts = dataURL.split(',');
            let contentType = parts[0].split(':')[1];
            let raw = decodeURIComponent(parts[1]);
            return new Blob([raw], { type: contentType });
        }

        let parts = dataURL.split(BASE64_MARKER);
        let contentType = parts[0].split(':')[1];
        let raw = window.atob(parts[1]);
        let rawLength = raw.length;
        let uInt8Array = new Uint8Array(rawLength);

        for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        return new Blob([uInt8Array], { type: contentType });
    }

    private handleError(error: any) {
        let errorMessage = (error.message) ? error.message :
            error.status ? `${error.status} - ${error.statusText}` : 'Server error (no details available)';
            
        console.log(error);
        return Observable.throw(errorMessage);
    }
}
