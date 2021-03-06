'use strict';

// Wrap everything in an anonymous function to avoid poluting the global namespace
(function () {
  const defaultIntervalInMin = '5';
  let savedInfo;
  // Use the jQuery document ready signal to know when everything has been initialized
  $(document).ready(function () {
    // Tell Tableau we'd like to initialize our extension
    tableau.extensions.initializeAsync({'configure': configure}).then(function() {     
      // This event allows for the parent extension and popup extension to keep their
      // settings in sync.  This event will be triggered any time a setting is
      // changed for this extension, in the parent or popup (i.e. when settings.saveAsync is called).
     


      tableau.extensions.settings.addEventListener(tableau.TableauEventType.SettingsChanged, (settingsEvent) => {
        
        updateExtensionBasedOnSettings(settingsEvent.newSettings);
        parseInfo(settingsEvent.newSettings)
      });
    });
  });

  /**
   * Shows the choose sheet UI. Once a sheet is selected, the data table for the sheet is shown
   */

   let unregisterEventHandlerFunction;

    function configure() { 
      const popupUrl = `${window.location.origin}/DisplayImagesInTable/extensionDialog.html`;
    
      tableau.extensions.ui.displayDialogAsync(popupUrl, defaultIntervalInMin, { height: 500, width: 500 }).then((closePayload) => {
        $('#inactive').hide();
        $('#active').show();

        // The close payload is returned from the popup extension via the closeDialog method.
        $('#interval').text(closePayload);
        setupRefreshInterval(closePayload);

    }).catch((error) => {
      //  ... 
      // ... code for error handling
      
    });
  }

   function showChooseSheetDialog(){
    $('#choose_sheet_buttons').empty();
    const dashboardName = tableau.extensions.dashboardContent.dashboard.name;
    
    const textFormat2 = $('<h4><font color="white">Select your sheet with the URL of the image</font></h4>');
    $('#choose_sheet_buttons').append(textFormat2);
    const worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
    worksheets.forEach(function (worksheet) {
      // Declare our new button which contains the sheet name
      const button = createButton(worksheet.name);

      // Create an event handler for when this button is clicked
      button.click(function () {
        // Get the worksheet name which was selected
        const worksheetName = worksheet.name;

        // Close the dialog and show the data table for this worksheet
        tableau.extensions.settings.saveAsync().then(function () {
        $('#choose_sheet_dialog').modal('toggle');
        showChooseSelectionDialog(worksheetName);
      });
        
      });

      // Add our button to the list of worksheets to choose from
      $('#choose_sheet_buttons').append(button);
    });

    // Show the dialog
    $('#choose_sheet_dialog').modal('toggle');

   }

   function showChooseSelectionDialog(worksheetName){
    const worksheet = getSelectedSheet(worksheetName);
    const text = "Select the URL of the image to display";
    const textFormat = $('<h4><font color="white">Select the field that indicated the URL of the image to display</font></h4>');
    
    $('#choose_image_buttons').append(textFormat);
    //$('#choose_image_dialog').text(worksheet.name);
    worksheet.getSummaryDataAsync().then(function(data) {
      const columnsTable = data.columns;
      
      columnsTable.forEach(function (name) {
        const button2 = createButton(name.fieldName);
        button2.click(function () {
          const fieldName = name.fieldName;
          tableau.extensions.settings.set('field', fieldName);
          tableau.extensions.settings.saveAsync().then(function () {
          $('#choose_image_dialog').modal('toggle');
          returnURL(worksheetName,fieldName);
        });
        
        });

        $('#choose_image_buttons').append(button2);
      });
    });
    
    $('#choose_image_dialog').modal('toggle');
    //returnURL(worksheetName);
   }


  function getSelectedSheet (worksheetName) {
    // go through all the worksheets in the dashboard and find the one we want
    return tableau.extensions.dashboardContent.dashboard.worksheets.find(function (sheet) {
      return sheet.name === worksheetName;
    });
  }


  function displayImages(images,columnsData,columnsName){
    $('#selected_marks').empty();
    const header = $(`<th><center>Images</center></th>`);
    $('#selected_marks').append(header);
    var tableHeader;
    for (var i = 0; i < columnsName.length; i++) {
      
      tableHeader = $(`<th><center>${columnsName[i]}</center></th>`);
      $('#selected_marks').append(tableHeader);
    }

    for (var i = 0; i < images.length; i++) {
      var str = images[i][0]+" ";
      var tableImages = str.split(",");
      const start = $(`<tr>`);
      $('#selected_marks').append(start);
      const image = $(`<td><center><img src="
      ${tableImages}"width="150" height="150"></center></td>`);
      $('#selected_marks').append(image);
      for (var j = 0; j < columnsName.length; j++) {

          const test = $(`<td><center>${columnsData[i*columnsName.length+j]}</center></td>`);
          $('#selected_marks').append(test);
        
        
        
      }
      

   }



    
    
    
   
  }

   function updateExtensionBasedOnSettings(settings) {
    if (settings) {
      savedInfo = settings;
    }
  }

  function createButton (buttonTitle) {
    const button =
    $(`<button type='button' class='btn btn-default btn-block'>
      ${buttonTitle}
    </button>`);
    return button;
  }

  // This variable will save off the function we can call to unregister listening to marks-selected events


 

  function initializeButtons () {
    $('#show_choose_sheet_button').click(showChooseSheetDialog);
  }

  function getSelectedSheet (worksheetName) {
    // go through all the worksheets in the dashboard and find the one we want
    return tableau.extensions.dashboardContent.dashboard.worksheets.find(function (sheet) {
      return sheet.name === worksheetName;
    });
  }

  function parseInfo(settings){
    if (unregisterEventHandlerFunction) {
      unregisterEventHandlerFunction();
    }
    var worksheetsName = settings.sheet;
    const worksheet = getSelectedSheet(worksheetsName);
    unregisterEventHandlerFunction = worksheet.addEventListener(tableau.TableauEventType.FilterChanged, function (selectionEvent) {
      console.log(savedInfo);
      parseInfo(savedInfo);
    });
    var indexImage = settings.selectedImage[1];
    var cleanIndex = settings.selectedColumns.slice(1, settings.selectedColumns.length - 1);
    var indexColumnstable = cleanIndex.split(",");
    var columnsName = [];
    var columnsData = [];
     worksheet.getUnderlyingDataAsync().then(function (marks) {      
      const worksheetData = marks;
      
      for (var i = 0; i < indexColumnstable.length; i++) {
        var index = indexColumnstable[i];
        //console.log(worksheetData.columns[index]);
        columnsName.push(worksheetData.columns[index].fieldName);
      }

       const data = worksheetData.data.map(function (row) {
         const rowData = row.map(function (cell) {
          
          return cell.formattedValue;
          });
        for (var i = 0; i < indexColumnstable.length; i++) {
          var index2 = indexColumnstable[i];
          columnsData.push(rowData[index2]);
      }
      });
      
      
      
      const image = worksheetData.data.map(function (row) {
         const rowData = row.map(function (cell) {
          

          return cell.formattedValue;
          });
      return ([rowData[indexImage]]);
    });
      // Populate the data table with the rows and columns we just pulled out
      displayImages(image,columnsData,columnsName);
    });
  }

  function isOdd(num) { return num % 2;}


})();
