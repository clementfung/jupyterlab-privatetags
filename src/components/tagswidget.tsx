import {
  Cell
} from '@jupyterlab/cells';

import {
  INotebookTracker
} from '@jupyterlab/notebook';

import {
  Widget
} from '@phosphor/widgets';

import {
  write_tag
} from './celltags';

import {
  TagsToolComponent
} from './tagstool';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

export
class TagsWidget extends Widget {

  constructor(notebook_Tracker: INotebookTracker) {
    super();
    this.notebookTracker = notebook_Tracker;
    Private.setWidget(this);
    Private.renderAllTagsNode();
  }

  containsTag(tag:string, cell: Cell) {
    if (cell === null) {
      return false;
    }
    let tagList = cell.model.metadata.get("tags") as string[];
    if (tagList) {
      for (let i=0; i< tagList.length; i++){
        if (tagList[i] === tag) {
          return true;
        }
      }
      return false;
    }
  }

  activeCellContainsTag(tag: string) {
    return this.containsTag(tag, this.currentActiveCell);
  }

  selectAll(name: string) {
    let notebookPanel = this.notebookTracker.currentWidget;
    let notebook = notebookPanel.notebook;
    let first:boolean = true;
    for (let i=0; i< notebookPanel.model.cells.length; i++) {
      let currentCell = notebook.widgets[i] as Cell;
      if (this.containsTag(name, currentCell)) {
        if (first === true) {
          notebook.activeCellIndex= i;
          notebook.deselectAll();
          first =false;
        }
        else {
          notebook.select(notebook.widgets[i] as Cell);
        }
      }
    }
  }

  replaceName(oldTag: string, newTag: string) {
    let notebook = this.notebookTracker.currentWidget;
    let cells = notebook.model.cells;
    this.tagsListShallNotRefresh = true;
    for (var i=0; i<cells.length; i++) {
      let cellMetadata = cells.get(i).metadata;
      let cellTagsData = cellMetadata.get('tags') as string[];
      if (cellTagsData) {
        let results: string[] = [];
        for (var j=0; j<cellTagsData.length; j++) {
          if (cellTagsData[j] == oldTag) {
            results.push(newTag);
          } else {
            results.push(cellTagsData[j]);
          }
        }
        cellMetadata.set('tags', results);
      }
    }
    this.loadTagsForActiveCell();
    this.getAllTagsInNotebook();
    this.tagsListShallNotRefresh = false;
  }

  didFinishAddingTags(name: string) {
    write_tag(this.currentActiveCell, name, true);
    let new_tags = name.split(/[,\s]+/);
    for (var i=0; i < new_tags.length; i++) {
      this.addTagIntoAllTagsList(new_tags[i]);
    }
  }

  removeTagForSelectedCellWithName(name: string) {
    write_tag(this.currentActiveCell, name, false);
  }

  removeTagFromAllCells(name:string) {
    let notebookPanel = this.notebookTracker.currentWidget;
    let notebook = notebookPanel.notebook;
    this.tagsListShallNotRefresh = true;
    for (let i=0; i< notebookPanel.model.cells.length; i++) {
      let currentCell = notebook.widgets[i] as Cell;
      if (this.containsTag(name, currentCell)) {
        write_tag(currentCell, name, false);
      }
    }
    this.tagsListShallNotRefresh = false;
    this.loadTagsForActiveCell();
    this.getAllTagsInNotebook();
  }

  addTagIntoAllTagsList(name: string) {
    if (name === "") {
      return;
    } else if (this.allTagsInNotebook == null) {
      this.allTagsInNotebook = [name];
    } else {
      if (this.allTagsInNotebook.indexOf(name) < 0) {
        this.allTagsInNotebook.push(name);
      }
    }
  }

  addTagToActiveCell(name:string) {
    write_tag(this.currentActiveCell, name, true);
    this.loadTagsForActiveCell();
  }

  getAllTagsInNotebook() {
    let notebook = this.notebookTracker.currentWidget;
    let cells = notebook.model.cells;
    this.allTagsInNotebook = null;
    for (var i=0; i<cells.length; i++) {
      let cellMetadata = cells.get(i).metadata;
      let cellTagsData = cellMetadata.get('tags') as string[];
      if (cellTagsData) {
        for (var j=0; j<cellTagsData.length; j++) {
          let name = cellTagsData[j];
          this.addTagIntoAllTagsList(name);
        }
      }
    }
    this.renderTagLabelsForAllTagsInNotebook(this.allTagsInNotebook);
  }

  loadTagsForActiveCell() {
    if (this.currentActiveCell != null) {
      let tags = this.currentActiveCell.model.metadata.get("tags");
      Private.setTagsListFor(Private.TAGS_FOR_CELL, tags);
    }
  }

  renderTagLabelsForAllTagsInNotebook(tags: string[]) {
    Private.setTagsListFor(Private.ALL_TAGS, tags);
  }

  currentActiveCell: Cell = null;
  allTagsInNotebook: [string] = null;
  notebookTracker: INotebookTracker = null;
  tagsListShallNotRefresh = false;

}
namespace Private {
  let widget: TagsWidget = null;
  let tagsList: any = [];
  let allTagsList: any[] = [];

  export const ALL_TAGS = 0;
  export const TAGS_FOR_CELL = 1;

  export
  function setTagsListFor(type: number, list: any) {
    switch (type) {
      case ALL_TAGS:
        allTagsList = list;
        break;
      case TAGS_FOR_CELL:
        tagsList = list;
        break;
    }
    renderAllTagsNode();
  }

  export
  function setWidget(currentWidget: TagsWidget) {
    widget = currentWidget;
  }

  export
  function renderAllTagsNode() {
    ReactDOM.render(
      (<TagsToolComponent 
        widget={ widget } 
        tagsList={ tagsList } 
        allTagsList={ allTagsList } 
      />),
      widget.node
    );
  }
  
}