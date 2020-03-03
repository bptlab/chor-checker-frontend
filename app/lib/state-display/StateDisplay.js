export default function StateDisplay(viewer) {
  this.overlays = viewer.get('overlays');
  this.overlayIDs = [];
  this.htmlContainer;
  this.select;
  this.trace;
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

  // sequence flow marking
  const state = this.trace[stateIndex];
  for (let id in state.marking) {
    this.overlayIDs.push(this.overlays.add(id, {
      position: {
        top: 0,
        left: 0
      },
      html: `<div>${ state.marking[id].join(',') }</div>`
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
