// Disable console for production or comment this line out to enable it for debugging.
//console.log = function() {};

var initialized = false;
var divider = 1000000;
var interval;            // How frequently to return results to the watch, or zero to run continuously.
var runtime;             // If not running continuously, how long to run the location watcher in seconds, or zero to do single reads;
var myLat = 0;
var myLong = 0;
var refLat, refLong;     // Reference point latitude and longitude.
var bearing = -1;        // Bearing of the reference point from the current location;
var distance = "";       // A string representation of the distance between the reference point to the current location;
var imperial = false;    // Default is metric measurements.
var yardLength = 0.9144; // Length of a yard in metres.
var footLength = yardLength / 3;
var yardsInMile = 1760;  // Length of a mile in yards.
var R = 6371000;         // Radius of the earth in metres.
var locationInterval;    // The Interval timer for the repeated results that are returned to the watch.
var locationWatcher;     // The Watcher that manages the readings from the GPS that are used to get a result to return to the watch.
var locationTimer;       // The Timer that gets a result at the end of the run of readings;
var firstOfRun;          // True for the first result in a run, which is old invalid data for some weird reason.
var settingReference;    // True when setting the reference location.
var settingPin = false;  // True when setting a pin on the timeline.
var gettingInfo = false; // True when getting location information.
var locationOptions = {timeout: 9000, maximumAge: 0, enableHighAccuracy: true };
var myAccuracy, mySpeed, myHeading, myAltitude, myAltitudeAccuracy;  // Readings from the GPS.
var setPebbleToken = "MREE";
var degreesInRadian = 180 / Math.PI;
var numberOfLocations = 20;
var locationNumber;
var locations = ["0"];   // Used to store favorite locations.
var proximityAlert, proximityAlertDistance;  // Distance within which to fire the proximity alert and whether one has been fired.
var plusorminussymbol = "\u00B1";
var hintMessage = "";
var locationsNeedSending = false;
var uri = "http://x.setpebble.com/" + setPebbleToken + "/" + Pebble.getAccountToken();

/* Create Base64 Object, 
 * Code courtesy of Nicholas Cerminara, Twitter: @nickforthough, 
 * Source: https://gist.github.com/ncerminara/11257943
 * Code below with some slight corrections to get it working. 
 */
var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64;}else if(isNaN(i)){a=64;}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a);}return t;},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r);}if(a!=64){t=t+String.fromCharCode(i);}}t=Base64._utf8_decode(t);return t;},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128);}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128);}}return t;},_utf8_decode:function(e){var t="";var n,r,c1,c2;n=r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++;}else if(r>191&&r<224){c1=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c1&63);n+=2;}else{c1=e.charCodeAt(n+1);c2=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c1&63)<<6|c2&63);n+=3;}}return t;}};

/* Next: Build a simple configuration page with one text input field and a cancel / submit option.
 * Display that text in the watch app on the Pebble. 
 */
var configHtml;
configHtml  = "<html><head></head><body>";
configHtml += "<p>Hi, I'm an offline Pebble configuration page!</p>";
configHtml += "<p><textarea cols='40' rows='1' id='input'></textarea></p>";
configHtml += "<p><button id='save_button'>Set as new location</button></p>";
configHtml += "<p><a href='" + uri + "'>Go to online configuration</button></p>";
configHtml += "<script>";
configHtml += "function saveOptions() {";
  configHtml += "return {";
    configHtml += "input : document.getElementById(\"input\").value";
  configHtml += "};";
configHtml += "};";
configHtml += "document.getElementById(\"save_button\").addEventListener(\"click\", function() {";
  configHtml += "document.location = \"pebblejs://close#\" + encodeURIComponent(JSON.stringify(saveOptions()));";
configHtml += "}, false);";
configHtml += "</script>";
//configHtml += "<p><a href='javascript:document.location=\"pebblejs://close#\" + encodeURIComponent(JSON.stringify(saveOptions()))'>Working save options</a></p>";
//configHtml += "<p><a href='javascript:document.location=\"pebblejs://close#\" + encodeURIComponent(JSON.stringify({input:document.getElementById(\"input\").value}))'>Working a href</a></p>";
configHtml += "</body></html>";

