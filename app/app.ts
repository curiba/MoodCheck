import { Component, ViewChild } from '@angular/core';
import { ionicBootstrap, Platform, Nav } from 'ionic-angular';
import { StatusBar } from 'ionic-native';

import { RootPage } from './pages/root/root';
import { SettingsPage } from './pages/settings/settings';
import { AdminPage } from './pages/admin/admin';
import { Utils } from './providers/utils';
import { EmotionService } from './providers/emotion-service';
import { Settings} from './providers/settings';

@Component({
    templateUrl: 'build/app.html'
})
class MyApp {
    @ViewChild(Nav) nav: Nav;

    rootPage: any = RootPage;

    pages: Array<{ title: string, component: any, icon: string }>;

    constructor(public platform: Platform) {
        this.initializeApp();

        this.pages = [
            { title: 'Start', component: RootPage, icon: 'home' },
            { title: 'Settings', component: SettingsPage, icon: 'cog' },
            { title: 'Admin', component: AdminPage, icon: 'at' }
        ];
    }

    initializeApp() {
        this.platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            StatusBar.styleDefault();
        });
    }

    openPage(page) {
        // Reset the content nav to have just this page
        // we wouldn't want the back button to show in this scenario
        this.nav.setRoot(page.component);
    }
}

ionicBootstrap(MyApp, [EmotionService, Utils, Settings]);
