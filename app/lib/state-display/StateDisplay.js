import { is } from 'bpmn-js/lib/util/ModelUtil';
import { getBBox } from 'diagram-js/lib/util/Elements';

export default function StateDisplay(viewer) {
  this.viewer = viewer;
  this.overlays = viewer.get('overlays');
  this.elementRegistry = viewer.get('elementRegistry');
  this.canvas = viewer.get('canvas');
  this.overlayIDs = [];
  this.cssMarkes = [];
  this.trace;
  this.results = document.getElementById('model-checker-result');
  // viewer.on('commandStack.changed', () => this.update());
  this.initDOM();
}

StateDisplay.prototype.initDOM = function() {
  document.getElementById('submit-model').addEventListener('click', async () => {
    const property = document.getElementById('model-checker-input').innerText;
    this.clearAll();
    const result = await this.viewer.saveXML({});
    const xml = result.xml;
    const data = {
      property: property,
      diagram: xml
    };

    fetch('http://localhost:3000/', {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      body: JSON.stringify(data)
    }).then(async response => {
      if (response.status === 500) {
        throw await response.json();
      }
      return response.json();
    }).then(json => {
      console.log(json);
      if (json.result) {
        this.results.innerHTML = 'Property satisfied';
      } else {
        this.displayTrace(json.trace);
      }
    }).catch(err => {
      console.log(err);
      this.results.innerHTML = 'Error:<br />' + err.error;
    });
  });
};

StateDisplay.prototype.displayTrace = function(trace) {
  // clear previous trace and setup
  this.clearAll();
  this.trace = trace;

  // create step selection markup
  if (this.trace && this.trace.length > 0) {
    this.trace.forEach((state, index) => {
      const step = document.createElement('div');
      if (state.loop) {
        step.innerHTML = 'Loop to ' + state.loop;
      } else if (state.stuttering) {
        step.innerHTML = 'Stuttering';
      } else {
        step.innerHTML = (index + 1);
        step.addEventListener('click', e => {
          this.displayState(index);
          Array.prototype.slice.call(this.results.children).forEach(otherStep => {
            otherStep.classList.remove('state-active');
          });
          step.classList.add('state-active');
        });
      }
      this.results.appendChild(step);
    });
    this.displayState(0);
  } else {
    this.results.innerHTML = 'Property violated, but no trace returned';
  }
};

// StateDisplay.prototype.addTaskHighlight = function(stateIndex) {
//   const currentTx = this.trace[stateIndex].curTx;
//   if (currentTx.type === 'TaskTx') {
//     const shape = this.elementRegistry.get(currentTx.target);
//     this.overlayIDs.push(this.overlays.add(shape.id, {
//       position: {
//         top: -10,
//         left: -10
//       },
//       html: `<div class="circle-overlay task-active">${ this.trace[stateIndex].timestamp }</div>`
//     }));
//     this.canvas.addMarker(shape.id, 'highlight');
//     this.cssMarkes.push(shape.id);
//   }
// };

// StateDisplay.prototype.addMessageValues = function(stateIndex) {
//   const messageValues = this.trace[stateIndex].messageValues;
//   for (let taskID in messageValues) {
//     const task = this.elementRegistry.get(taskID);
//     const message = task.businessObject.messageFlowRef.find(
//       ref => ref.sourceRef === task.businessObject.initiatingParticipantRef).messageRef;
//     const messageShape = this.elementRegistry.get(message.id);
//     if (messageShape.hidden === false) {
//       this.overlayIDs.push(this.overlays.add(message.id, {
//         position: {
//           top: 3,
//           left: 6
//         },
//         html: `<div class="circle-overlay message-value">${ messageValues[taskID] }</div>`
//       }));
//     }
//   }
// };

StateDisplay.prototype.displayState = function(stateIndex) {
  this.clearOverlay();
  this.addSequenceFlowTraces(stateIndex);
  // this.addTaskHighlight(stateIndex);
  // this.addMessageValues(stateIndex);
};

StateDisplay.prototype.addSequenceFlowTraces = function(stateIndex) {
  const state = this.trace[stateIndex];
  state.marking.forEach(id => {

    // calculate position of the overlay
    const element = this.elementRegistry.get(id);
    let topOffset = 0;
    let leftOffset = 0;
    if (is(element, 'bpmn:SequenceFlow')) {
      const bbox = getBBox([element]);
      if (element.waypoints.length > 2) {
        const target = element.waypoints[Math.floor(element.waypoints.length / 2)];
        leftOffset = target.x - bbox.x;
        topOffset = target.y - bbox.y;
      } else {
        leftOffset = bbox.width / 2;
        topOffset = bbox.height / 2;
      }
    }

    // add overlay
    this.overlayIDs.push(this.overlays.add(id, {
      position: {
        top: topOffset - 10,
        left: leftOffset - 10
      },
      html: `<div class="circle-overlay flow-active">${ state.age[id] }</div>`
    }));
  });
};

StateDisplay.prototype.clearOverlay = function() {
  this.overlayIDs.forEach(id => this.overlays.remove(id));
  this.cssMarkes.forEach(id => this.canvas.removeMarker(id, 'highlight'));
};

StateDisplay.prototype.clearAll = function() {
  this.clearOverlay();
  this.results.innerHTML = '';
};