Pebble.addEventListener("ready", function(e) {
  refLat = parseFloat(localStorage.getItem("lat2")) || null;
  refLong = parseFloat(localStorage.getItem("lon2")) || null;
  interval = parseInt(localStorage.getItem("interval")) || 0;
  runtime = parseInt(localStorage.getItem("runtime")) || 0;
  imperial = (parseInt(localStorage.getItem("imperial")) == 1);
  proximityAlertDistance = parseInt(localStorage.getItem("proximity")) || 0;
  console.log("proximityAlertDistance = " + proximityAlertDistance);
  
  populateMenu();
  if (runtime > 0) {
    var msg = {
      "location0": locations[0], "location1": locations[1], "location2": locations[2], "location3": locations[3], "location4": locations[4],
      "location5": locations[5], "location6": locations[6], "location7": locations[7], "location8": locations[8], "location9": locations[9],
      "location10": locations[10], "location11": locations[11], "location12": locations[12], "location13": locations[13], "location14": locations[14],
      "location15": locations[15], "location16": locations[16], "location17": locations[17], "location18": locations[18], "location19": locations[19] };
    sendMessage(msg);
  } else locationsNeedSending = true;

  // Get a reference point if we don't have one.
  settingReference = ((refLat === null) || (refLong === null));
  startGettingLocation();
  initialized = true;
  console.log("JavaScript app ready and running! " + e.type, e.ready, "refLat="+refLat, " refLong="+refLong, " interval="+interval, " runtime="+runtime, " imperial="+imperial);
});

function setReference(reference) {
    var colonIndex = reference.indexOf(": ");
    if (colonIndex > 0)
      reference = reference.slice(colonIndex+1,reference.length);
    reference = reference.trim();
    var spaceIndex = reference.indexOf(" ");
    if (spaceIndex > 0) {
      refLat = parseFloat(reference.slice(0,spaceIndex));
      refLong = parseFloat(reference.slice(spaceIndex+1,reference.length));
      if (reference[spaceIndex-1] == 'S') refLat = -refLat;
      if (reference[reference.length-1] == 'W') refLong = -refLong;
      localStorage.setItem("lat2", refLat);
      localStorage.setItem("lon2", refLong);
    } else {
      settingReference = true;
    }
    console.log("Reference string = " + reference, "refLat = " + refLat, "refLong = "+refLong);
    startGettingLocation();
    return 0;
}    

Pebble.addEventListener("appmessage",
  function(e) {
    if (e && e.payload && e.payload.cmd) {
      console.log("Got command: " + e.payload.cmd);
      switch (e.payload.cmd) {
        case 'set':    // Set the reference point to the current location.
          settingReference = true;
          startGettingLocation();
          break;
        case 'set0': case 'set1':case 'set2':case 'set3':case 'set4':case 'set5':case 'set6':case 'set7':case 'set8':case 'set9':
        case 'set10': case 'set11':case 'set12':case 'set13':case 'set14':case 'set15':case 'set16':case 'set17':case 'set18':case 'set19':
          locationNumber = Number((e.payload.cmd).substring(3));
          var reference = locations[locationNumber];
          console.log("Reference string = " + reference);
          setReference(reference);
        break;
        case 'get':    // Restart the acquisition process.
          startGettingLocation();
          break;
        case 'inf':    // Get location information.
          gettingInfo = true;
          startGettingLocation();
          break;
        case 'pin':    // Set a pin.
          settingPin = true;
          startGettingLocation();
          break;
        case 'quit':
          clearInterval(locationInterval);
          navigator.geolocation.clearWatch(locationWatcher);
          clearTimeout(locationTimer);
          break;
        default:
          if (parseInt(e.payload.cmd) > 0) {
            console.log("PinID: " + e.payload.cmd);
            reference = localStorage.getItem(e.payload.cmd);
            spaceIndex = reference.indexOf(" ");
            if (spaceIndex > 0) {
              refLat = parseFloat(reference.slice(0,spaceIndex));
              refLong = parseFloat(reference.slice(spaceIndex+1,reference.length));
              localStorage.setItem("lat2", refLat);
              localStorage.setItem("lon2", refLong);
            } 
          } else
            console.log("Unknown command: " + e.payload.cmd);
      }
    }
  }
);

