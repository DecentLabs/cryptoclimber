# Crypto Climber

Crypto trading simulator implemented in PIXI.js

## Run the game

Just clone the repo and open `index.html` in a browser. Or just check it out from my website: http://www.terraforming.earth/crypto

## Gameplay / Controls

You get a random 60 day period from Bitcoin's price history. You have to guess which way the price moves.

Hold `L` to buy and hold Bitcoin, release to sell it.
Hold `S` to short sell Bitcoin, release to close the short position.

## Deploy to my website

    aws s3 cp cryptoclimber/ s3://www.terraforming.earth/crypto/ --recursive --exclude '*' --include '*.jpg' --include '*.html'
