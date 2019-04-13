# pebble-geocachingpro

_Geocaching Pro_ for Pebble Time watches

Based on the _Get Back To_ app from Peter Summers (https://apps.getpebble.com/applications/550bf37f1e540c856300005e) which is based on the _Get Back_ app from Samuel Rinnetmäki (https://apps.getpebble.com/applications/52cae46a6126ce093f000064). Inspired by the _Find Cache_ app also from Samuel Rinnetmäki (https://apps.getpebble.com/applications/540ca9ef1120350bc20001e0).

Thanks to Samuel and Peter for laying the foundation, building and mantaining those great apps! Your apps were the first, that got installed on my Pebble Time! I intended to use them primarly for Geocaching. (Un)fortunately they did not exactly meet all my expectations and wishes regarding my Geocaching use cases. So I just started looking if I could do anything to take those approaches even further and enhance or rebuild those apps. After a little bit investigation and analysis I decided to start with the _Get Back To_ app from Peter as a foundation.

Main issue: You can add targets (e.g. coordinates of geocaches) only via the settings page, which naturaly requires internet connectivity. Since Geocaching (at least for me) is often about stepping out into the wild wild open, the phone often lags from responsive and capable internet connectivity. Therefore I have my Geocaching app preloaded with map data and geocache information. To increase battery life of the phone I also try to minimize network connectivity to a minimum, often completely disabling WiFi and mobile network capabilities. In this scenario, I'm unfortunately not able to push a geocache location to my Pebble Time, because all of the apps mentioned above are relying on the online settings page or on receiving timeline pins for transmitting the information. That does not work out under weak or even missing mobile connectivity. And for me as a computer scientist it is also a little bit squirky to require online services to push something over from my phone to a localy connected Pebble watch.   

Here is my current plan and backlog of changes and improvements:

Backlog
- (Re)add Pebble app menu icon. Compiler error occured with Pebble SDK under Linux on Windows 10: Menu icon needs to be 25x25 pixel. Actual menu icon from cloned project is 28x28 pixel. Investigate on that. Was that changed between Pebble versions? Create correct menu icon and (re)add to project.
- Improve information and design.
- Change the color feedback while navigating from nautic scheme to a more intuitive scheme for non-nautics. Green = Getting closer, target ahead. Yellow = Getting closer but target off to the side. Red = Getting away from target, wrong direction. (L) Removed the coloring for now. (S)
- Optimize power consumption. API Calls optimieren. Hintergrundaktivität optimieren. UI optimieren auf möglichst wenig und kleinflächige E-Paper Updates. (L) Started with reduced compass messaging and less redraw activity if not in auto-mode. Next: Analyse messages and start reducing message transfer. 
- Test with Android smartphone. Test on Original Pebble and Pebble Steel. (L)
- Public release in Pebble App Store. App description. Functions. (L)
- Later: Rework UI. Geocaching App und neuen Kompass als Basis? Uhrzeit und Datum für Logs einblenden, evtl nur wenn Uhr gekickt wird. (XL)
- Later: Komplett auf Offline-Setting-Page umstellen. (L)

Active

Resolved

Closed
- 190413: Show real date instead of dummy.
- 190413: Compile with Pebble SDK under Linux on Windows 10.
- 2015? New design. 
- Improved compass acquisition. Set up filter to only receive updates for every 6°.
- Improved start in auto-mode. Disabled compass acquisition from beginning. 
- Offline-Setting-Page mit Feld für die schnelle Übernahme eines neuen Ziels. Ziel wird zu oberst in die Liste eingetragen, direkt als Ziel übernommen und die Navigation gestartet. (XL)
- Research and test out offline-setting-page options in Pebble app development. (L) Preliminary result: Encoding the setting page onboard with Data URI looks promising.
- Start navigation in auto-mode, orientation of compass locked (that is my favorized setup for approaching geocaches). (XS)
- Change app name, give credits and reference to original creators of the app foundation. (M)
- Getting the source codes of the app, setting the develop and build environment up and starting with a clean compile of the original app. (M)
- Setup Github and Pebble Cloud SDK (M)