Pebble.addEventListener("showConfiguration",
  function() {
    console.log("Show configuration");
    //var uri = "http://x.setpebble.com/" + setPebbleToken + "/" + Pebble.getAccountToken();
    var uri = 'data:text/html;charset=utf-8;base64,' + Base64.encode(configHtml);
    Pebble.openURL(uri);
  }
);

Pebble.addEventListener("webviewclosed",
  function(e) {
    console.log("Webview window returned: " + e.response);
    var options = JSON.parse(decodeURIComponent(e.response));
    if(options.input)  {
      console.log("Response input: " + options.input);
      /*locations[0] = options.input;
      setReference(locations[0]);
      Pebble.showSimpleNotificationOnPebble("Set location to: ", locations[0]);*/
      setReference(options.input);
      Pebble.showSimpleNotificationOnPebble("Geocaching Pro: ", options.input);
    }
    else {      
      console.log("Online configuration: " + options);
      imperial = (options["1"] === 1);
      console.log("Units set to: " + (imperial ? "imperial" : "metric"));
      localStorage.setItem("imperial", (imperial ? 1 : 0));
      interval = parseInt(options["2"] || 10);
      console.log("Interval set to: " + interval);
      localStorage.setItem("interval", interval);
      runtime = parseInt(options["3"] || 5);
      console.log("RunTime set to: " + runtime);
      localStorage.setItem("runtime", runtime);
      proximityAlertDistance = parseInt(options["4"] || 0);
      console.log("Proximity Alert set to: " + proximityAlertDistance);
      localStorage.setItem("proximity", proximityAlertDistance);
      for	(locationNumber = 0; locationNumber < numberOfLocations; locationNumber++) {
        locations[locationNumber] = options[9+locationNumber];
        localStorage.setItem("location"+locationNumber, locations[locationNumber]);
      }
      populateMenu();   
    }
    if (runtime > 0) {
      var msg = {
        "location0": locations[0], "location1": locations[1], "location2": locations[2], "location3": locations[3], "location4": locations[4],
        "location5": locations[5], "location6": locations[6], "location7": locations[7], "location8": locations[8], "location9": locations[9],
        "location10": locations[10], "location11": locations[11], "location12": locations[12], "location13": locations[13], "location14": locations[14],
        "location15": locations[15], "location16": locations[16], "location17": locations[17], "location18": locations[18], "location19": locations[19] };
      sendMessage(msg);
    } else locationsNeedSending = true;
    startGettingLocation();
  }
);

function populateMenu() {
  // Read in favorite locations.
  for	(var locationNumber = 0, index = 0; index < 10; index++) {
    locations[locationNumber] = (localStorage.getItem("location"+index) || "");
    console.log("location number " + locationNumber + " = " + locations[locationNumber]);
    if (locations[locationNumber] !== "") locationNumber++;
  }
  // Read in timestamps and clean up after excess pins if they're >3 days old.
  var date = new Date();
  var oldestPinID = Math.round(date.getTime()/1000)-(3*24*60*60);
  for (index = localStorage.length-1; index >= 0; index--) {
    if (localStorage.key(index).valueOf() > 1000000) {
      if (locationNumber < numberOfLocations) {
        date = new Date(1000*localStorage.key(index));
        var dateString = date.toString();
        locations[locationNumber++] = dateString.substring(4,7)+dateString.substring(8,10)+" "+dateString.substring(16,22)+" "+
          localStorage.getItem(localStorage.key(index));
        console.log("Keeping "+localStorage.key(index));
      } else 
        if (localStorage.key(index).valueOf() < oldestPinID) localStorage.removeItem(localStorage.key(index));
    }
  }
}

