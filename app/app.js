import xml from './diagrams/pizzaDelivery.bpmn';
import blankXml from './diagrams/newDiagram.bpmn';
import $ from 'jquery';
import ChoreoModeler from 'chor-js/lib/Modeler';
import Reporter from './lib/validator/Validator.js';
import propertiesPanelModule from 'bpmn-js-properties-panel';
import propertiesProviderModule from './lib/properties-provider';

var modeler = new ChoreoModeler({
  container: '#canvas',
  propertiesPanel: {
    parent: '#properties-panel'
  },
  additionalModules: [
    propertiesPanelModule,
    propertiesProviderModule
  ],

  keyboard: {
    bindTo: document
  }
});

renderModel(xml);

function renderModel(newXml) {
  modeler.importXML(newXml, {
    // choreoID: '_choreo1'
  }).then(() => {
    modeler.get('canvas').zoom('fit-viewport');
  }).catch(error => {
    console.error('something went wrong: ', error);
  });
}

function saveSVG(done) {
  modeler.saveSVG(done);
}

function saveDiagram(done) {
  modeler.saveXML({ format: true }, function(err, xml) {
    done(err, xml);
  });
}

$(function() {
  const reporter = new Reporter(modeler);
  var downloadLink = $('#js-download-diagram');
  var downloadSvgLink = $('#js-download-svg');
  const validateButton = $('#js-validate');
  const propertiesPanel = $('#properties-panel');

  const modelCheckerPanel = $('#model-checker-panel');
  const propsToggle = $('#open-props');
  const modelToggle = $('#open-model-check');

  $('#model-checker-input').val(''); // clear textarea on refresh

  function indentToggles() {
    if (propsToggle.hasClass('toggle-active') || modelToggle.hasClass('toggle-active')) {
      propsToggle.addClass('toggle-overlap');
      modelToggle.addClass('toggle-overlap');
    } else {
      propsToggle.removeClass('toggle-overlap');
      modelToggle.removeClass('toggle-overlap');
    }

  }

  propsToggle.click(e => {
    propertiesPanel.toggleClass('hide-panel');
    modelCheckerPanel.addClass('hide-panel');
    $('#open-props').toggleClass('toggle-active');
    $('#open-model-check').removeClass('toggle-active');
    indentToggles();
  });

  modelToggle.click(e => {
    modelCheckerPanel.toggleClass('hide-panel');
    propertiesPanel.addClass('hide-panel');
    $('#open-model-check').toggleClass('toggle-active');
    $('#open-props').removeClass('toggle-active');
    indentToggles();
  });

  $('#submit-model').on('click',function(event) {
    const term = $('#model-checker-input').val();

    saveDiagram((err, diagram) => {

      const value = {
        term: term,
        diagram: diagram
      };

      $.ajax({
        url: 'http://localhost:3000/users', // currently just for testing
        type: 'POST',
        crossDomain: true, // currently just for testing
        data: JSON.stringify(value),
        dataType: 'json',
        success: function(response) {
          response;
          alert(response);
        },
        error: function(xhr, status, errorThrown) {
          alert(status);
        }
      });

    });

  });

  let isValidating = false;

  validateButton.click(e => {
    if (!isValidating) {
      isValidating = true;
      reporter.validateDiagram();
      $(e.target).addClass('selected');
      $(e.target).prop('title', 'Disable checking');
    } else {
      isValidating = false;
      reporter.clearAll();
      $(e.target).removeClass('selected');
      $(e.target).prop('title', 'Check diagram for problems');

    }
  });

  $('.buttons a').click(function(e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function setEncoded(link, name, data) {
    var encodedData = encodeURIComponent(data);
    if (data) {
      link.addClass('active').attr({
        'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
        'download': name
      });
    } else {
      link.removeClass('active');
    }
  }

  var exportArtifacts = debounce(function() {
    saveSVG(function(err, svg) {
      setEncoded(downloadSvgLink, 'diagram.svg', err ? null : svg);
    });
    saveDiagram(function(err, xml) {
      setEncoded(downloadLink, 'diagram.bpmn', err ? null : xml);
    });
  }, 500);

  $('#js-new-diagram').click(function(e) {
    renderModel(blankXml);
    exportArtifacts();
  });

  $('input#file-input').change(function(e) {
    var reader = new FileReader();
    var file = document.querySelector('input[type=file]').files[0];
    reader.addEventListener('load', function() {
      const newXml = reader.result;
      renderModel(newXml);
      exportArtifacts();
    }, false);

    if (file) {
      reader.readAsText(file);
    }

  });

  exportArtifacts();
  modeler.on('commandStack.changed', exportArtifacts);
  modeler.on('commandStack.changed', function() {
    if (isValidating) {
      reporter.validateDiagram();
    }
  });
  modeler.on('import.render.complete', function() {
    if (isValidating) {
      reporter.validateDiagram();
    }
  });
});

// expose bpmnjs to window for debugging purposes
window.bpmnjs = modeler;

// helpers //////////////////////

function debounce(fn, timeout) {

  var timer;

  return function() {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(fn, timeout);
  };
}