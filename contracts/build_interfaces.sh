#!/bin/bash

node ../frontend/node_modules/.bin/abi-types-generator ../frontend/src/utils/contracts/chest.abi.json --output ../frontend/src/utils/contracts
node ../frontend/node_modules/.bin/abi-types-generator ../frontend/src/utils/contracts/resource.abi.json --output ../frontend/src/utils/contracts
node ../frontend/node_modules/.bin/abi-types-generator ../frontend/src/utils/contracts/phi.abi.json --output ../frontend/src/utils/contracts
node ../frontend/node_modules/.bin/abi-types-generator ../frontend/src/utils/contracts/staking.abi.json --output ../frontend/src/utils/contracts
node ../frontend/node_modules/.bin/abi-types-generator ../frontend/src/utils/contracts/marketplace.abi.json --output ../frontend/src/utils/contracts
node ../frontend/node_modules/.bin/abi-types-generator ../frontend/src/utils/contracts/game2.abi.json --output ../frontend/src/utils/contracts
node ../frontend/node_modules/.bin/abi-types-generator ../frontend/src/utils/contracts/gameTournament.abi.json --output ../frontend/src/utils/contracts
node ../frontend/node_modules/.bin/abi-types-generator ../frontend/src/utils/contracts/gameLending.abi.json --output ../frontend/src/utils/contracts
node ../frontend/node_modules/.bin/abi-types-generator ../frontend/src/utils/contracts/vesting/factory.abi.json --output ../frontend/src/utils/contracts/vesting
node ../frontend/node_modules/.bin/abi-types-generator ../frontend/src/utils/contracts/vesting/timelock.abi.json --output ../frontend/src/utils/contracts/vesting
node ../frontend/node_modules/.bin/abi-types-generator ../frontend/src/utils/contracts/vesting/vesting.abi.json --output ../frontend/src/utils/contracts/vesting
