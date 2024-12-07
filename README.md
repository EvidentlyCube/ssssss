# Separately Steered Simultaneous Sword Stabbing Simulator

This is the repository of SSSSSS, a two-player puzzle game that plays almost like DROD (Deadly Rooms of Death).
If you've never played DROD before it might be a little tough, since the difficult curve is all over the place.

You can play the game here: https://ssssss.evidentlycube.com

Docker image for the game: https://hub.docker.com/repository/docker/evidentlycube/ssssss/general

## How to run it locally

1. Clone the repository
2. Run `npm i`
3. Copy `config.example.json` to `config.json` and update the settings
4. Run `node app.js`
5. Open `localhost:3000` in two tabs in your browser of choice

There is no automatic server restart on change, so you need to hit `Ctrl+C` to kill it and run `node app.js` again to restart it.

## History

Originally the project was called DROD Online and was released on [Caravel Games forums](https://forum.caravelgames.com/) on
April Fool's 2018, a joke game... And a way to prove some people that multiplayer DROD is indeed possible and can be fun.

## Making new rooms

If you're interested in creating new rooms, do the following:
 - Grab a copy of DROD The Second Sky, can even be the [demo version](https://caravelgames.com/Articles/Games_2/DownloadTSS.html).
 - Download the [levelset hold file](https://github.com/EvidentlyCube/ssssss/raw/main/Backend/official_levelset.hold)
 - Import it into DROD
 - Open DROD editor
 - Make a copy of the `[TEMPLATE]` level (the game will ask you if you want to make a copy of the hold, say yes)
 - Rename the `[TEMPLATE]` level to the name you want to be displayed as
 - Make the rooms!

