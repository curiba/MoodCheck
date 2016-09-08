import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Settings } from '../../providers/settings';
import { AdminPage } from '../admin/admin';


@Component({
    templateUrl: 'build/pages/settings/settings.html',
})
export class SettingsPage {

    constructor(private nav: NavController, private settings: Settings) {}
}