function sendMessage(dict) {
  Pebble.sendAppMessage(dict, appMessageAck, appMessageNack);
  console.log("Sent message to Pebble! " + JSON.stringify(dict));
}

function appMessageAck(e) {
  console.log("Message accepted by Pebble!");
}

function appMessageNack(e) {
  console.log("Message rejected by Pebble! " + e.error);
  console.log("Message rejected by Pebble! " + e.error.message);
}

function startGettingLocation() {
  myAccuracy = 999999;
  navigator.geolocation.clearWatch(locationWatcher);
  if (runtime >= interval) {
    locationWatcher = navigator.geolocation.watchPosition(locationSuccess, locationError, locationOptions);
  } else 
    if (interval > 0) getLocation();
  if (interval > 0) {
    clearInterval(locationInterval);
    locationInterval = setInterval(getLocation, 1000 * interval);
    console.log("Location interval ID = " + locationInterval);
  }
}

function getLocation() {
//  sentToWatch = false;
  console.log("Acquring a single result for the watch after " + interval + " seconds.");
  if (runtime >= interval) { 
    console.log("Calling sendToWatch.");
    sendToWatch();
    myAccuracy = 999999;
  } else if (runtime > 0) {  
    firstOfRun = true;
    myAccuracy = 999999;
    locationWatcher = navigator.geolocation.watchPosition(locationSuccess, locationError, locationOptions);
    console.log("Running locationWatcher " + locationWatcher + " for " + runtime + " seconds.");
    locationTimer = setTimeout(sendToWatch, 1000*runtime);
  } else /* runtime = 0 */ {
    firstOfRun = false;
    console.log("Calling getCurrentPosition.");
    navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
  }
}

function locationSuccess(pos) {
  console.log("Processing a successful GPS reading: lat=" + pos.coords.latitude, "long=" + pos.coords.longitude, "accuracy=" + pos.coords.accuracy + " at " + (pos.timestamp/1000).toFixed(2));
  console.log("first=" + firstOfRun, "watcher=" + locationWatcher);
  if ((interval > 0) && (runtime > 0)) {
    if (!firstOfRun) {   // First of a run reads can bring back old data so we avoid using them.
      if (pos.coords.accuracy <= myAccuracy) {
        myAccuracy = pos.coords.accuracy;
        myLat = pos.coords.latitude;
        myLong = pos.coords.longitude;
        mySpeed = pos.coords.speed;
        myHeading = pos.coords.heading;
        myAltitude = pos.coords.altitude;
        myAltitudeAccuracy = pos.coords.altitudeAccuracy;
      } 
    }
    firstOfRun = false;
  } else {               // Interval = 0 or Runtime = 0, i.e. processing continuous data or a one-off read.
    myAccuracy = pos.coords.accuracy;
    myLat = pos.coords.latitude;
    myLong = pos.coords.longitude;
    mySpeed = pos.coords.speed;
    myHeading = pos.coords.heading;
    myAltitude = pos.coords.altitude;
    myAltitudeAccuracy = pos.coords.altitudeAccuracy;
    sendToWatch();
  }
}

