import { Injectable } from '@angular/core';
import { Events, Storage, LocalStorage } from 'ionic-angular';
import { AdminPage } from '../pages/admin/admin';
import { SAVE_TO_PHOTO_ALBUM, SAVE_PROCESSED_TO_PHOTO_ALBUM, SHOW_TUTORIAL_ON_STARTUP } from '../constants';

@Injectable()
export class Settings {

    private _saveToPhotoAlbum = true;
    private _saveProcessedToPhotoAlbum = true;
    private _showTutorialOnStartup = true;

    private storage: Storage;

    constructor(public events: Events) {
        this.storage = new Storage(LocalStorage);

        this.loadSaveToPhotoAlbum();
        this.loadSaveProcessedToPhotoAlbum();
        this.loadShowTutorialOnStartup();
    }

    set saveToPhotoAlbum(value: boolean) {
        this._saveToPhotoAlbum = value;
        this.storage.set(SAVE_TO_PHOTO_ALBUM, value);
    }

    get saveToPhotoAlbum(): boolean {
        return this._saveToPhotoAlbum;
    }

    set saveProcessedToPhotoAlbum(value: boolean) {
        this._saveProcessedToPhotoAlbum = value;
        this.storage.set(SAVE_PROCESSED_TO_PHOTO_ALBUM, value);
    }

    get saveProcessedToPhotoAlbum(): boolean {
        return this._saveProcessedToPhotoAlbum;
    }

    set showTutorialOnStartup(value: boolean) {
        this._showTutorialOnStartup = value;
        this.storage.set(SHOW_TUTORIAL_ON_STARTUP, value);
    }

    get showTutorialOnStartup(): boolean {
        return this._showTutorialOnStartup;
    }

    private loadSaveToPhotoAlbum() {
        return this.storage.get(SAVE_TO_PHOTO_ALBUM).then((value) => {
            this._saveToPhotoAlbum = value;
        });
    }

    private loadSaveProcessedToPhotoAlbum() {
        return this.storage.get(SAVE_PROCESSED_TO_PHOTO_ALBUM).then((value) => {
            this._saveProcessedToPhotoAlbum = value;
        });
    }

    private loadShowTutorialOnStartup() {
        return this.storage.get(SHOW_TUTORIAL_ON_STARTUP).then((value) => {
            this._showTutorialOnStartup = value;
        });
    }
}
