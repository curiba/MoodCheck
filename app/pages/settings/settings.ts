import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Settings } from '../../providers/settings';
import { AdminPage } from '../admin/admin';

import * as TWEEN from 'tween.js';


@Component({
    templateUrl: 'build/pages/settings/settings.html',
})
export class SettingsPage {

    tween = new TWEEN.Tween({ x: 0, y: 0 });

    constructor(private nav: NavController, private settings: Settings) {

        this.tween.to({ x: 200 }, 5000);
        this.tween.onUpdate(function () {
            console.log(this.x);
        });
        this.tween.start();

    }

    onTween(): void {
        console.log("tween");
        TWEEN.update();
    }
}
