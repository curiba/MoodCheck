import { Component } from '@angular/core';

@Component({
    templateUrl: 'build/pages/admin/admin.html',
})
export class AdminPage {

    static logMessages: string[] = [];

    constructor() {}

    static addLog(message: string) {
        console.log(message);
        AdminPage.logMessages.push(message);
    }

    clearLog():void {
        AdminPage.logMessages = [];
    }

    public get messages() {
        return AdminPage.logMessages;
    }
}