function sendToWatch() {
  var msg, unit;
  if (runtime < interval) {
    navigator.geolocation.clearWatch(locationWatcher);
    console.log("Cleared locationwatcher " + locationWatcher);
  }
  clearTimeout(locationTimer);
  if (myAccuracy == 999999) return;

  console.log("Using data " + " " + myLat + " " + myLong + " " + myAccuracy + " " + mySpeed + " " + myHeading + " " + myAltitude + " " + myAltitudeAccuracy + " at " + (Date.now()/1000).toFixed(2));

  if (settingReference) {
    refLat = myLat;
    refLong = myLong;
    localStorage.setItem("lat2", refLat);
    localStorage.setItem("lon2", refLong);
    console.log(" **** Stored location " + refLat, refLong);
    hintMessage = "\nTarget set to " + "\n" + (myLat>=0 ? myLat.toFixed(5)+"N" : (-myLat).toFixed(5)+"S") + "\n" +
      (myLong>=0 ? myLong.toFixed(5)+"E" : (-myLong).toFixed(5)+"W") + "\n" + 
      plusorminussymbol + (imperial ? (myAccuracy/yardLength).toFixed(0)+"yd" : myAccuracy.toFixed(0)+"m");
    console.log(hintMessage);
    settingReference = false;
  }

  if (settingPin || gettingInfo) {
    var date = new Date();
    var pinID = Math.round(date.getTime()/1000);
    hintMessage = (myLat>=0 ? myLat.toFixed(5)+"N" : (-myLat).toFixed(5)+"S")+"\n"+
      (myLong>=0 ? myLong.toFixed(5)+"E" : (-myLong).toFixed(5)+"W") +
      ((myAccuracy === null) ? "" : ("\nAcc:"+(imperial ? (myAccuracy/yardLength).toFixed(0)+"yd" : myAccuracy.toFixed(0)+"m"))) +
      ((myAltitude === null) ? "" : ("\nAlt:"+(imperial ? (myAltitude/footLength).toFixed(0) : myAltitude.toFixed(0)) + 
      ((myAltitudeAccuracy === null) ? "" : (plusorminussymbol + (imperial ? (myAltitudeAccuracy/footLength).toFixed(0) : myAltitudeAccuracy.toFixed(0)))+
      (imperial ? "ft" : "m")))) + "\nat "+date.toTimeString().substr(0,8);
      console.log("Message = "+hintMessage);
    if (settingPin) {
      // Store the coordinates.
      localStorage.setItem(pinID.toString(), myLat.toFixed(5)+" "+myLong.toFixed(5));
      populateMenu();   
      locationsNeedSending = true;

      // Attempt to create a pin.
      try {
        var pin = {
          "id": pinID.toString(),
          "time": date.toISOString(),
          "layout": {
            "type": "genericPin",
            "title": "Location Pin",
            "tinyIcon": "system://images/NOTIFICATION_FLAG",
            "body": hintMessage.replace(plusorminussymbol,"~")
          },
          "actions": [{
            "title": "Go There",
            "type": "openWatchApp",
            "launchCode": pinID,
          }]
        };
        console.log('Writing location to pin: ' + JSON.stringify(pin));
        insertUserPin(pin, function(responseText) { console.log('Result: ' + responseText); });
      } catch(err) {/* ignore errors */}
      settingPin = false;
    }
    gettingInfo = false;
  }

  if ((Math.round(refLat*divider) == Math.round(myLat*divider)) && (Math.round(refLong*divider) == Math.round(myLong*divider))) {
    console.log("Not moved yet, still at  " + refLat, refLong);
    distance = "0";
    unit = imperial ? "yd" : "m";
    bearing = 0;
    proximityAlert = (proximityAlertDistance > 0);
  } else {
    console.log("Moved to  " + myLat, myLong);
    console.log("Found stored point " + refLat, refLong);
    var dLat = (refLat-myLat) / degreesInRadian;
    var dLon = (refLong-myLong) / degreesInRadian;
    console.log("Latitude and longitude difference (radians): " + dLat, dLon);
    var l1 = myLat / degreesInRadian;
    var l2 = refLat / degreesInRadian;
    console.log("current and stored latitudes in radians: " + l1 + ',' + l2);

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(l1) * Math.cos(l2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    distance = Math.round(R * c);
    if (imperial) {
      distance = distance / yardLength;
      proximityAlert = (distance < proximityAlertDistance);
      if (distance < yardsInMile) {
        distance = distance.toFixed(0);
        unit = "yd";
      } else {
        distance = distance / yardsInMile;
        distance = distance.toFixed(distance < 9.995 ? 2 : (distance < 99.95 ? 1 : 0));
        unit = "mi";
      } 
    } else /* metric */ {
      proximityAlert = (distance < proximityAlertDistance);
      if (distance < 1000) {
        distance = distance.toFixed(0);
        unit = "m";
      } else {
        distance = distance / 1000;
        distance = distance.toFixed(distance < 9.995 ? 2 : (distance < 99.95 ? 1 : 0));
        unit = "km";
      } 
    }
    
    var y = Math.sin(dLon) * Math.cos(l2);
    var x = Math.cos(l1)*Math.sin(l2) - Math.sin(l1)*Math.cos(l2)*Math.cos(dLon);
    bearing = Math.round(Math.atan2(y, x) * degreesInRadian);
    if (bearing < 0) bearing += 360;
  }
  
  if (mySpeed > 0.5) {
    mySpeed *= (imperial ? 2.237 : 3.6);
    mySpeed = mySpeed.toFixed((mySpeed < 99.95) ? 1 : 0);
    if ((myHeading === null) || isNaN(myHeading)) 
      myHeading = -1; 
    else {
      myHeading = Math.round(myHeading);
      if (myHeading < 0) myHeading += 360;
    }
  } else {
    mySpeed = "";
    myHeading = -1;
  }

  console.log("Calculated distance " + distance + unit, "bearing " + bearing, "speed " + mySpeed, "heading " + myHeading, "accuracy " + myAccuracy + " at " + (Date.now()/1000).toFixed(2));
  if (locationsNeedSending) {
    msg = {"distance": (proximityAlert ? "!" : "") + distance,
      "bearing":  bearing,
      "unit":     unit,
      "nextcall": (interval + runtime),
      "speed":    mySpeed,
      "accuracy": (imperial ? (myAccuracy/yardLength).toFixed(0) : myAccuracy.toFixed(0)),
      "heading":  myHeading,
      "message":  hintMessage,
      "location0": locations[0], "location1": locations[1], "location2": locations[2], "location3": locations[3], "location4": locations[4],
      "location5": locations[5], "location6": locations[6], "location7": locations[7], "location8": locations[8], "location9": locations[9],
      "location10": locations[10], "location11": locations[11], "location12": locations[12], "location13": locations[13], "location14": locations[14],
      "location15": locations[15], "location16": locations[16], "location17": locations[17], "location18": locations[18], "location19": locations[19] };
    locationsNeedSending = false;
  } else
    msg = {"distance": (proximityAlert ? "!" : "") + distance,
      "bearing":  bearing,
      "unit":     unit,
      "nextcall": (interval + runtime),
      "speed":    mySpeed,
      "accuracy": (imperial ? (myAccuracy/yardLength).toFixed(0) : myAccuracy.toFixed(0)),
      "heading":  myHeading,
      "message":  hintMessage };
  sendMessage(msg);
  hintMessage = "";
}

function locationError(error) {
  console.warn('Location error (' + error.code + '): ' + error.message);
}

/******************************* timeline lib *********************************/

// The timeline public URL root
var API_URL_ROOT = 'https://timeline-api.getpebble.com/';

/**
 * Send a request to the Pebble public web timeline API.
 * @param pin The JSON pin to insert. Must contain 'id' field.
 * @param type The type of request, either PUT or DELETE.
 * @param callback The callback to receive the responseText after the request has completed.
 */
function timelineRequest(pin, type, callback) {
  // User or shared?
  var url = API_URL_ROOT + 'v1/user/pins/' + pin.id;

  // Create XHR
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    console.log('timeline: response received: ' + this.responseText);
    callback(this.responseText);
  };
  xhr.open(type, url);

  // Get token
  Pebble.getTimelineToken(function(token) {
    // Add headers
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-User-Token', '' + token);

    // Send
    xhr.send(JSON.stringify(pin));
    console.log('timeline: request sent.');
  }, function(error) { console.log('timeline: error getting timeline token: ' + error); });
}

/**
 * Insert a pin into the timeline for this user.
 * @param pin The JSON pin to insert.
 * @param callback The callback to receive the responseText after the request has completed.
 */
function insertUserPin(pin, callback) {
  timelineRequest(pin, 'PUT', callback);
}

/**
 * Delete a pin from the timeline for this user.
 * @param pin The JSON pin to delete.
 * @param callback The callback to receive the responseText after the request has completed.
 */
function deleteUserPin(pin, callback) {
  timelineRequest(pin, 'DELETE', callback);
}

/***************************** end timeline lib *******************************/
