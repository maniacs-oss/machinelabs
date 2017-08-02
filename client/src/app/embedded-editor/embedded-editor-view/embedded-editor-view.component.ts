import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MdDialog, MdDialogRef } from '@angular/material';
import { Observable } from 'rxjs/Observable';

import { LabExecutionService } from '../../lab-execution.service';
import { EditorService } from '../../editor/editor.service';
import { LocationHelper } from '../../util/location-helper';
import { Lab, File } from '../../models/lab';

import { AceEditorComponent } from '../../editor/ace-editor/ace-editor.component';
import { NoExecutionDialogComponent } from '../no-execution-dialog/no-execution-dialog.component';

import 'rxjs/add/operator/do';
import 'rxjs/add/operator/take';

@Component({
  selector: 'ml-embedded-editor-view',
  templateUrl: './embedded-editor-view.component.html',
  styleUrls: ['./embedded-editor-view.component.scss']
})
export class EmbeddedEditorViewComponent implements OnInit {

  get lab(): Lab {
    return this.editorService.lab;
  }

  get activeFile(): File {
    return this.editorService.activeFile;
  }

  executionId: string;

  output: Observable<string>;

  @ViewChild('console') console: AceEditorComponent;

  noExecutionDialogRef: MdDialogRef<NoExecutionDialogComponent>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public editorService: EditorService,
    private labExecutionService: LabExecutionService,
    private locationHelper: LocationHelper,
    private dialog: MdDialog
  ) {}

  ngOnInit() {
    this.executionId = this.route.snapshot.paramMap.get('executionId');
    this.route.data.map(data => data['lab'])
              .subscribe(lab => {
                this.editorService.initLab(lab);
                this.editorService.selectEditorTab();
              });

    if (!this.executionId) {
      setTimeout(_ => this.showDialog());
    } else {
      this.labExecutionService.executionExists(this.executionId)
        .subscribe(exists => exists ? this.listen() : this.showDialog());
    }
  }

  listen() {
    this.editorService.selectConsoleTab();
    this.console.clear();
    let wrapper = this.editorService.listenAndNotify(this.executionId);

    wrapper.execution.take(1)
      .subscribe(execution => this.editorService.initDirectory(execution.lab.directory));

    this.output = wrapper.messages;
  }

  openInApp() {
    this.locationHelper.openInNewTab(['/editor', this.lab.id, this.executionId]);
  }

  private showDialog() {
    this.noExecutionDialogRef = this.dialog.open(NoExecutionDialogComponent, {
      disableClose: true
    });
  }
}