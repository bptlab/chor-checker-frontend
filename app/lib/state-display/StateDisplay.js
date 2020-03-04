import { getBBox } from 'diagram-js/lib/util/Elements';

export default function StateDisplay(viewer) {
  this.overlays = viewer.get('overlays');
  this.elementRegistry = viewer.get('elementRegistry');
  this.overlayIDs = [];
  this.htmlContainer;
  this.select;
  this.trace;
  viewer.on('commandStack.changed', () => this.update());
}

StateDisplay.prototype.displayTrace = function(trace, htmlContainer) {
  // clear previous trace and setup
  this.clearAll();
  this.htmlContainer = htmlContainer;
  this.trace = trace;

  // create selection dropdown element
  this.select = document.createElement('select');
  this.trace.forEach((state, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.innerHTML = index;
    this.select.appendChild(option);
  });

  // listen to changes when using the dropdown
  const self = this;
  this.select.addEventListener('change', event => {
    self.displayState(self.select.selectedIndex);
  });

  // plug the dropdown into the page
  this.htmlContainer.appendChild(this.select);
  this.displayState(0);
};

StateDisplay.prototype.displayState = function(stateIndex) {
  this.clearOverlay();
  this.addSequenceFlowTraces(stateIndex);
};

StateDisplay.prototype.update = function() {
  this.clearOverlay();
  if (this.select && this.select.selectedIndex !== undefined) {
    this.addSequenceFlowTraces(this.select.selectedIndex);
  }
};

StateDisplay.prototype.addSequenceFlowTraces = function(stateIndex) {
  const state = this.trace[stateIndex];
  for (let id in state.marking) {
    const sf = this.elementRegistry.get(id);
    const bbox = getBBox([sf]);
    let topOffset = 0;
    let leftOffset = 0;
    if (sf.waypoints.length > 2) {
      const target = sf.waypoints[Math.floor(sf.waypoints.length / 2)];
      leftOffset = target.x - bbox.x;
      topOffset = target.y - bbox.y;
    } else {
      leftOffset = bbox.width / 2 - 6; // 6 for the arrow
      topOffset = bbox.height / 2;
    }
    const cssClass = state.marking[id][0] ?'flow-marking-active' :'flow-marking-inactive';

    this.overlayIDs.push(this.overlays.add(id, {
      position: {
        top: topOffset - 10,
        left: leftOffset - 10
      },
      html: `<div class=${cssClass}><div class="timestamp">${state.marking[id][1]}</div></div>`
    }));
  }
};

StateDisplay.prototype.clearOverlay = function() {
  this.overlayIDs.forEach(id => this.overlays.remove(id));
};

StateDisplay.prototype.clearAll = function() {
  this.clearOverlay();
  if (this.htmlContainer && this.select) {
    this.htmlContainer.removeChild(this.select);
  }
};
