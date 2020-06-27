import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'CMD + R';

  constructor(public helpDialog: MatDialog) { }

  openHelpDialog() {
    this.helpDialog.open(HelpContentDialog);
  }
}

@Component({
  selector: 'help-content-dialog',
  templateUrl: 'help-dialog/help-content-dialog.html',
})
export class HelpContentDialog {}
